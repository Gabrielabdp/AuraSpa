import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, ShieldCheck, ChevronRight, CheckCircle, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import apiClient from '../services/apiClient';

const soloLetras = (v: string) => v.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]/g, '');
const soloNums9  = (v: string) => v.replace(/\D/g, '').slice(0, 9);

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();

  const [seccion, setSeccion] = useState<'perfil'|'seguridad'|'notificaciones'>('perfil');

  const [nombre,    setNombre]    = useState(user?.nombre   ?? '');
  const [apellido,  setApellido]  = useState(user?.apellido ?? '');
  const [telefono,  setTelefono]  = useState(user?.telefono ?? '');
  const [email,     setEmail]     = useState(user?.email    ?? '');
  const [guardando, setGuardando] = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [exito,     setExito]     = useState('');
  const [errorDatos, setErrorDatos] = useState('');

  const [actual,      setActual]      = useState('');
  const [nueva,       setNueva]       = useState('');
  const [confirmar,   setConfirmar]   = useState('');
  const [showActual,  setShowActual]  = useState(false);
  const [showNueva,   setShowNueva]   = useState(false);
  const [passError,   setPassError]   = useState('');
  const [passOk,      setPassOk]      = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    setNombre(user?.nombre   ?? '');
    setApellido(user?.apellido ?? '');
    setTelefono(user?.telefono ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const guardarDatos = async () => {
    setConfirmGuardar(false);
    setGuardando(true); setErrorDatos(''); setExito('');
    try {
      await apiClient.put('/api/auth/perfil', { nombre, apellido, telefono, email });
      if (user && token) login(token, { ...user, nombre, apellido, telefono, email });
      setExito('Datos actualizados correctamente.');
    } catch (err: any) {
      setErrorDatos(err.response?.data || 'No se pudo actualizar. Intenta de nuevo.');
    } finally { setGuardando(false); }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva.length < 8)   { setPassError('Mínimo 8 caracteres.');          return; }
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

  const iS: React.CSSProperties = {
    width: '100%', padding: '12px 15px', borderRadius: '15px',
    border: '1px solid #ddd', outline: 'none', background: '#fcfcfc',
    fontSize: '0.9rem', boxSizing: 'border-box'
  };
  const lS: React.CSSProperties = {
    display: 'block', marginBottom: '8px',
    color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem'
  };

  const [activo2FA, setActivo2FA] = useState(false);
  const [clave2FA,  setClave2FA]  = useState('');

  const activar2FA = () => {
    // Simulación: generar clave secreta
    const clave = 'AURA' + Math.random().toString(36).slice(2,8).toUpperCase() + '2026';
    setClave2FA(clave);
    setActivo2FA(true);
    alert(`2FA activado. Clave secreta: ${clave}\nEn producción, escanea el QR con Google Authenticator.`);
  };

  const menu = [
    { id: 'perfil',          label: 'Mis datos',     icono: <User size={18} /> },
    { id: 'seguridad',       label: 'Seguridad',      icono: <Lock size={18} /> },
    { id: 'dos-fa',          label: '2FA',            icono: <ShieldCheck size={18} /> },
    { id: 'notificaciones',  label: 'Notificaciones', icono: <Bell size={18} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)' }}>

      {/* Modal confirmar guardar */}
      {confirmGuardar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px' }}>
          <div className="card-aura" style={{ maxWidth:'360px', width:'100%', padding:'40px', borderRadius:'25px', textAlign:'center' }}>
            <h4 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'8px' }}>Confirmar cambios</h4>
            <p style={{ color:'#888', fontSize:'0.88rem', marginBottom:'24px' }}>
              Se actualizarán tus datos personales.
              {email !== user?.email && (
                <span style={{ display:'block', color:'#f59e0b', marginTop:'8px', fontSize:'0.82rem' }}>
                  Atención: cambiaste tu correo. Lo necesitarás para iniciar sesión.
                </span>
              )}
            </p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={guardarDatos} className="btn-AuraSpa" style={{ padding:'10px 25px' }}>Sí, guardar</button>
              <button onClick={() => setConfirmGuardar(false)} className="btn-outline-aura" style={{ padding:'10px 25px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '40px 8%' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Mi Perfil</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>{user?.email}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '25px', alignItems: 'flex-start' }}>

          {/* Menú lateral */}
          <div className="card-aura" style={{ padding: '15px' }}>
            {menu.map(item => (
              <button key={item.id} onClick={() => setSeccion(item.id as any)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '15px 20px', borderRadius: '15px', border: 'none', cursor: 'pointer', marginBottom: '5px',
                background: seccion === item.id ? '#f0ecff' : 'transparent',
                color:      seccion === item.id ? 'var(--aura-lavender)' : 'var(--aura-navy)',
                fontWeight: seccion === item.id ? '600' : '500'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.icono}{item.label}
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div>

            {/* ── MIS DATOS ── */}
            {seccion === 'perfil' && (
              <div className="card-aura" style={{ padding: '35px' }}>
                <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '6px' }}>Mis datos</h3>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '25px' }}>
                  Puedes editar tu nombre, apellido, teléfono y correo cuando quieras.
                </p>

                {exito && (
                  <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '13px', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> {exito}
                  </div>
                )}
                {errorDatos && (
                  <div style={{ background: '#ffebee', color: '#c62828', padding: '13px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.88rem' }}>
                    {errorDatos}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={lS}>Nombre</label>
                    <input type="text" value={nombre}
                      onChange={e => setNombre(soloLetras(e.target.value))}
                      style={iS} />
                  </div>
                  <div>
                    <label style={lS}>Apellido</label>
                    <input type="text" value={apellido}
                      onChange={e => setApellido(soloLetras(e.target.value))}
                      style={iS} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={lS}>Teléfono</label>
                  <input type="tel" value={telefono}
                    onChange={e => setTelefono(soloNums9(e.target.value))}
                    placeholder="8091234567" maxLength={9} style={iS} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={lS}>Correo electrónico</label>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={iS} />
                  <p style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '4px' }}>
                    Si cambias el correo, lo necesitarás para iniciar sesión.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={lS}>Perfil</label>
                  <input type="text" value={user?.perfil ?? ''} readOnly
                    style={{ ...iS, background: '#f0f0f0', color: '#888', cursor: 'not-allowed' }} />
                </div>

                <button
                  onClick={() => setConfirmGuardar(true)}
                  className="btn-AuraSpa"
                  style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={guardando}
                >
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {seccion === 'seguridad' && (
              <div className="card-aura" style={{ padding: '35px' }}>
                <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Cambiar contraseña</h3>
                <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '25px' }}>Mínimo 8 caracteres.</p>

                {passOk && (
                  <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '13px', borderRadius: '12px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> Contraseña actualizada exitosamente.
                  </div>
                )}
                {passError && (
                  <div style={{ background: '#ffebee', color: '#c62828', padding: '13px', borderRadius: '12px', marginBottom: '18px', fontSize: '0.88rem' }}>
                    {passError}
                  </div>
                )}

                <form onSubmit={handleCambiarPassword}>
                  {[
                    { label: 'Contraseña actual', val: actual, set: setActual, show: showActual, toggle: () => setShowActual(!showActual) },
                    { label: 'Nueva contraseña',  val: nueva,  set: setNueva,  show: showNueva,  toggle: () => setShowNueva(!showNueva)  },
                  ].map((f, i) => (
                    <div key={i} style={{ marginBottom: '20px', position: 'relative' }}>
                      <label style={lS}>{f.label}</label>
                      <input
                        type={f.show ? 'text' : 'password'}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        required
                        style={{ ...iS, paddingRight: '45px' }}
                      />
                      <button type="button" onClick={f.toggle}
                        style={{ position: 'absolute', right: '15px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        {f.show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  ))}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={lS}>Confirmar nueva contraseña</label>
                    <input type="password" value={confirmar}
                      onChange={e => setConfirmar(e.target.value)}
                      required style={iS} />
                  </div>
                  <button type="submit" className="btn-AuraSpa" style={{ padding: '12px 30px' }} disabled={loadingPass}>
                    {loadingPass
                      ? <Loader2 size={16} className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                      : 'Actualizar contraseña'}
                  </button>
                </form>
              </div>
            )}

            {/* ── 2FA ── */}
            {seccion === 'dos-fa' && (
              <div className="card-aura" style={{ padding: '35px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                  <div style={{ background: activo2FA?'#f0fdf4':'#f0ecff', padding:'12px', borderRadius:'50%' }}>
                    <ShieldCheck size={24} color={activo2FA?'#22c55e':'var(--aura-lavender)'}/>
                  </div>
                  <div>
                    <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:0 }}>Autenticación en dos pasos</h3>
                    <p style={{ color:'#888', margin:0, fontSize:'0.85rem' }}>
                      Estado: <strong style={{ color: activo2FA?'#22c55e':'#f59e0b' }}>{activo2FA ? 'Activo' : 'Inactivo'}</strong>
                    </p>
                  </div>
                </div>
                <p style={{ color:'var(--aura-gray)', fontSize:'0.88rem', margin:'20px 0' }}>
                  Con la autenticación en dos pasos, cada vez que inicies sesión deberás ingresar un código de 6 dígitos generado por una aplicación como <strong>Google Authenticator</strong> o <strong>Authy</strong>.
                </p>
                {!activo2FA ? (
                  <button onClick={activar2FA} className="btn-AuraSpa" style={{ padding:'12px 28px' }}>
                    Activar 2FA
                  </button>
                ) : (
                  <div>
                    {clave2FA && (
                      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'14px', padding:'16px', marginBottom:'16px' }}>
                        <p style={{ color:'#16a34a', fontWeight:'600', fontSize:'0.85rem', margin:'0 0 6px' }}>Clave secreta (guárdala):</p>
                        <code style={{ color:'#15803d', fontSize:'1rem', letterSpacing:'0.1em' }}>{clave2FA}</code>
                        <p style={{ color:'#888', fontSize:'0.75rem', margin:'8px 0 0' }}>
                          En producción, escanearías un código QR con Google Authenticator.
                        </p>
                      </div>
                    )}
                    <button onClick={() => { setActivo2FA(false); setClave2FA(''); }}
                      style={{ padding:'12px 28px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:'30px', cursor:'pointer', fontWeight:'600' }}>
                      Desactivar 2FA
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICACIONES ── */}
            {seccion === 'notificaciones' && (
              <div className="card-aura" style={{ padding: '35px' }}>
                <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Notificaciones</h3>
                <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem' }}>
                  Revisa tu historial de notificaciones en la sección de{' '}
                  <span
                    onClick={() => navigate('/notificaciones')}
                    style={{ color: 'var(--aura-lavender)', cursor: 'pointer', fontWeight: '600' }}>
                    notificaciones
                  </span>.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
