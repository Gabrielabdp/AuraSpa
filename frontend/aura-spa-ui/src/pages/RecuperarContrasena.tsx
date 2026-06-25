import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

const RecuperarContrasena: React.FC = () => {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [token,   setToken]   = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.post('/api/auth/recuperar-contrasena', { email });
      setEnviado(true);
      // En ambiente académico el token viene en la respuesta para pruebas
      if (data.token) setToken(data.token);
    } catch {
      setError('No se pudo procesar la solicitud. Verifica que el servidor esté activo.');
    } finally { setLoading(false); }
  };

  if (enviado) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'20px' }}>
        <div className="card-aura animate-fade-in" style={{ maxWidth:'480px', width:'100%', padding:'50px', borderRadius:'28px', textAlign:'center' }}>
          <CheckCircle size={52} color="#22c55e" style={{ marginBottom:'20px' }} />
          <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'12px' }}>Solicitud enviada</h3>
          <p style={{ color:'#666', fontSize:'0.9rem', marginBottom:'16px' }}>
            En un sistema en producción recibirías un correo con las instrucciones.
          </p>
          {/* Token visible solo en ambiente académico */}
          {token && (
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'14px', padding:'16px', marginBottom:'20px', textAlign:'left' }}>
              <p style={{ color:'#16a34a', fontWeight:'bold', fontSize:'0.82rem', margin:'0 0 6px' }}>Token de recuperación (demo académica):</p>
              <code style={{ fontSize:'0.9rem', color:'#15803d', wordBreak:'break-all' }}>{token}</code>
            </div>
          )}
          <button className="btn-AuraSpa" onClick={() => navigate('/login')} style={{ width:'100%', padding:'13px' }}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'20px' }}>
      <div className="card-aura animate-fade-in" style={{ maxWidth:'480px', width:'100%', padding:'50px', borderRadius:'28px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ background:'#f0ecff', color:'var(--aura-lavender)', width:'64px', height:'64px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Mail size={28} />
          </div>
          <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:'0 0 8px' }}>Recuperar contraseña</h2>
          <p style={{ color:'#888', fontSize:'0.88rem', margin:0 }}>
            Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {error && (
          <div style={{ background:'#ffebee', color:'#c62828', padding:'13px', borderRadius:'12px', marginBottom:'18px', fontSize:'0.88rem', textAlign:'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'24px' }}>
            <label style={{ display:'block', marginBottom:'8px', color:'#666', fontWeight:'500', fontSize:'0.9rem' }}>
              Correo electrónico
            </label>
            <input type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ width:'100%', padding:'14px', borderRadius:'14px', border:'1px solid #ddd', outline:'none', fontSize:'0.93rem', boxSizing:'border-box' }} />
          </div>
          <button type="submit" className="btn-AuraSpa" style={{ width:'100%', padding:'14px' }} disabled={loading}>
            {loading
              ? <Loader2 size={20} className="animate-spin" style={{ margin:'0 auto', display:'block' }}/>
              : 'Enviar instrucciones'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'0.85rem' }}>
          <span onClick={() => navigate('/login')}
            style={{ color:'var(--aura-lavender)', cursor:'pointer', fontWeight:'500' }}>
            ← Volver al inicio de sesión
          </span>
        </p>
      </div>
    </div>
  );
};

export default RecuperarContrasena;
