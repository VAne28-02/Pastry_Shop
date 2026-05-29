import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.token) onLogin(res);
    else setError(res.message || 'Error al iniciar sesión');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-neutral-900 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-xl font-serif">P</span>
          </div>
          <h1 className="text-xl font-medium text-neutral-900 tracking-tight">Pastelería</h1>
          <p className="text-neutral-400 text-sm mt-1">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email" placeholder="Correo electrónico" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm
                         focus:outline-none focus:border-neutral-400 transition-colors
                         placeholder:text-neutral-300"
              required
            />
          </div>
          <div>
            <input
              type="password" placeholder="Contraseña" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm
                         focus:outline-none focus:border-neutral-400 transition-colors
                         placeholder:text-neutral-300"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium
                       hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
