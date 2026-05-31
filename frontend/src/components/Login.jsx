import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin, onCancel }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');
  const [rolReg, setRolReg] = useState('cliente');
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
    const body = { email, password, nombre, rol: rolReg };
    if (rolReg === 'empleado') body.cargo = cargo || undefined;
    else body.telefono = telefono || undefined;
    const res = await api.register(body);
    setLoading(false);
    if (res.usuario) {
      setError('✅ Registrado. Ahora inicia sesión.');
      setModo('login');
    } else setError(res.error || 'Error al registrar');
  };

  const contenido = (
    <div className={onCancel ? 'bg-white rounded-xl p-6 shadow-lg max-w-sm' : ''}>
      {onCancel && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-900">Iniciar sesión</h2>
          <button onClick={onCancel} className="text-neutral-300 hover:text-neutral-500 text-lg leading-none">&times;</button>
        </div>
      )}
      {!onCancel && (
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-neutral-900 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-xl font-serif">P</span>
          </div>
          <h1 className="text-xl font-medium text-neutral-900 tracking-tight">Pastelería</h1>
          <p className="text-neutral-400 text-sm mt-1">Panel de administración</p>
        </div>
      )}

      <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
        <button onClick={() => { setModo('login'); setError(''); }}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${modo === 'login' ? 'bg-white text-neutral-900 font-medium shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
          Iniciar Sesión
        </button>
        <button onClick={() => { setModo('register'); setError(''); }}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${modo === 'register' ? 'bg-white text-neutral-900 font-medium shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
          Registrarse
        </button>
      </div>

      {modo === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Correo electrónico" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" required />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" required />
          {error && <p className={`text-xs text-center ${error.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="flex gap-2">
            {['cliente', 'empleado'].map(r => (
              <button key={r} type="button" onClick={() => setRolReg(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${rolReg === r ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                {r === 'cliente' ? 'Cliente' : 'Empleado'}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Nombre completo" value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" required />
          <input type="email" placeholder="Correo electrónico" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" required />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" required />
          {rolReg === 'cliente' ? (
            <input type="text" placeholder="Teléfono (opcional)" value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" />
          ) : (
            <input type="text" placeholder="Cargo (ej: Pastelero, Cajero)" value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300" />
          )}
          {error && <p className={`text-xs text-center ${error.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {loading ? 'Registrando...' : `Registrar ${rolReg === 'cliente' ? 'Cliente' : 'Empleado'}`}
          </button>
        </form>
      )}
    </div>
  );

  if (onCancel) return contenido;
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">{contenido}</div>
    </div>
  );
}
