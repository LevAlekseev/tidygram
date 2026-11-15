import { useEffect, useRef, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { useI18n } from './i18n';
import { RESEND, errText, loginPhone, loginQr, type AuthUi, type CodeInfo } from './telegram/real';

interface Prompt {
  kind: 'code' | 'password';
  hint?: string;
  info?: CodeInfo;
  resolve(value: string): void;
}

interface Ctl {
  cancelled: boolean;
}

function sameDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches;
}

/** Telegram wants the international format. People often type it the local way. */
export function normalizePhone(input: string, lang: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Russian habit: 8 999 123-45-67 means +7 999 123-45-67.
  else if (lang === 'ru' && !input.trim().startsWith('+') && digits.length === 11 && digits[0] === '8') {
    digits = '7' + digits.slice(1);
  }
  return '+' + digits;
}

export function Login({ onDone }: { onDone(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  // A phone cannot scan a QR code on its own screen, and Telegram's apps refuse to confirm
  // a login from a tg://login link, so on phones the phone number is the way in.
  const [mode, setMode] = useState<'qr' | 'phone'>(() => (sameDevice() ? 'phone' : 'qr'));
  const [qr, setQr] = useState('');
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const ctl = useRef<Ctl>({ cancelled: false });

  const makeUi = (c: Ctl): AuthUi => ({
    isCancelled: () => c.cancelled,
    onQr: (url) => {
      QRCode.toDataURL(url, { margin: 1, width: 520 }).then((data) => {
        if (!c.cancelled) setQr(data);
      });
    },
    askCode: (info) =>
      new Promise<string>((resolve) => {
        if (c.cancelled) return;
        setBusy(false);
        setPrompt({ kind: 'code', info, resolve });
      }),
    askPassword: (hint) =>
      new Promise<string>((resolve) => {
        if (c.cancelled) return;
        setBusy(false);
        setPrompt({ kind: 'password', hint, resolve });
      }),
    onError: (message) => {
      if (!c.cancelled) setErr(i18n.error(message));
    },
  });

  const run = (c: Ctl, attempt: Promise<void>) => {
    attempt
      .then(() => {
        if (!c.cancelled) onDone();
      })
      .catch((e) => {
        if (c.cancelled) return;
        const message = errText(e);
        // AUTH_USER_CANCEL follows an error that was already shown.
        if (message !== 'AUTH_USER_CANCEL') setErr(i18n.error(message));
        setBusy(false);
        setPrompt(null);
      });
  };

  useEffect(() => {
    ctl.current.cancelled = true;
    const c: Ctl = { cancelled: false };
    ctl.current = c;
    setQr('');
    setPrompt(null);
    setErr('');
    setBusy(false);
    if (mode === 'qr') run(c, loginQr(makeUi(c)));
    return () => {
      c.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    ctl.current.cancelled = true;
    const c: Ctl = { cancelled: false };
    ctl.current = c;
    setErr('');
    setBusy(true);
    run(c, loginPhone(normalizePhone(phone, i18n.lang), makeUi(c)));
  };

  // Phones and tablets cannot scan a QR code shown on their own screen.
  const isTouch = sameDevice();

  const submitPrompt = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    const answer = prompt.kind === 'code' ? value.trim() : value;
    setPrompt(null);
    setValue('');
    setErr('');
    setBusy(true);
    prompt.resolve(answer);
  };

  const error = err && (
    <p className="error" role="alert">
      {err}
    </p>
  );

  if (prompt) {
    const isCode = prompt.kind === 'code';
    return (
      <form className="login" onSubmit={submitPrompt}>
        <label htmlFor="login-input">{t(isCode ? 'codeLabel' : 'passwordLabel')}</label>
        <p className={isCode ? 'code-where' : 'muted'}>
          {isCode
            ? t(`codeVia_${prompt.info?.via ?? 'app'}`, { detail: prompt.info?.detail ?? '' })
            : t('passwordHelp')}
        </p>
        {!isCode && prompt.hint && <p className="muted">{t('hint', { hint: prompt.hint })}</p>}
        <input
          id="login-input"
          key={prompt.kind}
          type={isCode ? 'text' : 'password'}
          inputMode={isCode ? 'numeric' : undefined}
          autoComplete={isCode ? 'one-time-code' : 'current-password'}
          autoFocus
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error}
        <button className="btn primary" type="submit">
          {t('continue')}
        </button>
        {isCode && prompt.info?.canResend && (
          <button
            className="btn link"
            type="button"
            onClick={() => {
              setPrompt(null);
              setValue('');
              setErr('');
              setBusy(true);
              prompt.resolve(RESEND);
            }}
          >
            {t('resendCode')}
          </button>
        )}
      </form>
    );
  }

  if (busy) {
    return (
      <div className="login">
        <div className="spinner" />
        <p className="muted center">{t('connecting')}</p>
      </div>
    );
  }

  if (mode === 'phone') {
    return (
      <form className="login" onSubmit={submitPhone}>
        <label htmlFor="login-phone">{t('phoneLabel')}</label>
        <p className="muted">{t('phoneHelp')}</p>
        <input
          id="login-phone"
          type="tel"
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          autoFocus
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {error}
        <button className="btn primary" type="submit">
          {t('sendCode')}
        </button>
        <button className="btn link" type="button" onClick={() => setMode('qr')}>
          {t('useQr')}
        </button>
      </form>
    );
  }

  return (
    <div className="login">
      <h2>{t('loginTitle')}</h2>
      {isTouch && <p className="muted center">{t('qrOtherScreen')}</p>}
      <div className="qr">{qr ? <img src={qr} alt="QR" /> : <div className="spinner" />}</div>
      <ol className="steps">
        <li>{t('qrStep1')}</li>
        <li>{t('qrStep2')}</li>
        <li>{t('qrStep3')}</li>
      </ol>
      {error}
      <button className="btn link" type="button" onClick={() => setMode('phone')}>
        {t('usePhone')}
      </button>
    </div>
  );
}
