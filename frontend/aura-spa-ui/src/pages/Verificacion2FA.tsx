import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';

const Verificacion2FA: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      setError('El código debe tener exactamente 6 dígitos.');
      return;
    }
    setLoading(true);
    setError('');
    // TODO: conectar verificación real con Google Authenticator
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard/client');
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '50px', borderRadius: '30px', textAlign: 'center' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <ShieldCheck size={48} color="var(--aura-lavender)" />
        </div>

        <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>
          Verificación en dos pasos
        </h2>
        <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Abre tu aplicación <strong>Google Authenticator</strong> e ingresa el código de 6 dígitos que aparece para AuraSpa.
        </p>

        {/* QR placeholder — se reemplaza con QR real cuando el backend esté listo */}
        <div style={{
          width: '160px', height: '160px', margin: '0 auto 30px auto',
          background: '#f0f0f0', borderRadius: '12px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--aura-lavender-light)'
        }}>
          <ShieldCheck size={40} color="var(--aura-lavender)" style={{ marginBottom: '8px' }} />
          <span style={{ color: 'var(--aura-gray)', fontSize: '0.75rem' }}>Código QR</span>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '15px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--aura-gray)', fontWeight: '500', textAlign: 'left' }}>
              Código de verificación
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              required
              style={{
                width: '100%', padding: '15px', borderRadius: '15px',
                border: error ? '1px solid #c62828' : '1px solid #ddd',
                outline: 'none', background: '#fcfcfc',
                textAlign: 'center', fontSize: '1.4rem',
                letterSpacing: '8px', fontWeight: 'bold'
              }}
            />
            <p style={{ color: 'var(--aura-gray)', fontSize: '0.8rem', marginTop: '8px' }}>
              El código se actualiza cada 30 segundos.
            </p>
          </div>

          <button
            type="submit"
            className="btn-AuraSpa"
            style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Verificar código'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}>
          ¿Problemas con el código?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Volver al inicio de sesión
          </span>
        </p>
      </div>
    </div>
  );
};

export default Verificacion2FA;