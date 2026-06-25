import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CitaConfirmada: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const cita = location.state ?? {
    servicio: 'Servicio no especificado',
    fecha: '',
    hora: '',
    especialista: 'Sin asignar',
    referencia: 'AURA-0000',
    fechaSolicitud: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '50px', borderRadius: '30px', textAlign: 'center' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #86efac' }}>
            <CheckCircle size={44} color="#22c55e" />
          </div>
        </div>

        <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          ¡Cita confirmada!
        </h2>
        <p style={{ color: 'var(--aura-gray)', fontSize: '0.95rem', marginBottom: '35px' }}>
          Tu cita ha sido registrada correctamente. Tu cita está en espera de confirmación por parte del spa.
        </p>

        <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '25px', marginBottom: '35px', textAlign: 'left' }}>
          <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '16px', fontSize: '0.9rem' }}>
            ✨ Resumen de tu cita
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Servicio</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>{cita.servicio}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Especialista</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>{cita.especialista}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Fecha</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>{cita.fecha}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Hora</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>{cita.hora}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f0ecff', border: '1px solid var(--aura-lavender)', borderRadius: '20px', padding: '18px 25px', marginBottom: '30px', display: 'flex', alignItems: 'flex-start', gap: '14px', textAlign: 'left' }}>
  <span style={{ fontSize: '1.4rem' }}>📩</span>
  <div>
    <p style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: '0 0 4px', fontSize: '0.9rem', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Revisa tu correo electrónico</p>
    <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.83rem', lineHeight: '1.5' }}>
      Te enviamos un resumen de tu solicitud a <strong>{user?.email}</strong>. Una vez que el spa confirme tu cita, recibirás otro correo con el comprobante oficial.
    </p>
  </div>
</div>

        <button className="btn-AuraSpa" onClick={() => navigate('/catalog')} style={{ width: '100%', padding: '15px', fontSize: '1rem', marginBottom: '12px' }}>
          Volver al catálogo
        </button>

        <button onClick={() => navigate('/')} style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '50px', border: '2px solid var(--aura-lavender)', background: 'transparent', color: 'var(--aura-lavender)', fontWeight: '700', cursor: 'pointer' }}>
          Ir al inicio
        </button>

      </div>
    </div>
  );
};

export default CitaConfirmada;
