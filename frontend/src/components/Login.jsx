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
    <div className={onCancel ? 'bg-white rounded-2xl p-6 shadow-lg border border-stone-200 max-w-sm' : ''}>
      {onCancel && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-stone-800">Iniciar sesión</h2>
          <button onClick={onCancel} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
        </div>
      )}
      {!onCancel && (
        <div className="text-center mb-8">
          <img src="/diseno_web/logo.png" alt="NuConexion" className="h-14 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-stone-800">Bienvenido</h1>
          <p className="text-stone-400 text-sm mt-1">Accede a tu cuenta</p>
        </div>
      )}

      <div className="flex mb-6 bg-stone-100 rounded-xl p-1">
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
            <input type="email" placeholder="correo@ejemplo.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors placeholder:text-stone-300" required />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Contraseña</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-colors placeholder:text-stone-300" required />
          </div>
          {error && <p className={`text-xs text-center ${error.includes('') ? 'text-emerald-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Nombre completo</label>
            <input type="text" placeholder="Tu nombre" value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 placeholder:text-stone-300" required />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Correo electrónico</label>
            <input type="email" placeholder="correo@ejemplo.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 placeholder:text-stone-300" required />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Contraseña</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 placeholder:text-stone-300" required />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1.5 font-medium">Teléfono (opcional)</label>
            <input type="text" placeholder="999 999 999" value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 placeholder:text-stone-300" />
          </div>
          {error && <p className={`text-xs text-center ${error.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
      )}
    </div>
  );

  if (onCancel) return contenido;
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">{contenido}</div>
    </div>
  );
}
