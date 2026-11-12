import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Search, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Cita {
  idCita: number;
  cliente: string;
  servicio: string;
  especialista: string;
  fechaHora: string;
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada' | 'Rechazada';
  precioAcordado?: number;
}

const estadoConfig: Record<string, { color: string; bg: string; icono: React.ReactNode }> = {
  Pendiente:  { color: '#D4AA00', bg: '#FDF8EC', icono: <AlertCircle size={14} /> },
  Confirmada:   { color: '#6B5B93', bg: '#f0ecff', icono: <CheckCircle size={14} /> },
  Completada: { color: '#22c55e', bg: '#f0fdf4', icono: <CheckCircle size={14} /> },
  Cancelada:  { color: '#ef4444', bg: '#fef2f2', icono: <XCircle size={14} /> },
  Rechazada:  { color: '#ef4444', bg: '#fef2f2', icono: <XCircle size={14} /> },
};

const GestionCitas: React.FC = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('Todas');
  const [search, setSearch] = useState('');
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: number; accion: string } | null>(null);

  useEffect(() => {
    fetchCitas();
  }, []);

  const fetchCitas = async () => {
    setLoading(true);
    setError('');
    try {
      // INC-W13: el backend filtra por estado Completada (no Pagado)
      const res = await apiClient.get('/api/citas/todas');
      setCitas(res.data.map((c: any) => ({
        idCita: c.idCita,
        cliente: c.cliente?.nombres ? `${c.cliente.nombres} ${c.cliente.apellidos}` : 'Sin cliente',
        servicio: c.item?.nombre ?? '',
        especialista: c.empleado ? `${c.empleado.nombres} ${c.empleado.apellidos}` : 'Sin asignar',
        fechaHora: c.fechaHora,
        estado: c.estado,
        precioAcordado: c.precioAcordado,
      })));
    } catch {
      setError('No se pudieron cargar las citas.');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    setCambiando(id);
    try {
      await apiClient.put(`/api/citas/${id}/estado`, JSON.stringify(nuevoEstado), {
        headers: { 'Content-Type': 'application/json' }
      });
      setCitas(prev => prev.map(c => c.idCita === id ? { ...c, estado: nuevoEstado as Cita['estado'] } : c));
    } catch {
      alert('No se pudo cambiar el estado de la cita.');
    } finally {
      setCambiando(null);
      setConfirmModal(null);
    }
  };

  const citasFiltradas = citas.filter(c => {
    const matchFiltro = filtro === 'Todas' || c.estado === filtro;
    const matchSearch = c.cliente.toLowerCase().includes(search.toLowerCase()) ||
      c.servicio.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  const pendientes = citas.filter(c => c.estado === 'Pendiente').length;

  const formatFechaHora = (fh: string) => {
    const d = new Date(fh);
    return `${d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 8%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Gestión de Citas</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>
            {pendientes > 0 ? <span style={{ color: '#D4AA00', fontWeight: '600' }}>⏳ {pendientes} cita{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}</span> : 'Todas las citas están al día'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchCitas} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>↻ Actualizar</button>
          <button onClick={() => navigate('/dashboard/staff')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      <div className="card-aura" style={{ padding: '20px 25px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '11px', color: '#999' }} />
          <input type="text" placeholder="Buscar por cliente o servicio..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '15px', border: '1px solid #e8e0f5', outline: 'none', background: '#fcfcfc', fontSize: '0.88rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '8px 16px', borderRadius: '30px', border: '1px solid',
              borderColor: filtro === f ? 'var(--aura-lavender)' : '#ddd',
              background: filtro === f ? 'var(--aura-lavender)' : 'white',
              color: filtro === f ? 'white' : 'var(--aura-gray)',
              fontWeight: filtro === f ? '600' : '400', cursor: 'pointer', fontSize: '0.82rem'
            }}>
              {f}{f === 'Pendiente' && pendientes > 0 && (
                <span style={{ marginLeft: '6px', background: '#D4AA00', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: '0.72rem', fontWeight: '700' }}>{pendientes}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando citas...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '30px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {citasFiltradas.length === 0 ? (
            <div className="card-aura" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--aura-gray)' }}>No hay citas con ese filtro.</p>
            </div>
          ) : citasFiltradas.map(cita => {
            const config = estadoConfig[cita.estado] ?? estadoConfig['Pendiente'];
            return (
              <div key={cita.idCita} className="card-aura" style={{ padding: '20px 25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ fontWeight: 'bold', margin: 0, color: 'var(--aura-navy)', fontSize: '0.95rem' }}>{cita.servicio}</h4>
                      <span style={{ background: config.bg, color: config.color, padding: '2px 10px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {config.icono} {cita.estado}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aura-gray)', fontSize: '0.82rem' }}><User size={13} />{cita.cliente}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aura-gray)', fontSize: '0.82rem' }}><Calendar size={13} />{formatFechaHora(cita.fechaHora)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aura-gray)', fontSize: '0.82rem' }}><User size={13} />{cita.especialista}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {cambiando === cita.idCita ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--aura-lavender)' }} />
                    ) : (
                      <>
                        {cita.estado === 'Pendiente' && (
                          <>
                            <button onClick={() => setConfirmModal({ id: cita.idCita, accion: 'Confirmada' })}
                              style={{ padding: '7px 15px', borderRadius: '30px', border: '1px solid #22c55e', background: '#f0fdf4', color: '#22c55e', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                              ✓ Confirmar
                            </button>
                            <button onClick={() => setConfirmModal({ id: cita.idCita, accion: 'Rechazada' })}
                              style={{ padding: '7px 15px', borderRadius: '30px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                              ✗ Rechazar
                            </button>
                          </>
                        )}
                        {cita.estado === 'Confirmada' && (
                          <button onClick={() => setConfirmModal({ id: cita.idCita, accion: 'Completada' })}
                            style={{ padding: '7px 15px', borderRadius: '30px', border: '1px solid var(--aura-lavender)', background: '#f0ecff', color: 'var(--aura-lavender)', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                            ✓ Completada
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card-aura" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '30px', margin: '20px', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '12px' }}>
              ¿Marcar como {confirmModal.accion}?
            </h4>
            <p style={{ color: 'var(--aura-gray)', marginBottom: '25px', fontSize: '0.9rem' }}>Esta acción actualizará el estado de la cita en el sistema.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => cambiarEstado(confirmModal.id, confirmModal.accion)} className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Confirmar</button>
              <button onClick={() => setConfirmModal(null)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCitas;
