import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin, onCancel }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.token) onLogin(res);
    else setError(res.message || 'Error al iniciar sesión');
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const body = { email, password, nombre, rol: 'cliente', telefono: telefono || undefined };
    const resReg = await api.register(body);
    if (!resReg.usuario) {
      setLoading(false);
      return setError(resReg.error || 'Error al registrar');
    }
    const resLogin = await api.login(email, password);
    setLoading(false);
    if (resLogin.token) onLogin(resLogin);
    else setError(' Registrado. Inicia sesión.');
  };

  const contenido = (
    <div className={onCancel ? 'bg-white rounded-2xl p-6 shadow-lg border border-stone-200 max-w-sm' : 'w-full max-w-md'}>
      {onCancel && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-stone-800">Iniciar sesión</h2>
          <button onClick={onCancel} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
        </div>
      )}
      {!onCancel && (
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <img src="/diseno_web/logo.png" alt="NuConexion" className="h-9 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Bienvenido</h1>
          <p className="text-stone-400 text-sm mt-1">Accede a tu cuenta para continuar</p>
        </div>
      )}

      <div className="flex mb-7 bg-stone-100 rounded-xl p-1">
        <button onClick={() => { setModo('login'); setError(''); }}
          className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${modo === 'login' ? 'bg-white text-emerald-700 font-medium shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          Iniciar Sesión
        </button>
        <button onClick={() => { setModo('register'); setError(''); }}
          className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${modo === 'register' ? 'bg-white text-emerald-700 font-medium shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          Registrarse
        </button>
      </div>

      {modo === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Correo electrónico</label>
            <div className="relative">
              <input type="email" placeholder="correo@ejemplo.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" required />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Contraseña</label>
            <div className="relative">
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" required />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
            </div>
          </div>
          {error && <p className={`text-xs text-center ${error.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200/50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Nombre completo</label>
            <div className="relative">
              <input type="text" placeholder="Tu nombre" value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" required />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Correo electrónico</label>
            <div className="relative">
              <input type="email" placeholder="correo@ejemplo.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" required />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Contraseña</label>
            <div className="relative">
              <input type="password" placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" required />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Teléfono (opcional)</label>
            <div className="relative">
              <input type="text" placeholder="999 999 999" value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all placeholder:text-stone-300 shadow-sm" />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.022 13.022 0 012 5V3.5z" clipRule="evenodd" /></svg>
            </div>
          </div>
          {error && <p className={`text-xs text-center ${error.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200/50">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
      )}
    </div>
  );

  if (onCancel) return contenido;
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-emerald-100/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-amber-100/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-emerald-50/40 rounded-full blur-[80px]" />
      </div>
      <div className="w-full max-w-6xl flex items-center gap-12 relative">
        <div className="hidden lg:flex flex-1 flex-col items-center text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200/30">
            <img src="/diseno_web/logo.png" alt="NuConexion" className="h-16 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-emerald-900 mb-3">Pastelería Saludable</h2>
          <p className="text-emerald-700/50 max-w-sm leading-relaxed">
            Postres artesanales con ingredientes 100% naturales. El verdadero sabor está en lo saludable.
          </p>
          <div className="flex gap-3 mt-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-bold">🧁</span>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-amber-600 text-sm font-bold">🌿</span>
            </div>
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <span className="text-rose-600 text-sm font-bold">🐾</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center">{contenido}</div>
      </div>
    </div>
  );
}
