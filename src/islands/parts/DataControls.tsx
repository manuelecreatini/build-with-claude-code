import { useRef, useState } from 'react';
import { t, type Locale } from '~/lib/i18n';
import { exportState, getState, importState, replaceState, resetState } from '~/lib/store';
import { downloadText } from './clipboard';

/** Export / import / reset of everything the tools saved in this browser. */
export function DataControls({ locale }: { locale: Locale }) {
  const file = useRef<HTMLInputElement>(null);
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState('');

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      replaceState(importState(await f.text()));
      setMsg(t(locale, 'tools.imported'));
    } catch {
      setMsg(t(locale, 'tools.importError'));
    }
    if (file.current) file.current.value = '';
  };

  return (
    <div className="bcc-data">
      <p className="bcc-data__note">{t(locale, 'tools.local')}</p>
      <div className="bcc-row">
        <button type="button" className="bcc-btn" onClick={() => downloadText('build-with-claude-code-progress.json', exportState(getState()), 'application/json')}>
          {t(locale, 'tools.export')}
        </button>
        <button type="button" className="bcc-btn" onClick={() => file.current?.click()}>
          {t(locale, 'tools.import')}
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        <button
          type="button"
          className="bcc-btn bcc-btn--danger"
          onClick={() => {
            if (!armed) return setArmed(true);
            resetState();
            setArmed(false);
            setMsg('');
          }}
          onBlur={() => setArmed(false)}
        >
          {armed ? t(locale, 'tools.resetConfirm') : t(locale, 'tools.reset')}
        </button>
      </div>
      {msg && (
        <p className="bcc-data__msg" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
