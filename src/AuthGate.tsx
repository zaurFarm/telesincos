import { useState, useEffect } from 'react';

export default function AuthGate({ children }: { children: any }) {
  const [token, setToken] = useState(sessionStorage.getItem('app_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onExpired = () => { sessionStorage.removeItem('app_token'); setToken(''); };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code: code || undefined })
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.error === 'totp_required') { setNeedCode(true); setErr('Введите код из приложения'); }
        else setErr(data.error || 'Ошибка входа');
        return;
      }
      sessionStorage.setItem('app_token', data.token);
      setToken(data.token);
    } catch { setErr('Нет связи с сервером'); }
    finally { setBusy(false); }
  };

  if (token) return children;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-xl p-6">
        <h1 className="text-xl font-bold mb-1">Вход в Telesincos</h1>
        <p className="text-sm text-gray-400 mb-5">Доступ только для авторизованных операторов</p>
        <input className="w-full mb-3 px-3 py-2 rounded bg-black/40 border border-white/10 outline-none"
          placeholder="Email" type="email" autoComplete="username"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full mb-3 px-3 py-2 rounded bg-black/40 border border-white/10 outline-none"
          placeholder="Пароль" type="password" autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        {needCode && (
          <input className="w-full mb-3 px-3 py-2 rounded bg-black/40 border border-white/10 outline-none tracking-widest"
            placeholder="Код из приложения" inputMode="numeric" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        )}
        {err && <div className="text-sm text-red-400 mb-3">{err}</div>}
        <button onClick={submit} disabled={busy}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium">
          {busy ? 'Проверяем...' : 'Войти'}
        </button>
      </div>
    </div>
  );
}
