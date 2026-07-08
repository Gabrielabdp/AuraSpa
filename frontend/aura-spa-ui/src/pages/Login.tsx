import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import apiClient from '../services/apiClient';

const Login: React.FC = () => {
  const navigate   = useNavigate();
  const { login }  = useAuth();

  // "Bienvenida de nuevo" SOLO si cerró sesión en esta misma sesión del navegador
  // Si llegó aquí por primera vez (tab nuevo / navegador nuevo) → "Bienvenida"
  const [yaEntroAntes] = useState(() => sessionStorage.getItem('aura_cerro_sesion') === '1');

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.post('/api/auth/login', { email, password });
      const { token, usuario } = data;
      // Guardar que ya inició sesión en esta sesión del navegador
      sessionStorage.setItem('aura_cerro_sesion', '0');
      login(token, usuario);
      const p = usuario.perfil;
      navigate(['Admin','Cajero','Especialista'].includes(p) ? '/dashboard/staff' : '/dashboard/client');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'No se pudo conectar con el servidor.');
      setPassword('');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'20px' }}>
      <div className="card-aura animate-fade-in" style={{ width:'100%', maxWidth:'500px', padding:'50px', borderRadius:'30px' }}>
        <h2 style={{ textAlign:'center', color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'8px' }}>
          {yaEntroAntes ? 'Bienvenida de nuevo' : 'Bienvenida'}
        </h2>
        <p style={{ textAlign:'center', color:'var(--aura-gray)', fontSize:'0.88rem', marginBottom:'30px' }}>
          {yaEntroAntes ? 'Nos alegra verte otra vez.' : 'Tu oasis te espera.'}
        </p>

        {error && (
          <div style={{ background:'#ffebee', color:'#c62828', padding:'14px', borderRadius:'14px', marginBottom:'20px', textAlign:'center', fontSize:'0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', marginBottom:'9px', color:'var(--aura-gray)', fontWeight:'500' }}>
              Correo Electrónico o Usuario
            </label>
            <input type="text" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ width:'100%', padding:'15px', borderRadius:'15px', border:'1px solid #ddd', outline:'none', background:'#fcfcfc', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom:'10px' }}>
            <label style={{ display:'block', marginBottom:'9px', color:'var(--aura-gray)', fontWeight:'500' }}>Contraseña</label>
            <div style={{ position:'relative' }}>
              <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
                style={{ width:'100%', padding:'15px 50px 15px 15px', borderRadius:'15px', border:'1px solid #ddd', outline:'none', background:'#fcfcfc', boxSizing:'border-box' }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position:'absolute', right:'15px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#999' }}>
                {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <div style={{ textAlign:'right', marginBottom:'25px' }}>
            <span onClick={() => navigate('/recuperar-contrasena')}
              style={{ color:'var(--aura-lavender)', fontSize:'0.85rem', fontWeight:'500', cursor:'pointer' }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button type="submit" className="btn-AuraSpa" style={{ width:'100%', padding:'15px', fontSize:'1.05rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={22} style={{ margin:'0 auto', display:'block' }}/> : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'25px', color:'var(--aura-gray)', fontSize:'0.9rem' }}>
          ¿No tienes una cuenta?{' '}
          <span onClick={() => navigate('/registro')} style={{ color:'var(--aura-lavender)', fontWeight:'bold', cursor:'pointer' }}>
            Regístrate aquí
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
