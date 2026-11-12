import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

const RecuperarContrasena: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: conectar al endpoint de recuperación cuando el Core esté listo
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '50px', borderRadius: '30px', textAlign: 'center' }}>

        {!enviado ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f0ecff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={32} color="var(--aura-lavender)" />
              </div>
            </div>

            <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>
              ¿Olvidaste tu contraseña?
            </h2>
            <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '35px' }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc', fontSize: '0.9rem' }}
                />
              </div>

              <button type="submit" className="btn-AuraSpa" style={{ width: '100%', padding: '15px', fontSize: '1rem' }} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={22} style={{ margin: '0 auto' }} /> : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--aura-gray)', fontSize: '0.88rem' }}>
              ¿Recordaste tu contraseña?{' '}
              <span onClick={() => navigate('/login')} style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', cursor: 'pointer' }}>
                Inicia sesión
              </span>
            </p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #86efac' }}>
                <CheckCircle size={38} color="#22c55e" />
              </div>
            </div>

            <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>
              ¡Correo enviado!
            </h2>
            <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '10px' }}>
              Enviamos un enlace de recuperación a:
            </p>
            <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '30px' }}>
              {email}
            </p>

            <div style={{ background: '#f8f6ff', borderRadius: '15px', padding: '15px 20px', marginBottom: '30px', textAlign: 'left' }}>
              <p style={{ color: 'var(--aura-gray)', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
                ✅ Revisa tu bandeja de entrada<br />
                ✅ El enlace expira en 30 minutos<br />
                ✅ Si no lo ves, revisa tu carpeta de spam
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn-AuraSpa"
              style={{ width: '100%', padding: '15px', fontSize: '1rem' }}
            >
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RecuperarContrasena;