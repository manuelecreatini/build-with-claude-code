import { describe, expect, it } from 'vitest';
import { quizzes } from '../../src/data/quizzes';

describe('quizzes', () => {
  const phases = Object.keys(quizzes.en);

  it('covers the nine phases in both locales', () => {
    expect(phases).toEqual(['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']);
    expect(Object.keys(quizzes.it)).toEqual(phases);
  });

  it('has the same shape and answers in every locale', () => {
    for (const p of phases as (keyof typeof quizzes.en)[]) {
      const en = quizzes.en[p];
      const it_ = quizzes.it[p];
      expect(it_.length).toBe(en.length);
      en.forEach((q, i) => {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(it_[i].options.length).toBe(q.options.length);
        expect(it_[i].answer).toBe(q.answer);
        expect(q.answer).toBeLessThan(q.options.length);
        for (const s of [q.q, q.why, it_[i].q, it_[i].why, ...q.options, ...it_[i].options]) expect(s.trim()).not.toBe('');
      });
    }
  });
});
