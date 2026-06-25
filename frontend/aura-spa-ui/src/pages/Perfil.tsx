import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, ChevronRight, CheckCircle, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import apiClient from '../services/apiClient';

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();

  const [seccion, setSeccion] = useState<'perfil'|'seguridad'|'notificaciones'>('perfil');

  // Datos editables
  const [nombre,   setNombre]   = useState(user?.nombre   ?? '');
  const [apellido, setApellido] = useState(user?.apellido ?? '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [guardando, setGuardando] = useState(false);
  const [exito,     setExito]     = useState('');
  const [errorDatos, setErrorDatos] = useState('');

  // Contraseña
  const [actual,    setActual]    = useState('');
  const [nueva,     setNueva]     = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva,  setShowNueva]  = useState(false);
  const [passError,  setPassError]  = useState('');
  const [passOk,     setPassOk]     = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    setNombre(user?.nombre ?? '');
    setApellido(user?.apellido ?? '');
    setTelefono(user?.telefono ?? '');
  }, [user]);

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setErrorDatos(''); setExito('');
    try {
      await apiClient.put('/api/auth/perfil', { nombre, apellido, telefono });
      // Actualizar el user en el contexto
      if (user && token) {
        login(token, { ...user, nombre, apellido, telefono });
      }
      setExito('Datos actualizados correctamente.');
    } catch (err: any) {
      setErrorDatos(err.response?.data || 'No se pudo actualizar. Intenta de nuevo.');
    } finally { setGuardando(false); }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva.length < 8) { setPassError('Mínimo 8 caracteres.'); return; }
    if (nueva !== confirmar) { setPassError('Las contraseñas no coinciden.'); return; }
    setPassError(''); setLoadingPass(true);
    try {
      await apiClient.post('/api/auth/cambiar-contrasena', { contrasenaActual: actual, nuevaContrasena: nueva });
      setPassOk(true);
      setActual(''); setNueva(''); setConfirmar('');
      setTimeout(() => setPassOk(false), 4000);
    } catch (err: any) {
      const msg = err.response?.data;
      setPassError(typeof msg === 'string' ? msg : 'Contraseña actual incorrecta.');
    } finally { setLoadingPass(false); }
  };

  const inputStyle = { width:'100%', padding:'12px 15px', borderRadius:'15px', border:'1px solid #ddd', outline:'none', background:'#fcfcfc', fontSize:'0.9rem', boxSizing:'border-box' as const };
  const labelStyle = { display:'block', marginBottom:'8px', color:'var(--aura-gray)', fontWeight:'500' as const, fontSize:'0.9rem' };

  const menuItems = [
    { id:'perfil',         label:'Mis datos',      icono:<User size={18}/> },
    { id:'seguridad',      label:'Seguridad',       icono:<Lock size={18}/> },
    { id:'notificaciones', label:'Notificaciones',  icono:<Bell size={18}/> },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--aura-beige)', padding:'40px 8%' }}>
      <div style={{ marginBottom:'30px' }}>
        <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:0 }}>Mi Perfil</h2>
        <p style={{ color:'var(--aura-gray)', margin:0, fontSize:'0.9rem' }}>{user?.email}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'25px', alignItems:'flex-start' }}>
        <div className="card-aura" style={{ padding:'15px' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setSeccion(item.id as any)} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'15px 20px', borderRadius:'15px', border:'none', cursor:'pointer', marginBottom:'5px',
              background: seccion===item.id ? '#f0ecff' : 'transparent',
              color: seccion===item.id ? 'var(--aura-lavender)' : 'var(--aura-navy)',
              fontWeight: seccion===item.id ? '600' : '500'
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:'12px' }}>{item.icono}{item.label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        <div>
          {/* ── MIS DATOS (editable) ── */}
          {seccion === 'perfil' && (
            <div className="card-aura" style={{ padding:'35px' }}>
              <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'6px' }}>Mis datos</h3>
              <p style={{ color:'#888', fontSize:'0.85rem', marginBottom:'25px' }}>
                Puedes editar tu nombre, apellido y teléfono cuando quieras.
              </p>

              {exito && (
                <div style={{ background:'#f0fdf4', color:'#22c55e', padding:'13px', borderRadius:'12px', marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <CheckCircle size={16}/> {exito}
                </div>
              )}
              {errorDatos && (
                <div style={{ background:'#ffebee', color:'#c62828', padding:'13px', borderRadius:'12px', marginBottom:'18px', fontSize:'0.88rem' }}>
                  ⚠️ {errorDatos}
                </div>
              )}

              <form onSubmit={handleGuardarDatos}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Apellido</label>
                    <input type="text" value={apellido} onChange={e => setApellido(e.target.value)} required style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={labelStyle}>Teléfono</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="809-000-0000" style={inputStyle} />
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input type="email" value={user?.email ?? ''} readOnly
                    style={{ ...inputStyle, background:'#f0f0f0', color:'#888', cursor:'not-allowed' }} />
                  <p style={{ color:'#aaa', fontSize:'0.78rem', marginTop:'4px' }}>El correo no se puede cambiar.</p>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={labelStyle}>Perfil</label>
                  <input type="text" value={user?.perfil ?? ''} readOnly
                    style={{ ...inputStyle, background:'#f0f0f0', color:'#888', cursor:'not-allowed' }} />
                </div>
                <button type="submit" className="btn-AuraSpa" style={{ padding:'12px 30px', display:'flex', alignItems:'center', gap:'8px' }} disabled={guardando}>
                  {guardando ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}

          {/* ── SEGURIDAD ── */}
          {seccion === 'seguridad' && (
            <div className="card-aura" style={{ padding:'35px' }}>
              <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'8px' }}>Cambiar contraseña</h3>
              <p style={{ color:'var(--aura-gray)', fontSize:'0.9rem', marginBottom:'25px' }}>Mínimo 8 caracteres.</p>

              {passOk && (
                <div style={{ background:'#f0fdf4', color:'#22c55e', padding:'13px', borderRadius:'12px', marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <CheckCircle size={16}/> Contraseña actualizada exitosamente.
                </div>
              )}
              {passError && (
                <div style={{ background:'#ffebee', color:'#c62828', padding:'13px', borderRadius:'12px', marginBottom:'18px', fontSize:'0.88rem' }}>
                  ⚠️ {passError}
                </div>
              )}

              <form onSubmit={handleCambiarPassword}>
                {[
                  { label:'Contraseña actual', val:actual, set:setActual, show:showActual, toggle:()=>setShowActual(!showActual) },
                  { label:'Nueva contraseña',  val:nueva,  set:setNueva,  show:showNueva,  toggle:()=>setShowNueva(!showNueva) },
                ].map((f,i) => (
                  <div key={i} style={{ marginBottom:'20px', position:'relative' }}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.show?'text':'password'} value={f.val}
                      onChange={e => f.set(e.target.value)} required
                      style={{ ...inputStyle, paddingRight:'45px' }} />
                    <button type="button" onClick={f.toggle}
                      style={{ position:'absolute', right:'15px', top:'38px', background:'none', border:'none', cursor:'pointer', color:'#999' }}>
                      {f.show ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                ))}
                <div style={{ marginBottom:'25px' }}>
                  <label style={labelStyle}>Confirmar nueva contraseña</label>
                  <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} required style={inputStyle} />
                </div>
                <button type="submit" className="btn-AuraSpa" style={{ padding:'12px 30px' }} disabled={loadingPass}>
                  {loadingPass ? <Loader2 size={16} className="animate-spin" style={{ margin:'0 auto' }}/> : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          )}

          {seccion === 'notificaciones' && (
            <div className="card-aura" style={{ padding:'35px' }}>
              <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'20px' }}>Notificaciones</h3>
              <p style={{ color:'var(--aura-gray)', fontSize:'0.9rem' }}>
                Revisa tu historial de notificaciones en la sección de{' '}
                <span onClick={() => navigate('/notificaciones')} style={{ color:'var(--aura-lavender)', cursor:'pointer', fontWeight:'600' }}>notificaciones</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
