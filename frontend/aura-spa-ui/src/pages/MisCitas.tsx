import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Star, CheckCircle, XCircle, AlertCircle, Plus, Loader2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import jsPDF from 'jspdf';

interface Cita {
  idCita: number;
  servicio: string;
  categoria: string;
  especialista: string;
  sucursal: string;
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

const MisCitas: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('Todas');
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<Record<number, string>>({});

  const [resenaModal, setResenaModal] = useState<number | null>(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    fetchCitas();
  }, []);

  const fetchCitas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/citas/mis-citas');
      setCitas(res.data);
    } catch {
      setError('No se pudieron cargar tus citas. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (idCita: number) => {
    setCancelando(idCita);
    setCancelError(prev => ({ ...prev, [idCita]: '' }));
    try {
      await apiClient.put(`/api/citas/${idCita}/cancelar`);
      setCitas(prev => prev.map(c => c.idCita === idCita ? { ...c, estado: 'Cancelada' } : c));
    } catch (err: any) {
      const msg = err.response?.data;
      setCancelError(prev => ({ ...prev, [idCita]: typeof msg === 'string' ? msg : 'No se pudo cancelar la cita.' }));
    } finally {
      setCancelando(null);
    }
  };

  const handleResena = (_citaId: number) => {
    setResenaModal(null);
    setCalificacion(0);
    setComentario('');
    alert('Reseña enviada. Gracias por tu opinión. (Endpoint /api/resenas pendiente en el Core)');
  };

  const descargarComprobante = (cita: Cita) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const { fecha, hora } = formatFechaHora(cita.fechaHora);
    const referencia = `AURA-${cita.idCita.toString().padStart(4, '0')}`;
    const fechaHoy = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });

    // Header navy
    doc.setFillColor(31, 45, 61);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('AURA', margin, 22);
    const auraWidth = doc.getTextWidth('AURA');
    doc.setTextColor(151, 138, 221);
    doc.text(' Spa', margin + auraWidth, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Comprobante de Cita', margin, 32);
    doc.text('AuraSpa Piantini — Sucursal Principal', margin, 39);

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 200);
    doc.text('No. Referencia', pageWidth - margin, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(151, 138, 221);
    doc.text(referencia, pageWidth - margin, 30, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(`Emitido: ${fechaHoy}`, pageWidth - margin, 38, { align: 'right' });

    doc.setDrawColor(151, 138, 221);
    doc.setLineWidth(0.8);
    doc.line(margin, 50, pageWidth - margin, 50);

    let y = 62;

    // Sección cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Información del Cliente', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 12;

    const nombreCompleto = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Cliente AuraSpa';
    const clienteData: [string, string][] = [
      ['Nombre:', nombreCompleto],
      ['Correo:', user?.email ?? '—'],
      ['Telefono:', user?.telefono ?? '—'],
    ];

    clienteData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 35, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Sección cita
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Información de la Cita', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 12;

    const citaData: [string, string][] = [
      ['Servicio:', cita.servicio],
      ['Especialista:', cita.especialista],
      ['Fecha:', fecha],
      ['Hora:', hora],
      ['Lugar:', cita.sucursal || 'AuraSpa Piantini — Sucursal Principal'],
    ];

    if (cita.precioAcordado) {
      citaData.push(['Precio:', `RD$ ${cita.precioAcordado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`]);
    }

    citaData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 35, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Estado
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Estado de la Cita', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Estado:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 45, 61);
    doc.text(cita.estado, margin + 35, y);

    y += 18;
    doc.setDrawColor(151, 138, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(`${referencia} — Comprobante generado el ${fechaHoy}`, pageWidth / 2, y, { align: 'center' });
    doc.text('AuraSpa © 2026 — Este documento es un comprobante de reserva, no de pago.', pageWidth / 2, y + 7, { align: 'center' });

    doc.setFillColor(31, 45, 61);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text('www.auraspa.com  |  contacto@auraspa.com  |  809-000-0000', pageWidth / 2, pageHeight - 4, { align: 'center' });

    doc.save(`comprobante-cita-${referencia}.pdf`);
  };

  const citasFiltradas = filtro === 'Todas' ? citas : citas.filter(c => c.estado === filtro);

  const formatFechaHora = (fechaHora: string) => {
    const d = new Date(fechaHora);
    return {
      fecha: d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 10%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Mis Citas</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Historial y gestión de tus reservas</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-AuraSpa" onClick={() => navigate('/agendamiento')} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Nueva cita
          </button>
          <button onClick={() => navigate('/dashboard/client')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '8px 18px', borderRadius: '30px', border: '1px solid',
            borderColor: filtro === f ? 'var(--aura-lavender)' : '#ddd',
            background: filtro === f ? 'var(--aura-lavender)' : 'white',
            color: filtro === f ? 'white' : 'var(--aura-gray)',
            fontWeight: filtro === f ? '600' : '400',
            cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
          }}>{f}</button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando tus citas...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '30px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {citasFiltradas.length === 0 ? (
            <div className="card-aura" style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--aura-gray)', margin: 0 }}>No tienes citas {filtro !== 'Todas' ? `con estado "${filtro}"` : 'registradas'}.</p>
              <button className="btn-AuraSpa" onClick={() => navigate('/agendamiento')} style={{ marginTop: '20px', padding: '12px 30px' }}>
                Agendar mi primera cita
              </button>
            </div>
          ) : citasFiltradas.map(cita => {
            const config = estadoConfig[cita.estado] ?? estadoConfig['Pendiente'];
            const { fecha, hora } = formatFechaHora(cita.fechaHora);
            return (
              <div key={cita.idCita} className="card-aura" style={{ padding: '25px 30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 'bold', margin: 0, color: 'var(--aura-navy)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>{cita.servicio}</h4>
                      <span style={{ background: config.bg, color: config.color, padding: '3px 12px', borderRadius: '30px', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {config.icono} {config.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><User size={14} />{cita.especialista}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><Calendar size={14} />{fecha}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><Clock size={14} />{hora}</span>
                    </div>
                    {cita.precioAcordado && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--aura-navy)', fontWeight: '600' }}>
                        RD$ {cita.precioAcordado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {cancelError[cita.idCita] && (
                      <p style={{ color: '#c62828', fontSize: '0.82rem', marginTop: '8px', margin: 0 }}>{cancelError[cita.idCita]}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Comprobante solo para citas Confirmadas o Completadas */}
                    {(cita.estado === 'Confirmada' || cita.estado === 'Completada') && (
                      <button onClick={() => descargarComprobante(cita)} style={{
                        padding: '8px 18px', borderRadius: '30px', border: '1px solid #6B5B93',
                        background: '#f0ecff', color: '#6B5B93', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        <Download size={13} /> Comprobante
                      </button>
                    )}
                    {cita.estado === 'Completada' && (
                      <button onClick={() => setResenaModal(cita.idCita)} style={{
                        padding: '8px 18px', borderRadius: '30px', border: '1px solid var(--aura-lavender)',
                        background: '#f0ecff', color: 'var(--aura-lavender)', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem'
                      }}>✍️ Dejar reseña</button>
                    )}
                    {(cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && (
                      <button
                        onClick={() => handleCancelar(cita.idCita)}
                        disabled={cancelando === cita.idCita}
                        style={{ padding: '8px 18px', borderRadius: '30px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        {cancelando === cita.idCita ? <Loader2 size={14} className="animate-spin" /> : 'Cancelar cita'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resenaModal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card-aura" style={{ width: '100%', maxWidth: '460px', padding: '40px', borderRadius: '30px' }}>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Dejar reseña</h3>
            <p style={{ color: 'var(--aura-gray)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '25px' }}>
              {citas.find(c => c.idCita === resenaModal)?.servicio}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={36} fill={s <= calificacion ? '#fbbf24' : 'none'} color={s <= calificacion ? '#fbbf24' : '#ddd'}
                  style={{ cursor: 'pointer' }} onClick={() => setCalificacion(s)} />
              ))}
            </div>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos tu experiencia..." rows={3}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc', fontSize: '0.9rem', resize: 'none', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleResena(resenaModal!)} className="btn-AuraSpa" style={{ flex: 1, padding: '12px' }} disabled={calificacion === 0}>Publicar reseña</button>
              <button onClick={() => { setResenaModal(null); setCalificacion(0); setComentario(''); }} className="btn-outline-aura" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisCitas;
