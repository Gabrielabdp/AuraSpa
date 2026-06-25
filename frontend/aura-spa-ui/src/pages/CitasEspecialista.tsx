import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle, AlertCircle, XCircle, Loader2, Bell } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Cita {
  idCita: number;
  cliente: string;
  servicio: string;
  categoria: string;
  fechaHora: string;
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada' | 'Rechazada';
  precioAcordado?: number;
}

const estadoConfig: Record<string, { color: string; bg: string; icono: React.ReactNode; label: string }> = {
  Pendiente:  { color: '#D4AA00', bg: '#FDF8EC', icono: <AlertCircle size={14} />, label: 'Pendiente' },
  Confirmada: { color: '#6B5B93', bg: '#f0ecff', icono: <CheckCircle size={14} />, label: 'Confirmada' },
  Completada: { color: '#22c55e', bg: '#f0fdf4', icono: <CheckCircle size={14} />, label: 'Completada' },
  Cancelada:  { color: '#ef4444', bg: '#fef2f2', icono: <XCircle size={14} />,     label: 'Cancelada' },
  Rechazada:  { color: '#ef4444', bg: '#fef2f2', icono: <XCircle size={14} />,     label: 'Rechazada' },
};

const CitasEspecialista: React.FC = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completando, setCompletando] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<number | null>(null);
  const [citasPendientes, setCitasPendientes] = useState<{idCita: number; cliente: string; servicio: string; fechaHora: string}[]>([]);

  const hoy = new Date();
  const fechaHoy = hoy.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchCitas();
    apiClient.get('/api/dashboard/citas-pendientes').then(res => {
      setCitasPendientes(res.data.slice(0, 3).map((c: any) => ({
        idCita: c.idCita,
        cliente: c.cliente,
        servicio: c.servicio,
        fechaHora: c.fechaHora,
      })));
    }).catch(() => {});
  }, []);

  const fetchCitas = async () => {
    setLoading(true);
    setError('');
    try {
      const fecha = hoy.toISOString().split('T')[0];
      // INC: cuando Gabriela implemente /api/citas/mis-citas-empleado usar ese endpoint
      const res = await apiClient.get(`/api/citas/todas?fecha=${fecha}`);
      const citasMapeadas = res.data.map((c: any) => ({
        idCita: c.idCita,
        cliente: c.cliente ? `${c.cliente.nombres} ${c.cliente.apellidos}` : 'Sin cliente',
        servicio: c.item?.nombre ?? '',
        categoria: c.item?.categoria?.nombre ?? '',
        fechaHora: c.fechaHora,
        estado: c.estado,
        precioAcordado: c.precioAcordado,
      }));
      // Ordenar por hora
      citasMapeadas.sort((a: Cita, b: Cita) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
      setCitas(citasMapeadas);
    } catch {
      setError('No se pudieron cargar las citas de hoy.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletar = async (idCita: number) => {
    setCompletando(idCita);
    try {
      await apiClient.put(`/api/citas/${idCita}/estado`, JSON.stringify('Completada'), {
        headers: { 'Content-Type': 'application/json' }
      });
      setCitas(prev => prev.map(c => c.idCita === idCita ? { ...c, estado: 'Completada' } : c));
    } catch {
      alert('No se pudo marcar la cita como completada.');
    } finally {
      setCompletando(null);
      setConfirmModal(null);
    }
  };

  const formatHora = (fechaHora: string) => {
    return new Date(fechaHora).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
  };

  const citasPendientesConfirmadas = citas.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada');
  const citasCompletadas = citas.filter(c => c.estado === 'Completada');
  const citasCanceladas = citas.filter(c => c.estado === 'Cancelada' || c.estado === 'Rechazada');

  const totalCitas = citasPendientesConfirmadas.length;
  const completadas = citasCompletadas.length;
  const progreso = totalCitas + completadas > 0 ? Math.round((completadas / (totalCitas + completadas)) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 8%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Mis Citas de Hoy</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem', textTransform: 'capitalize' }}>{fechaHoy}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchCitas} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>↻ Actualizar</button>
          <button onClick={() => navigate('/dashboard/staff')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      {/* Resumen del día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="card-aura" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--aura-gray)', fontSize: '0.82rem', margin: '0 0 6px' }}>Total del día</p>
          <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '1.8rem' }}>{citas.filter(c => c.estado !== 'Cancelada' && c.estado !== 'Rechazada').length}</h3>
        </div>
        <div className="card-aura" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--aura-gray)', fontSize: '0.82rem', margin: '0 0 6px' }}>Completadas</p>
          <h3 style={{ color: '#22c55e', fontWeight: 'bold', margin: 0, fontSize: '1.8rem' }}>{completadas}</h3>
        </div>
        <div className="card-aura" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--aura-gray)', fontSize: '0.82rem', margin: '0 0 6px' }}>Pendientes</p>
          <h3 style={{ color: '#D4AA00', fontWeight: 'bold', margin: 0, fontSize: '1.8rem' }}>{totalCitas}</h3>
        </div>
        {/* Barra de progreso */}
        <div className="card-aura" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--aura-gray)', fontSize: '0.82rem', margin: '0 0 10px' }}>Progreso del día</p>
          <div style={{ background: '#eee', borderRadius: '30px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progreso}%`, background: 'var(--aura-lavender)', height: '100%', borderRadius: '30px', transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ color: 'var(--aura-lavender)', fontWeight: '700', margin: '6px 0 0', fontSize: '0.9rem', textAlign: 'right' }}>{progreso}%</p>
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando citas de hoy...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '30px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Citas activas (Pendiente y Confirmada) */}
          {citasPendientesConfirmadas.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--aura-lavender)' }} /> Citas pendientes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {citasPendientesConfirmadas.map(cita => {
                  const config = estadoConfig[cita.estado];
                  return (
                    <div key={cita.idCita} className="card-aura" style={{ padding: '22px 28px', borderLeft: `4px solid ${config.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                          {/* Hora destacada */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ background: config.bg, color: config.color, padding: '4px 14px', borderRadius: '30px', fontWeight: '800', fontSize: '1rem' }}>
                              {formatHora(cita.fechaHora)}
                            </span>
                            <span style={{ background: config.bg, color: config.color, padding: '3px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {config.icono} {config.label}
                            </span>
                          </div>
                          <h4 style={{ fontWeight: 'bold', margin: '0 0 4px', color: 'var(--aura-navy)', fontFamily: "'Segoe UI', sans-serif" }}>{cita.servicio}</h4>
                          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}>
                              <User size={14} />{cita.cliente}
                            </span>
                            {cita.categoria && (
                              <span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '2px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600' }}>
                                {cita.categoria}
                              </span>
                            )}
                            {cita.precioAcordado && (
                              <span style={{ color: 'var(--aura-navy)', fontWeight: '600', fontSize: '0.85rem' }}>
                                RD$ {cita.precioAcordado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Botón completar — solo si está Confirmada */}
                        {cita.estado === 'Confirmada' && (
                          <button
                            onClick={() => setConfirmModal(cita.idCita)}
                            disabled={completando === cita.idCita}
                            style={{ padding: '10px 20px', borderRadius: '30px', border: '1px solid #22c55e', background: '#f0fdf4', color: '#22c55e', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                          >
                            {completando === cita.idCita ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Marcar completada</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Citas completadas */}
          {citasCompletadas.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Completadas hoy
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {citasCompletadas.map(cita => (
                  <div key={cita.idCita} className="card-aura" style={{ padding: '18px 25px', opacity: 0.75, borderLeft: '4px solid #22c55e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: '#f0fdf4', color: '#22c55e', padding: '3px 12px', borderRadius: '30px', fontWeight: '700', fontSize: '0.9rem' }}>
                        {formatHora(cita.fechaHora)}
                      </span>
                      <div>
                        <p style={{ fontWeight: '600', margin: 0, color: 'var(--aura-navy)', fontSize: '0.9rem', fontFamily: "'Segoe UI', sans-serif" }}>{cita.servicio}</p>
                        <p style={{ margin: 0, color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{cita.cliente}</p>
                      </div>
                      <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#22c55e', padding: '3px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600' }}>
                        ✓ Completada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canceladas */}
          {citasCanceladas.length > 0 && (
            <div>
              <h3 style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={18} /> Canceladas / Rechazadas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {citasCanceladas.map(cita => (
                  <div key={cita.idCita} className="card-aura" style={{ padding: '18px 25px', opacity: 0.6, borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: '#fef2f2', color: '#ef4444', padding: '3px 12px', borderRadius: '30px', fontWeight: '700', fontSize: '0.9rem' }}>
                        {formatHora(cita.fechaHora)}
                      </span>
                      <div>
                        <p style={{ fontWeight: '600', margin: 0, color: 'var(--aura-navy)', fontSize: '0.9rem', fontFamily: "'Segoe UI', sans-serif" }}>{cita.servicio}</p>
                        <p style={{ margin: 0, color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{cita.cliente}</p>
                      </div>
                      <span style={{ marginLeft: 'auto', background: '#fef2f2', color: '#ef4444', padding: '3px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {cita.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {citas.length === 0 && (
            <div className="card-aura" style={{ padding: '60px', textAlign: 'center' }}>
              <Calendar size={40} style={{ color: '#ddd', marginBottom: '15px' }} />
              <p style={{ color: 'var(--aura-gray)', margin: 0 }}>No tienes citas asignadas para hoy.</p>
            </div>
          )}
        </>
      )}

      {/* Citas pendientes de confirmación */}
      {citasPendientes.length > 0 && (
        <div className="card-aura" style={{ marginTop: '30px', padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} style={{ color: '#D4AA00' }} /> Citas pendientes de confirmación
            </h3>
            <button onClick={() => navigate('/gestion-citas')} className="btn-outline-aura" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Ver todas</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {citasPendientes.map(c => {
              const d = new Date(c.fechaHora);
              const fecha = `${d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
              return (
                <div key={c.idCita} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#FDF8EC', borderRadius: '15px', borderLeft: '4px solid #D4AA00' }}>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, color: 'var(--aura-navy)', fontSize: '0.9rem' }}>{c.cliente} — {c.servicio}</p>
                    <p style={{ margin: 0, color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{fecha}</p>
                  </div>
                  <button onClick={() => navigate('/gestion-citas')} style={{ padding: '6px 14px', borderRadius: '30px', border: '1px solid #D4AA00', background: 'white', color: '#D4AA00', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Revisar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card-aura" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
            <CheckCircle size={44} color="#22c55e" style={{ marginBottom: '15px' }} />
            <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>¿Marcar como completada?</h4>
            <p style={{ color: 'var(--aura-gray)', marginBottom: '25px', fontSize: '0.9rem' }}>
              {citas.find(c => c.idCita === confirmModal)?.servicio} — {citas.find(c => c.idCita === confirmModal)?.cliente}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => handleCompletar(confirmModal)} className="btn-AuraSpa" style={{ padding: '10px 25px' }}>
                {completando === confirmModal ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmModal(null)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitasEspecialista;
