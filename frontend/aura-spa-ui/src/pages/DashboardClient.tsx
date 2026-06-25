import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShoppingBag, Clock, Heart, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

interface ProximaCita {
  servicio: string;
  fechaHora: string;
  especialista: string;
}

interface NotifResumen {
  titulo: string;
  mensaje: string;
}

const DashboardClient: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proximaCita, setProximaCita] = useState<ProximaCita | null>(null);
  const [ultimaNotif, setUltimaNotif] = useState<NotifResumen | null>(null);

  useEffect(() => {
    // Carga la próxima cita pendiente o aprobada
    apiClient.get('/api/citas/mis-citas').then(res => {
      const futuras = res.data.filter((c: any) =>
        (c.estado === 'Pendiente' || c.estado === 'Aprobada') && new Date(c.fechaHora) > new Date()
      ).sort((a: any, b: any) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

      if (futuras.length > 0) {
        setProximaCita({
          servicio: futuras[0].servicio,
          fechaHora: futuras[0].fechaHora,
          especialista: futuras[0].especialista,
        });
      }
    }).catch(() => {});

    // Carga la última notificación
    if (user?.id) {
      apiClient.get(`/api/dashboard/notificaciones/${user.id}`).then(res => {
        if (res.data.length > 0) {
          setUltimaNotif({ titulo: res.data[0].titulo, mensaje: res.data[0].mensaje });
        }
      }).catch(() => {});
    }
  }, [user]);

  const formatFecha = (fh: string) => {
    const d = new Date(fh);
    return `${d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '60px 10%' }}>
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--aura-navy)', fontSize: '3rem', fontWeight: 'bold' }}>
          ¡Bienvenida, {user?.nombre || 'Cliente'}! ✨
        </h1>
        <p style={{ color: 'var(--aura-gray)', fontSize: '1.2rem' }}>
          Tu oasis de tranquilidad personal te espera.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        <div className="card-aura" style={{ cursor: 'pointer', padding: '40px', textAlign: 'center', borderBottom: '6px solid var(--aura-lavender)' }} onClick={() => navigate('/agendamiento')}>
          <div style={{ background: 'var(--aura-lavender-light)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: 'var(--aura-navy)' }}>
            <Calendar size={32} />
          </div>
          <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Reservar Cita</h3>
          <p style={{ color: '#666' }}>Agenda tu próximo tratamiento con nuestros expertos en bienestar.</p>
        </div>

        <div className="card-aura" style={{ cursor: 'pointer', padding: '40px', textAlign: 'center', borderBottom: '6px solid var(--aura-navy)' }} onClick={() => navigate('/catalog')}>
          <div style={{ background: 'var(--aura-beige)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: 'var(--aura-navy)' }}>
            <ShoppingBag size={32} />
          </div>
          <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Tienda Aura</h3>
          <p style={{ color: '#666' }}>Compra los productos exclusivos que usamos en tus sesiones.</p>
        </div>

        <div className="card-aura" style={{ cursor: 'pointer', padding: '40px', textAlign: 'center', borderBottom: '6px solid #ffc107' }} onClick={() => navigate('/mis-citas')}>
          <div style={{ background: '#fff9e6', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: '#ffc107' }}>
            <Clock size={32} />
          </div>
          <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Mis Citas</h3>
          <p style={{ color: '#666' }}>Gestiona tus reservas actuales y revisa tu historial.</p>
          {/* Datos reales desde la API */}
          {proximaCita ? (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '15px', fontSize: '0.9rem', color: '#888' }}>
              Próxima: <strong>{proximaCita.servicio}</strong><br />
              <span style={{ fontSize: '0.8rem' }}>{formatFecha(proximaCita.fechaHora)} · {proximaCita.especialista}</span>
            </div>
          ) : (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '15px', fontSize: '0.85rem', color: '#aaa' }}>
              Sin citas próximas
            </div>
          )}
        </div>
      </div>

      {/* Notificaciones — datos reales */}
      <div className="card-aura" style={{ marginTop: '30px', padding: '25px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '12px', borderRadius: '50%' }}>
            <Bell size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 'bold', margin: 0 }}>Notificaciones</h4>
            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
              {ultimaNotif ? ultimaNotif.mensaje : 'Sin notificaciones nuevas.'}
            </p>
          </div>
        </div>
        <button className="btn-outline-aura" onClick={() => navigate('/notificaciones')}>Ver historial</button>
      </div>

      <div className="card-aura" style={{ marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px 40px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'var(--aura-lavender)', color: 'white', padding: '15px', borderRadius: '50%' }}>
            <Heart size={24} />
          </div>
          <div>
            <h4 style={{ fontWeight: 'bold', margin: 0 }}>Programa de Lealtad Aura</h4>
            <p style={{ color: '#666', margin: 0 }}>Acumula puntos con cada visita y canjéalos por descuentos exclusivos.</p>
          </div>
        </div>
        <button className="btn-outline-aura" onClick={() => navigate('/beneficios')}>Ver Beneficios</button>
      </div>
    </div>
  );
};

export default DashboardClient;
