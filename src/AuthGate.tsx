import { useState, useEffect } from 'react';

type Mode = 'login' | 'register' | 'forgot';

const ERRORS: Record<string, string> = {
  invalid_credentials: 'Неверный email или пароль',
  user_not_found: 'Пользователь с таким email не найден',
  wrong_password: 'Неверный пароль',
  user_exists: 'Такой email уже зарегистрирован',
  email_exists: 'Такой email уже зарегистрирован',
  weak_password: 'Пароль слишком простой — минимум 8 символов',
  invalid_email: 'Некорректный email',
  totp_invalid: 'Неверный код из приложения',
  totp_required: 'Введите код из приложения-аутентификатора',
  rate_limited: 'Слишком много попыток. Подождите минуту',
  unauthorized: 'Сессия истекла, войдите заново',
};
const human = (e: any, fallback: string) => (typeof e === 'string' && ERRORS[e]) || (typeof e === 'string' && e.length < 80 ? e : fallback);

const BG_CSS = `
@keyframes ts-drift-a { 0%,100% { transform: translate3d(-12%, -8%, 0) scale(1); } 50% { transform: translate3d(8%, 6%, 0) scale(1.15); } }
@keyframes ts-drift-b { 0%,100% { transform: translate3d(10%, 12%, 0) scale(1.1); } 50% { transform: translate3d(-6%, -10%, 0) scale(0.95); } }
@keyframes ts-pulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
.ts-blob { position: absolute; border-radius: 9999px; filter: blur(100px); will-change: transform; }
.ts-blob-a { width: 46rem; height: 46rem; top: -14rem; left: -10rem; background: radial-gradient(circle, rgba(37,99,235,.38), transparent 68%); animation: ts-drift-a 34s ease-in-out infinite; }
.ts-blob-b { width: 40rem; height: 40rem; bottom: -16rem; right: -8rem; background: radial-gradient(circle, rgba(14,165,233,.26), transparent 70%); animation: ts-drift-b 42s ease-in-out infinite; }
@keyframes ts-spin { to { transform: rotate(360deg); } }
@keyframes ts-spin-rev { to { transform: rotate(-360deg); } }
@keyframes ts-core { 0%,100% { opacity: .7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes ts-halo { 0% { opacity: .5; transform: scale(.9); } 70% { opacity: 0; transform: scale(1.9); } 100% { opacity: 0; transform: scale(1.9); } }
.ts-orbit { transform-box: fill-box; transform-origin: center; }
.ts-orbit-a { animation: ts-spin 18s linear infinite; }
.ts-orbit-b { animation: ts-spin-rev 26s linear infinite; }
.ts-core { transform-box: fill-box; transform-origin: center; animation: ts-core 4.5s ease-in-out infinite; }
.ts-halo { transform-box: fill-box; transform-origin: center; animation: ts-halo 4.5s ease-out infinite; }
.group:hover .ts-orbit-a { animation-duration: 9s; }
.group:hover .ts-orbit-b { animation-duration: 13s; }
.ts-orbit, .ts-core, .ts-halo { transition: none; }
@media (prefers-reduced-motion: reduce) { .ts-blob, .ts-orbit, .ts-core, .ts-halo { animation: none; } }
`;

function Backdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#060910' }}>
      <style>{BG_CSS}</style>
      <div className="ts-blob ts-blob-a" />
      <div className="ts-blob ts-blob-b" />
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.14 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ts-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="rgba(148,197,255,.28)" strokeWidth="1" />
          </pattern>
          <radialGradient id="ts-fade" cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="ts-mask">
            <rect width="100%" height="100%" fill="url(#ts-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#ts-grid)" mask="url(#ts-mask)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060910]/90" />
    </div>
  );
}

function Logo() {
  return (
    <a href="/" aria-label="На главную"
      className="group inline-flex items-center gap-3 rounded-xl px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ts-mark" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <g className="ts-orbit ts-orbit-a">
          <ellipse cx="24" cy="24" rx="19" ry="9" transform="rotate(-32 24 24)" stroke="url(#ts-mark)" strokeWidth="2" opacity=".75" />
          <circle cx="40" cy="14.5" r="2.4" fill="#22D3EE" />
        </g>
        <g className="ts-orbit ts-orbit-b">
          <ellipse cx="24" cy="24" rx="19" ry="9" transform="rotate(32 24 24)" stroke="url(#ts-mark)" strokeWidth="2" opacity=".45" />
          <circle cx="8" cy="33.5" r="2" fill="#60A5FA" opacity=".85" />
        </g>
        <circle className="ts-halo" cx="24" cy="24" r="5" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
        <circle className="ts-core" cx="24" cy="24" r="5" fill="url(#ts-mark)" />
      </svg>
      <span className="text-2xl font-black tracking-tight text-white transition-colors group-hover:text-blue-200">
        TeleSync <span className="text-blue-400">OS</span>
      </span>
    </a>
  );
}

export default function AuthGate({ children }: { children: any }) {
  const [token, setToken] = useState(sessionStorage.getItem('app_token') || '');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onExpired = () => {
      const had = !!sessionStorage.getItem('app_token');
      sessionStorage.removeItem('app_token');
      setToken('');
      if (had) setErr(ERRORS.unauthorized);
    };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const switchMode = (m: Mode) => { setMode(m); setErr(''); setOk(''); setNeedCode(false); setCode(''); setPassword2(''); };

  const post = async (url: string, body: any) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data: any = {};
    try { data = await r.json(); } catch { /* пустой ответ */ }
    return { r, data };
  };

  const finish = (t: string) => { sessionStorage.setItem('app_token', t); setToken(t); };

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const login = async () => {
    if (!validEmail(email)) return setErr(ERRORS.invalid_email);
    if (!password) return setErr('Введите пароль');
    setBusy(true); setErr(''); setOk('');
    try {
      const { r, data } = await post('/api/auth/login', { email: email.trim(), password, code: code || undefined });
      if (!r.ok) {
        if (data.error === 'totp_required') { setNeedCode(true); setErr(ERRORS.totp_required); }
        else setErr(human(data.error, 'Ошибка входа'));
        return;
      }
      finish(data.token);
    } catch { setErr('Нет связи с сервером'); }
    finally { setBusy(false); }
  };

  const register = async () => {
    if (!validEmail(email)) return setErr(ERRORS.invalid_email);
    if (password.length < 8) return setErr(ERRORS.weak_password);
    if (password !== password2) return setErr('Пароли не совпадают');
    setBusy(true); setErr(''); setOk('');
    try {
      const { r, data } = await post('/api/auth/register', { email: email.trim(), password, name: name.trim() || undefined });
      if (!r.ok) { setErr(human(data.error, 'Не удалось создать аккаунт')); return; }
      if (data.token) finish(data.token);
      else { switchMode('login'); setOk('Аккаунт создан — войдите'); }
    } catch { setErr('Нет связи с сервером'); }
    finally { setBusy(false); }
  };

  const forgot = async () => {
    if (!validEmail(email)) return setErr(ERRORS.invalid_email);
    setBusy(true); setErr(''); setOk('');
    try {
      const { r, data } = await post('/api/auth/forgot-password', { email: email.trim() });
      if (r.status === 404) setErr('Восстановление пароля пока не подключено — напишите администратору');
      else if (!r.ok) setErr(human(data.error, 'Не удалось отправить письмо'));
      else setOk('Если такой email зарегистрирован, мы отправили на него ссылку для сброса');
    } catch { setErr('Нет связи с сервером'); }
    finally { setBusy(false); }
  };

  const submit = () => (mode === 'login' ? login() : mode === 'register' ? register() : forgot());
  const onEnter = (e: any) => e.key === 'Enter' && !busy && submit();

  if (token) return children;

  const input = 'w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-gray-500';
  const label = 'block text-xs text-gray-400 mb-1';

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4" style={{ backgroundColor: '#060910' }}>
      <Backdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-6 select-none">
          <Logo />
        </div>

        <form onSubmit={e => { e.preventDefault(); if (!busy) submit(); }} className="bg-[#0d1220]/92 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,.9)]">
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-lg bg-black/40">
              {(['login', 'register'] as Mode[]).map(m => (
                <button key={m} type="button" onClick={() => switchMode(m)}
                  className={`py-2 rounded-md text-sm font-medium transition ${mode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {m === 'login' ? 'Вход' : 'Регистрация'}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-lg font-bold mb-1">
            {mode === 'login' ? 'Вход в панель' : mode === 'register' ? 'Создать аккаунт' : 'Восстановление пароля'}
          </h1>
          <p className="text-sm text-gray-400 mb-5">
            {mode === 'login' ? 'Доступ только для авторизованных операторов'
              : mode === 'register' ? 'Рабочее пространство создаётся автоматически'
              : 'Укажите email — пришлём ссылку для сброса'}
          </p>

          {mode === 'register' && (
            <div className="mb-3">
              <label className={label}>Имя</label>
              <input className={input} placeholder="Как к вам обращаться" autoComplete="name"
                value={name} onChange={e => setName(e.target.value)} onKeyDown={onEnter} />
            </div>
          )}

          <div className="mb-3">
            <label className={label}>Email</label>
            <input className={input} placeholder="you@company.com" type="email" autoComplete="username" autoFocus
              value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onEnter} />
          </div>

          {mode !== 'forgot' && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className={label + ' mb-0'}>Пароль</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-blue-400 hover:underline">Забыли пароль?</button>
                )}
              </div>
              <div className="relative">
                <input className={input + ' pr-16'} placeholder={mode === 'register' ? 'Минимум 8 символов' : '••••••••'}
                  type={showPwd ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onEnter} />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-2 py-1">
                  {showPwd ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="mb-3">
              <label className={label}>Повторите пароль</label>
              <input className={input} type={showPwd ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                value={password2} onChange={e => setPassword2(e.target.value)} onKeyDown={onEnter} />
            </div>
          )}

          {mode === 'login' && needCode && (
            <div className="mb-3">
              <label className={label}>Код из приложения-аутентификатора</label>
              <input className={input + ' tracking-[0.4em] text-center font-mono'} placeholder="000000" inputMode="numeric" maxLength={6} autoFocus
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={onEnter} />
            </div>
          )}

          {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{err}</div>}
          {ok && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">{ok}</div>}

          <button type="submit" disabled={busy}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait font-semibold transition">
            {busy ? 'Проверяем…' : mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Отправить ссылку'}
          </button>

          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')} className="w-full mt-3 text-sm text-gray-400 hover:text-white">← Вернуться ко входу</button>
          )}
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Входя, вы соглашаетесь с <a href="/#terms" className="underline hover:text-gray-400">условиями</a> и <a href="/#privacy" className="underline hover:text-gray-400">политикой конфиденциальности</a>
        </p>
      </div>
    </div>
  );
}
