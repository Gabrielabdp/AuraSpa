import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, ChevronRight, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [seccion, setSeccion] = useState<'perfil' | 'seguridad' | 'notificaciones'>('perfil');
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    setPasswordError('');
    setLoadingPass(true);
    try {
      // INC-W27: cambio de contraseña real
      await apiClient.post('/api/auth/cambiar-password', { passwordActual: actual, passwordNueva: nueva });
      setPasswordSuccess(true);
      setActual(''); setNueva(''); setConfirmar('');
    } catch (err: any) {
      const msg = err.response?.data;
      setPasswordError(typeof msg === 'string' ? msg : 'No se pudo cambiar la contraseña. Verifica que la contraseña actual sea correcta.');
    } finally {
      setLoadingPass(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc', fontSize: '0.9rem' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: 'var(--aura-gray)', fontWeight: '500' as const, fontSize: '0.9rem' };

  const menuItems = [
    { id: 'perfil',         label: 'Mis datos',      icono: <User size={18} /> },
    { id: 'seguridad',      label: 'Seguridad',      icono: <Lock size={18} /> },
    { id: 'notificaciones', label: 'Notificaciones', icono: <Bell size={18} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 8%' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Mi Perfil</h2>
        <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>{user?.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '25px', alignItems: 'flex-start' }}>
        {/* Menú lateral */}
        <div className="card-aura" style={{ padding: '15px' }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setSeccion(item.id as any)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '15px 20px', borderRadius: '15px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '5px',
              background: seccion === item.id ? '#f0ecff' : 'transparent',
              color: seccion === item.id ? 'var(--aura-lavender)' : 'var(--aura-navy)',
              fontWeight: seccion === item.id ? '600' : '500'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{item.icono}{item.label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div>
          {seccion === 'perfil' && (
            <div className="card-aura" style={{ padding: '35px' }}>
              <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '25px' }}>Mis datos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input type="text" value={user?.nombre ?? ''} readOnly style={{ ...inputStyle, background: '#f5f5f5' }} />
                </div>
                <div>
                  <label style={labelStyle}>Apellido</label>
                  <input type="text" value={user?.apellido ?? ''} readOnly style={{ ...inputStyle, background: '#f5f5f5' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input type="email" value={user?.email ?? ''} readOnly style={{ ...inputStyle, background: '#f5f5f5' }} />
                </div>
                <div>
                  <label style={labelStyle}>Perfil</label>
                  <input type="text" value={user?.perfil ?? ''} readOnly style={{ ...inputStyle, background: '#f5f5f5' }} />
                </div>
              </div>
              <p style={{ color: '#999', fontSize: '0.82rem', marginTop: '20px' }}>Para modificar tus datos, contacta a un administrador.</p>
            </div>
          )}

          {seccion === 'seguridad' && (
            <div className="card-aura" style={{ padding: '35px' }}>
              <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Cambiar contraseña</h3>
              <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '25px' }}>
                {/* INC-W02: mínimo 8 caracteres */}
                La nueva contraseña debe tener al menos 8 caracteres.
              </p>

              {passwordSuccess && (
                <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '15px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} /> Contraseña actualizada exitosamente.
                </div>
              )}

              {passwordError && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '15px', marginBottom: '20px', fontSize: '0.9rem' }}>
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleCambiarPassword}>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <label style={labelStyle}>Contraseña actual</label>
                  <input type={showActual ? 'text' : 'password'} value={actual} onChange={(e) => setActual(e.target.value)} required style={inputStyle} />
                  <button type="button" onClick={() => setShowActual(!showActual)} style={{ position: 'absolute', right: '15px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                    {showActual ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <label style={labelStyle}>Nueva contraseña</label>
                  <input type={showNueva ? 'text' : 'password'} value={nueva} onChange={(e) => setNueva(e.target.value)} required style={inputStyle} minLength={8} />
                  <button type="button" onClick={() => setShowNueva(!showNueva)} style={{ position: 'absolute', right: '15px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                    {showNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Confirmar nueva contraseña</label>
                  <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required style={inputStyle} />
                </div>
                <button type="submit" className="btn-AuraSpa" style={{ padding: '12px 30px' }} disabled={loadingPass}>
                  {loadingPass ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          )}

          {seccion === 'notificaciones' && (
            <div className="card-aura" style={{ padding: '35px' }}>
              <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Preferencias de notificaciones</h3>
              <p style={{ color: 'var(--aura-gray)', fontSize: '0.9rem' }}>
                Gestiona tus notificaciones desde la sección de{' '}
                <span onClick={() => navigate('/notificaciones')} style={{ color: 'var(--aura-lavender)', cursor: 'pointer', fontWeight: '600' }}>notificaciones</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
