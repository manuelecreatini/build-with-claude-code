import { useId, useState } from 'react';
import type { QuizQuestion } from '~/data/quizzes';

export interface QuizStrings {
  heading: string;
  intro: string;
  correct: string;
  wrong: string;
  score: string; // "{n} of {total} correct"
  retry: string;
}

interface Props {
  questions: QuizQuestion[];
  strings: QuizStrings;
}

/** End-of-phase self-check. Nothing is stored or sent anywhere. */
export default function Quiz({ questions, strings }: Props) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const baseId = useId();
  const answered = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, i) => p === questions[i].answer).length;

  return (
    <section className="bcc-quiz" aria-labelledby={`${baseId}-h`}>
      <h2 id={`${baseId}-h`}>{strings.heading}</h2>
      <p>{strings.intro}</p>
      <ol>
        {questions.map((q, qi) => {
          const choice = picked[qi];
          const done = choice !== null;
          return (
            <li key={qi}>
              <fieldset disabled={done}>
                <legend>{q.q}</legend>
                {q.options.map((opt, oi) => {
                  const state = !done ? '' : oi === q.answer ? 'right' : oi === choice ? 'wrong' : '';
                  return (
                    <label key={oi} className="bcc-quiz__opt" data-state={state || undefined}>
                      <input
                        type="radio"
                        name={`${baseId}-${qi}`}
                        checked={choice === oi}
                        onChange={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                      />{' '}
                      {opt}
                    </label>
                  );
                })}
              </fieldset>
              {done && (
                <p className="bcc-quiz__why" role="status">
                  <strong>{choice === q.answer ? strings.correct : strings.wrong}</strong> {q.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered === questions.length && (
        <p className="bcc-quiz__score">
          {strings.score.replace('{n}', String(right)).replace('{total}', String(questions.length))}{' '}
          <button type="button" onClick={() => setPicked(questions.map(() => null))}>
            {strings.retry}
          </button>
        </p>
      )}
    </section>
  );
}
