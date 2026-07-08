import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { token, usuario } = response.data;
      login(token, usuario);
      if (usuario.perfil === 'Admin' || usuario.perfil === 'Cajero' || usuario.perfil === 'Especialista') {
        navigate('/dashboard/staff');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err: any) {
      if (err.response) {
        setError(`Error: ${err.response.data || err.response.statusText}`);
      } else if (err.request) {
        setError('Error de Conexión: No se pudo contactar con el servidor.');
      } else {
        setError(`Error: ${err.message}`);
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '50px', borderRadius: '30px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '30px' }}>Bienvenida de nuevo</h2>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* INC-W03: acepta email o nombre de usuario */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--aura-gray)', fontWeight: '500' }}>
              Correo Electrónico o Usuario
            </label>
            <input
              type="text"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--aura-gray)', fontWeight: '500' }}>Contraseña</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc' }}
            />
          </div>

          {/* INC-W27: link de recuperación */}
          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <span
              onClick={() => navigate('/recuperar-contrasena')}
              style={{ color: 'var(--aura-lavender)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button type="submit" className="btn-AuraSpa" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : <>Iniciar Sesión</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--aura-gray)', fontSize: '0.9rem' }}>
          ¿No tienes una cuenta?{' '}
          <span onClick={() => navigate('/registro')} style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', cursor: 'pointer' }}>
            Regístrate aquí
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
