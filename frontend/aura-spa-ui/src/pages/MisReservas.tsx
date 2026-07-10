import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Reserva {
  idApartado: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  itbis: number;
  total: number;
  sucursal: string;
  estado: 'Pendiente' | 'Retirado' | 'Cancelado';
  fechaReserva: string;
  notas?: string;
}

const estadoConfig: Record<string, { color: string; bg: string; icono: React.ReactNode; label: string }> = {
  Pendiente: { color: '#D4AA00', bg: '#FDF8EC', icono: <AlertCircle size={14} />, label: 'Pendiente' },
  Retirado:  { color: '#22c55e', bg: '#f0fdf4', icono: <CheckCircle size={14} />, label: 'Retirado' },
  Cancelado: { color: '#ef4444', bg: '#fef2f2', icono: <XCircle size={14} />,     label: 'Cancelado' },
};

const MisReservas: React.FC = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('Todas');

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/reservas/mis-reservas');
      setReservas(res.data);
    } catch {
      setError('No se pudieron cargar tus reservas. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const reservasFiltradas = filtro === 'Todas' ? reservas : reservas.filter(r => r.estado === filtro);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 10%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Mis Reservas</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Historial de productos reservados</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-AuraSpa" onClick={() => navigate('/catalog?tipo=Producto')} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={16} /> Reservar productos
          </button>
          <button onClick={() => navigate('/dashboard/client')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {['Todas', 'Pendiente', 'Retirado', 'Cancelado'].map(f => (
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

      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando tus reservas...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '30px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reservasFiltradas.length === 0 ? (
            <div className="card-aura" style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--aura-gray)', margin: 0 }}>No tienes reservas {filtro !== 'Todas' ? `con estado "${filtro}"` : 'registradas'}.</p>
              <button className="btn-AuraSpa" onClick={() => navigate('/catalog?tipo=Producto')} style={{ marginTop: '20px', padding: '12px 30px' }}>
                Reservar mi primer producto
              </button>
            </div>
          ) : reservasFiltradas.map(r => {
            const config = estadoConfig[r.estado] ?? estadoConfig['Pendiente'];
            return (
              <div key={r.idApartado} className="card-aura" style={{ padding: '25px 30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h4 style={{ fontWeight: 'bold', margin: 0, color: 'var(--aura-navy)', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>{r.producto}</h4>
                      <span style={{ background: config.bg, color: config.color, padding: '3px 12px', borderRadius: '30px', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {config.icono} {config.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><ShoppingBag size={14} />Cantidad: {r.cantidad}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><MapPin size={14} />{r.sucursal}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}><Calendar size={14} />{formatFecha(r.fechaReserva)}</span>
                    </div>
                    {r.notas && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#999', fontStyle: 'italic' }}>"{r.notas}"</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--aura-navy)' }}>
                      RD$ {r.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#aaa' }}>
                      RD$ {r.precioUnitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })} c/u
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisReservas;
