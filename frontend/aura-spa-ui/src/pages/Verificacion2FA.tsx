import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Verificacion2FA: React.FC = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [codigo,  setCodigo]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [reenvios, setReenvios] = useState(0);

  // Recuperar los datos guardados temporalmente en sesión
  const tokenTemp  = sessionStorage.getItem('aura_2fa_token');
  const userTemp   = sessionStorage.getItem('aura_2fa_usuario');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
    setLoading(true); setError('');

    // Simulación académica: código "123456" siempre válido en modo demo
    // En producción: POST /api/auth/verificar-2fa { codigo, token: tokenTemp }
    setTimeout(() => {
      setLoading(false);
      if (codigo === '123456' || codigo.length === 6) {
        if (tokenTemp && userTemp) {
          const usuario = JSON.parse(userTemp);
          sessionStorage.removeItem('aura_2fa_token');
          sessionStorage.removeItem('aura_2fa_usuario');
          sessionStorage.setItem('aura_cerro_sesion', '0');
          login(tokenTemp, usuario);
          const p = usuario.perfil;
          navigate(['Admin','Cajero','Especialista'].includes(p) ? '/dashboard/staff' : '/dashboard/client');
        } else {
          setError('Sesión expirada. Inicia sesión de nuevo.');
        }
      } else {
        setError('Código incorrecto. Intenta de nuevo.');
      }
    }, 1000);
  };

  const reenviarCodigo = () => {
    if (reenvios >= 3) { setError('Límite de reenvíos alcanzado. Espera 10 minutos.'); return; }
    setReenvios(r => r + 1);
    setError('');
    alert('Código reenviado a tu correo o aplicación de autenticación. (Simulación: usa 123456)');
  };

  // Manejar input: solo 6 dígitos
  const handleCodigo = (v: string) => {
    const soloNums = v.replace(/\D/g, '').slice(0, 6);
    setCodigo(soloNums);
    if (error) setError('');
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'20px' }}>
      <div className="card-aura animate-fade-in" style={{ width:'100%', maxWidth:'480px', padding:'50px', borderRadius:'30px', textAlign:'center' }}>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:'20px' }}>
          <div style={{ background:'#f0ecff', width:'70px', height:'70px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldCheck size={34} color="var(--aura-lavender)" />
          </div>
        </div>

        <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'8px' }}>
          Verificación en dos pasos
        </h2>
        <p style={{ color:'var(--aura-gray)', fontSize:'0.9rem', marginBottom:'30px' }}>
          Ingresa el código de 6 dígitos de tu aplicación de autenticación o el que llegó a tu correo.
        </p>

        {/* Demo notice */}
        <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'14px', padding:'10px 16px', marginBottom:'24px' }}>
          <p style={{ color:'#92400e', fontSize:'0.82rem', margin:0 }}>
            Modo demo: usa el código <strong>123456</strong> para continuar.
          </p>
        </div>

        {error && (
          <div style={{ background:'#ffebee', color:'#c62828', padding:'13px', borderRadius:'14px', marginBottom:'20px', fontSize:'0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Inputs individuales para cada dígito — estilo visual */}
          <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'28px' }}>
            {Array.from({length:6}).map((_,i) => (
              <input key={i} type="text" readOnly value={codigo[i] || ''}
                style={{
                  width:'48px', height:'56px', textAlign:'center', fontSize:'1.4rem', fontWeight:'bold',
                  borderRadius:'12px', border:`2px solid ${codigo[i]?'var(--aura-lavender)':'#ddd'}`,
                  outline:'none', background: codigo[i]?'#f0ecff':'#fcfcfc', color:'var(--aura-navy)'
                }}/>
            ))}
          </div>

          {/* Input oculto que captura el valor real */}
          <input
            type="text"
            value={codigo}
            onChange={e => handleCodigo(e.target.value)}
            placeholder="Escribe tu código de 6 dígitos"
            inputMode="numeric"
            autoFocus
            style={{
              width:'100%', padding:'14px', borderRadius:'15px', border:'1px solid #ddd',
              outline:'none', textAlign:'center', letterSpacing:'0.3em',
              fontSize:'1.1rem', marginBottom:'20px', boxSizing:'border-box'
            }}
          />

          <button type="submit" className="btn-AuraSpa" style={{ width:'100%', padding:'15px', fontSize:'1.05rem' }} disabled={loading || codigo.length !== 6}>
            {loading ? <Loader2 className="animate-spin" size={22} style={{ margin:'0 auto', display:'block' }}/> : 'Verificar'}
          </button>
        </form>

        <button onClick={reenviarCodigo} style={{ marginTop:'20px', background:'none', border:'none', color:'var(--aura-lavender)', cursor:'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'6px', margin:'20px auto 0' }}>
          <RefreshCw size={15}/> Reenviar código
        </button>

        <p style={{ marginTop:'20px', fontSize:'0.82rem', color:'#aaa' }}>
          ¿Problemas?{' '}
          <span onClick={() => navigate('/login')} style={{ color:'var(--aura-lavender)', cursor:'pointer', fontWeight:'600' }}>
            Volver al inicio
          </span>
        </p>
      </div>
    </div>
  );
};

export default Verificacion2FA;
