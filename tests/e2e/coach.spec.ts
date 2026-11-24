import { expect, test, type Page, type Route } from '@playwright/test';

/** A fake key with the right shape. Nothing here talks to the real API: every call is mocked. */
const KEY = 'sk-ant-api03-' + 'x'.repeat(40);
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function sse(events: object[]): string {
  return events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
}

function answer(text: string, stop = 'end_turn'): string {
  return sse([
    {
      type: 'message_start',
      message: {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 1 },
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 20 } },
    { type: 'message_stop' },
  ]);
}

async function openCoach(page: Page, path = '/tools/coach/') {
  await page.goto(path);
  const coach = page.locator('.bcc-coach');
  await coach.scrollIntoViewIfNeeded();
  await expect(coach).toHaveAttribute('data-hydrated', '');
  return coach;
}

test('coach needs a key, keeps it per tab by default and sends nothing without one', async ({ page }) => {
  const apiCalls: string[] = [];
  await page.route('https://api.anthropic.com/**', (route) => {
    apiCalls.push(route.request().url());
    return route.abort();
  });
  const coach = await openCoach(page);
  const ask = coach.getByRole('button', { name: 'Ask', exact: true });

  await expect(coach.getByText('Add your Anthropic API key in Settings to start.')).toBeVisible();
  await coach.getByLabel('Your question').fill('What is a gate?');
  await expect(ask).toBeDisabled();

  await coach.getByLabel('Anthropic API key').fill('sk-proj-not-anthropic');
  await coach.getByRole('button', { name: 'Save key' }).click();
  await expect(coach.getByRole('alert')).toContainText('sk-ant-');

  await coach.getByLabel('Anthropic API key').fill(KEY);
  await coach.getByRole('button', { name: 'Save key' }).click();
  await coach.locator('summary').click();
  await expect(coach.getByText('Key …xxxx saved for this tab only.')).toBeVisible();
  const where = await page.evaluate(() => ({
    session: sessionStorage.getItem('bcc:coach-key'),
    local: localStorage.getItem('bcc:coach-key'),
    tools: localStorage.getItem('bcc:v1') ?? '',
  }));
  expect(where.session).toBe(KEY);
  expect(where.local).toBeNull();
  expect(where.tools).not.toContain('sk-ant');
  await expect(ask).toBeEnabled();

  await coach.getByRole('button', { name: 'Remove key' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('bcc:coach-key'))).toBeNull();
  await expect(ask).toBeDisabled();
  expect(apiCalls).toEqual([]);
});

test('coach streams an answer from api.anthropic.com only, then handles a refusal and a bad key', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  const headers: Record<string, string>[] = [];
  const keyHosts = new Set<string>();
  page.on('request', async (req) => {
    const h = await req.allHeaders();
    if (Object.values(h).some((v) => v.includes(KEY)) || (req.postData() ?? '').includes(KEY)) keyHosts.add(new URL(req.url()).host);
  });

  const replies = [
    () => ({ status: 200, contentType: 'text/event-stream', body: answer('Start with **Phase 0**: see [Phase 0](/phases/f0-setup/).') }),
    () => ({ status: 200, contentType: 'text/event-stream', body: answer('', 'refusal') }),
    () => ({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }),
    }),
  ];
  await page.route('https://api.anthropic.com/**', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    bodies.push(req.postDataJSON());
    headers.push(await req.allHeaders());
    const r = replies[bodies.length - 1]();
    return route.fulfill({ ...r, headers: CORS });
  });

  await page.addInitScript((key) => sessionStorage.setItem('bcc:coach-key', key), KEY);
  const coach = await openCoach(page, '/tools/coach/?page=phases/f0-setup');
  const question = coach.getByLabel('Your question');
  await expect(coach.getByLabel('Ask about a page (optional)')).toHaveValue('phases/f0-setup');
  await expect(coach.getByText('Loading the page…')).toBeHidden();

  // 1. A normal answer.
  await question.fill('Where do I start?');
  await coach.getByRole('button', { name: 'Ask', exact: true }).click();
  const reply = coach.locator('.bcc-coach__turn--assistant').first();
  await expect(reply.locator('strong')).toHaveText('Phase 0');
  await expect(reply.getByRole('link', { name: 'Phase 0' })).toHaveAttribute('href', '/phases/f0-setup/');
  await expect(reply.locator('.bcc-coach__meta')).toContainText('Claude Opus 5.5 · 1,200 input / 20 output tokens');

  const first = bodies[0];
  expect(first.model).toBe('claude-opus-5-5');
  expect(first.thinking).toEqual({ type: 'adaptive' });
  expect(first.fallbacks).toBe('default');
  expect(first).not.toHaveProperty('temperature');
  expect(headers[0].authorization).toBe(`Bearer ${KEY}`);
  expect(headers[0]['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
  const system = first.system as { text: string; cache_control?: object }[];
  expect(system[0].cache_control).toEqual({ type: 'ephemeral' });
  expect(system.map((b) => b.text).join('\n')).toContain('<page>');
  await expect(coach.getByLabel('Model')).toBeDisabled();
  await expect(coach.getByLabel('Ask about a page (optional)')).toBeDisabled();

  // 2. A refusal: the question comes back and nothing is added to the history.
  await question.fill('Something the model declines');
  await coach.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(coach.getByRole('alert')).toContainText('The model declined to answer this question.');
  await expect(question).toHaveValue('Something the model declines');
  const second = bodies[1];
  expect(second.system).toEqual(first.system);
  expect((second.messages as { role: string; content: unknown }[]).map((m) => m.role)).toEqual(['user', 'assistant', 'user']);

  // 3. A rejected key: a clear message, and the history is unchanged.
  await coach.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(coach.getByRole('alert')).toContainText('The API key was rejected.');
  expect((bodies[2].messages as unknown[]).length).toBe(3);
  await expect(coach.locator('.bcc-coach__turn')).toHaveCount(2);

  expect([...keyHosts]).toEqual(['api.anthropic.com']);
});
