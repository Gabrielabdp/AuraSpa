import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

interface Notificacion {
  idNotificacion: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fechaEnvio: string;
  leida: boolean;
}

const Notificaciones: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    apiClient.get(`/api/dashboard/notificaciones/${user.id}`).then(res => {
      setNotificaciones(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const marcarLeida = async (id: number) => {
    try {
      await apiClient.put(`/api/dashboard/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.idNotificacion === id ? { ...n, leida: true } : n));
    } catch {}
  };

  const marcarTodasLeidas = async () => {
    const noLeidas = notificaciones.filter(n => !n.leida);
    await Promise.allSettled(noLeidas.map(n => apiClient.put(`/api/dashboard/notificaciones/${n.idNotificacion}/leer`)));
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const iconoPorTipo = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'cita': return <Calendar size={18} color="var(--aura-lavender)" />;
      case 'orden': return <ShoppingBag size={18} color="#22c55e" />;
      case 'sistema': return <AlertCircle size={18} color="#f59e0b" />;
      default: return <Bell size={18} />;
    }
  };

  const colorPorTipo = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'cita': return '#f0ecff';
      case 'orden': return '#f0fdf4';
      case 'sistema': return '#fffbeb';
      default: return '#f8f9fa';
    }
  };

  const formatFecha = (f: string) => new Date(f).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 10%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Notificaciones</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>{noLeidas > 0 ? `${noLeidas} sin leer` : 'Todas leídas'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {noLeidas > 0 && (
            <button onClick={marcarTodasLeidas} style={{ padding: '10px 20px', borderRadius: '30px', border: '1px solid var(--aura-lavender)', background: 'transparent', color: 'var(--aura-lavender)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
              Marcar todas como leídas
            </button>
          )}
          <button onClick={() => navigate('/dashboard/client')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} style={{ color: 'var(--aura-lavender)' }} /></div>}

      {!loading && notificaciones.length === 0 && (
        <div className="card-aura" style={{ padding: '60px', textAlign: 'center' }}>
          <Bell size={40} style={{ color: '#ddd', marginBottom: '15px' }} />
          <p style={{ color: 'var(--aura-gray)' }}>No tienes notificaciones todavía.</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notificaciones.map(n => (
            <div key={n.idNotificacion} onClick={() => marcarLeida(n.idNotificacion)} className="card-aura" style={{
              padding: '20px 25px', display: 'flex', gap: '16px', alignItems: 'flex-start',
              cursor: 'pointer', borderLeft: n.leida ? 'none' : '4px solid var(--aura-lavender)',
              opacity: n.leida ? 0.85 : 1, transition: 'all 0.2s'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: colorPorTipo(n.tipo), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {iconoPorTipo(n.tipo)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ fontWeight: n.leida ? '500' : '700', color: 'var(--aura-navy)', margin: 0, fontSize: '0.95rem' }}>{n.titulo}</p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--aura-gray)', whiteSpace: 'nowrap', marginLeft: '12px' }}>{formatFecha(n.fechaEnvio)}</span>
                </div>
                <p style={{ color: '#666', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>{n.mensaje}</p>
              </div>
              {!n.leida && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--aura-lavender)', flexShrink: 0, marginTop: '6px' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
