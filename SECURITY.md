# Security policy

This is a static site with no backend and no accounts. The part that matters most for security
is the optional **AI coach**: visitors paste their own Anthropic API key, and the site must
never expose it.

## What to report

- Anything that could send a visitor's API key anywhere other than `api.anthropic.com`, write
  it to logs, or let another site or script read it.
- Script injection, for example through the coach's rendering of model answers, imported
  progress files or page content.
- A dependency or build step that adds third-party scripts or tracking to the site.

## How to report

Please **don't open a public issue**. Use GitHub's private reporting instead:
[Report a vulnerability](https://github.com/manuelecreatini/build-with-claude-code/security/advisories/new)
(Security tab → "Report a vulnerability").

Include what you found, how to reproduce it, and which browser you used. You will get a reply
as soon as the maintainer can look at it. Fixes are released by deploying the site, and every
visitor gets the fix on their next visit.

## Supported version

Only the live site (https://build-with-claude-code-playbook.vercel.app) and the `main` branch
are supported.

## If your key may have been exposed

Revoke it in the [Claude Console](https://console.anthropic.com/) and create a new one. In the
coach's settings, "Remove key" deletes it from your browser.
