import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/apiClient';

const RestablecerContrasena: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token,      setToken]      = useState(searchParams.get('token') ?? '');
  const [nueva,      setNueva]      = useState('');
  const [confirmar,  setConfirmar]  = useState('');
  const [showNueva,  setShowNueva]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [exito,      setExito]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) { setError('Ingresa el token de recuperación.'); return; }
    if (nueva.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/restablecer-contrasena', { token: token.trim(), nuevaPassword: nueva });
      setExito(true);
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'No se pudo restablecer la contraseña. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'20px' }}>
        <div className="card-aura animate-fade-in" style={{ maxWidth:'480px', width:'100%', padding:'50px', borderRadius:'28px', textAlign:'center' }}>
          <CheckCircle size={52} color="#22c55e" style={{ marginBottom:'20px' }} />
          <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'12px' }}>Contraseña actualizada</h3>
          <p style={{ color:'#666', fontSize:'0.9rem', marginBottom:'24px' }}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <button className="btn-AuraSpa" onClick={() => navigate('/login')} style={{ width:'100%', padding:'13px' }}>
            Ir a iniciar sesión
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
            <KeyRound size={28} />
          </div>
          <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:'0 0 8px' }}>Restablecer contraseña</h2>
          <p style={{ color:'#888', fontSize:'0.88rem', margin:0 }}>
            Ingresa el token que recibiste y tu nueva contraseña.
          </p>
        </div>

        {error && (
          <div style={{ background:'#ffebee', color:'#c62828', padding:'13px', borderRadius:'12px', marginBottom:'18px', fontSize:'0.88rem', textAlign:'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', marginBottom:'8px', color:'#666', fontWeight:'500', fontSize:'0.9rem' }}>
              Token de recuperación
            </label>
            <input type="text" placeholder="Pega aquí tu token" value={token}
              onChange={e => setToken(e.target.value)} required
              style={{ width:'100%', padding:'14px', borderRadius:'14px', border:'1px solid #ddd', outline:'none', fontSize:'0.93rem', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom:'20px', position:'relative' }}>
            <label style={{ display:'block', marginBottom:'8px', color:'#666', fontWeight:'500', fontSize:'0.9rem' }}>
              Nueva contraseña
            </label>
            <input type={showNueva ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={nueva}
              onChange={e => setNueva(e.target.value)} required
              style={{ width:'100%', padding:'14px', paddingRight:'45px', borderRadius:'14px', border:'1px solid #ddd', outline:'none', fontSize:'0.93rem', boxSizing:'border-box' }} />
            <button type="button" onClick={() => setShowNueva(!showNueva)}
              style={{ position:'absolute', right:'15px', top:'41px', background:'none', border:'none', cursor:'pointer', color:'#999' }}>
              {showNueva ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ marginBottom:'24px' }}>
            <label style={{ display:'block', marginBottom:'8px', color:'#666', fontWeight:'500', fontSize:'0.9rem' }}>
              Confirmar nueva contraseña
            </label>
            <input type="password" placeholder="Repite tu nueva contraseña" value={confirmar}
              onChange={e => setConfirmar(e.target.value)} required
              style={{ width:'100%', padding:'14px', borderRadius:'14px', border:'1px solid #ddd', outline:'none', fontSize:'0.93rem', boxSizing:'border-box' }} />
          </div>

          <button type="submit" className="btn-AuraSpa" style={{ width:'100%', padding:'14px' }} disabled={loading}>
            {loading
              ? <Loader2 size={20} className="animate-spin" style={{ margin:'0 auto', display:'block' }}/>
              : 'Restablecer contraseña'}
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

export default RestablecerContrasena;
