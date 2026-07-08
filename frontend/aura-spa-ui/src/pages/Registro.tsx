import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [cedulaError, setCedulaError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validarPassword = (valor: string) => {
    if (valor.length > 0 && valor.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/auth/register', {
        nombre,
        apellido,
        email,
        password,
        telefono,
        numeroDocumento: cedula,
        nombrePerfil: 'Cliente',
      });
      const { token, usuario } = response.data;
      login(token, usuario);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/client'), 2000);
    } catch (err: any) {
      if (err.response?.data) {
        setError(typeof err.response.data === 'string' ? err.response.data : 'Error al registrar. Intenta de nuevo.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '15px', borderRadius: '15px',
    border: '1px solid #ddd', outline: 'none', background: '#fcfcfc'
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '20px' }}>
        <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '50px', borderRadius: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '12px' }}>¡Cuenta creada!</h2>
          <p style={{ color: 'var(--aura-gray)' }}>Redirigiendo a tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '50px', borderRadius: '30px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Crear cuenta</h2>
        <p style={{ textAlign: 'center', color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Únete a AuraSpa y agenda tus servicios fácilmente
        </p>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Nombre</label>
              <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Apellido</label>
              <input type="text" placeholder="Tu apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          {/* INC-W01: teléfono requerido */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Teléfono</label>
            <input type="tel" placeholder="809-555-0000" value={telefono} onChange={(e) => setTelefono(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Cédula</label>
            <input
              type="text"
              placeholder="000-0000000-0"
              value={cedula}
              onChange={(e) => {
                let valor = e.target.value.replace(/[^0-9]/g, '');
                if (valor.length > 3) valor = valor.slice(0,3) + '-' + valor.slice(3);
                if (valor.length > 11) valor = valor.slice(0,11) + '-' + valor.slice(11);
                valor = valor.slice(0, 13);
                setCedula(valor);
                setCedulaError(valor.length === 13 || valor.length === 0 ? '' : 'Formato esperado: 000-0000000-0');
              }}
              required
              maxLength={13}
              style={{ ...inputStyle, borderColor: cedulaError ? '#c62828' : '#ddd' }}
            />
            {cedulaError && <p style={{ color: '#c62828', fontSize: '0.8rem', margin: '6px 0 0' }}>{cedulaError}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Correo Electrónico</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>

          {/* INC-W02: validación mínimo 8 caracteres */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); validarPassword(e.target.value); }}
              required
              style={{ ...inputStyle, borderColor: passwordError ? '#c62828' : '#ddd' }}
            />
            {passwordError && <p style={{ color: '#c62828', fontSize: '0.8rem', margin: '6px 0 0' }}>{passwordError}</p>}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>Confirmar contraseña</label>
            <input type="password" placeholder="Repite tu contraseña" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required style={inputStyle} />
          </div>

          <button type="submit" className="btn-AuraSpa" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--aura-gray)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <span onClick={() => navigate('/login')} style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', cursor: 'pointer' }}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  );
};

export default Registro;
