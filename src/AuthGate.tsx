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
    const onExpired = () => { sessionStorage.removeItem('app_token'); setToken(''); setErr(ERRORS.unauthorized); };
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6 select-none">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,.8)]" />
          <span className="text-2xl font-black tracking-tight">TeleSync <span className="text-blue-400">OS</span></span>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl">
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

          <button type="button" onClick={submit} disabled={busy}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait font-semibold transition">
            {busy ? 'Проверяем…' : mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Отправить ссылку'}
          </button>

          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')} className="w-full mt-3 text-sm text-gray-400 hover:text-white">← Вернуться ко входу</button>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Входя, вы соглашаетесь с <a href="/#terms" className="underline hover:text-gray-400">условиями</a> и <a href="/#privacy" className="underline hover:text-gray-400">политикой конфиденциальности</a>
        </p>
      </div>
    </div>
  );
}
