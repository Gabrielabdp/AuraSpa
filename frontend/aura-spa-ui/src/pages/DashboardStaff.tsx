import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calculator, Users, Settings, BarChart3, Bell, CalendarCheck, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

interface CitaPendiente {
  idCita: number;
  cliente: string;
  servicio: string;
  fechaHora: string;
}

interface CitaHoy {
  idCita: number;
  cliente: string;
  servicio: string;
  fechaHora: string;
  estado: string;
}

const DashboardStaff: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citasPendientes, setCitasPendientes] = useState<CitaPendiente[]>([]);
  const [citasHoyEspecialista, setCitasHoyEspecialista] = useState<CitaHoy[]>([]);
  const [resumen, setResumen] = useState<{ ventasHoy: number; citasHoy: number } | null>(null);

  const esAdmin = user?.perfil === 'Admin';
  const esCajero = user?.perfil === 'Cajero';
  const esEspecialista = user?.perfil === 'Especialista';

  useEffect(() => {
    apiClient.get('/api/dashboard/citas-pendientes').then(res => {
      setCitasPendientes(res.data.slice(0, 3).map((c: any) => ({
        idCita: c.IdCita ?? c.idCita,
        cliente: c.Cliente ?? c.cliente ?? 'Sin cliente',
        servicio: c.Servicio ?? c.servicio ?? '',
        fechaHora: c.FechaHora ?? c.fechaHora,
      })));
    }).catch(() => {});

    if (esAdmin || esCajero) {
      apiClient.get('/api/dashboard/resumen').then(res => {
        setResumen({
          ventasHoy: res.data.ventas?.cantidad ?? 0,
          citasHoy: res.data.citasPorEstado?.reduce((acc: number, g: any) => acc + g.cantidad, 0) ?? 0,
        });
      }).catch(() => {});
    }

    if (esEspecialista) {
      const hoy = new Date().toISOString().split('T')[0];
      apiClient.get(`/api/citas/todas?fecha=${hoy}`).then(res => {
        setCitasHoyEspecialista(res.data.map((c: any) => ({
          idCita: c.idCita,
          cliente: c.cliente ? `${c.cliente.nombres} ${c.cliente.apellidos}` : 'Sin cliente',
          servicio: c.item?.nombre ?? '',
          fechaHora: c.fechaHora,
          estado: c.estado,
        })));
      }).catch(() => {});
    }
  }, [esAdmin, esCajero, esEspecialista]);

  const formatFecha = (fh: string) => {
    const d = new Date(fh);
    return `${d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const estadoColor: Record<string, { color: string; bg: string }> = {
    Pendiente:  { color: '#D4AA00', bg: '#FDF8EC' },
    Confirmada: { color: '#6B5B93', bg: '#f0ecff' },
    Completada: { color: '#22c55e', bg: '#f0fdf4' },
    Cancelada:  { color: '#ef4444', bg: '#fef2f2' },
  };

  return (
    <div className="animate-fade-in" style={{ padding: '60px 8%' }}>
      {/* Header */}
      <div style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ color: 'var(--aura-navy)', fontSize: '2.5rem', fontWeight: 'bold' }}>Panel de Control</h1>
          <p style={{ color: 'var(--aura-gray)', fontSize: '1.1rem' }}>Operaciones de {user?.perfil}</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="card-aura" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4caf50' }}></div>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>SISTEMA ONLINE</span>
          </div>
        </div>
      </div>

      {/* Métricas — solo Admin y Cajero */}
      {resumen && (esAdmin || esCajero) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="card-aura" style={{ padding: '25px', textAlign: 'center' }}>
            <p style={{ color: 'var(--aura-gray)', fontSize: '0.85rem', margin: '0 0 8px' }}>Ventas de hoy</p>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '2rem' }}>{resumen.ventasHoy}</h3>
          </div>
          <div className="card-aura" style={{ padding: '25px', textAlign: 'center' }}>
            <p style={{ color: 'var(--aura-gray)', fontSize: '0.85rem', margin: '0 0 8px' }}>Citas de hoy</p>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '2rem' }}>{resumen.citasHoy}</h3>
          </div>
        </div>
      )}

      {/* Cards principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>

        {/* Punto de Venta — Admin y Cajero */}
        {(esAdmin || esCajero) && (
          <div className="card-aura" style={{ cursor: 'pointer', borderBottom: '6px solid var(--aura-lavender)' }} onClick={() => navigate('/caja')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--aura-lavender-light)', padding: '15px', borderRadius: '20px', color: 'var(--aura-navy)' }}><Calculator size={28} /></div>
              <h3 style={{ fontWeight: 'bold' }}>Punto de Venta</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Abre la caja, procesa ventas y genera facturas.</p>
            <button className="btn-outline-aura" style={{ width: '100%' }}>Ir a Caja</button>
          </div>
        )}

        {/* Clientes — solo Admin */}
        {esAdmin && (
          <div className="card-aura" style={{ borderBottom: '6px solid var(--aura-navy)', cursor: 'pointer' }} onClick={() => navigate('/clientes')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--aura-beige)', padding: '15px', borderRadius: '20px', color: 'var(--aura-navy)' }}><Users size={28} /></div>
              <h3 style={{ fontWeight: 'bold' }}>Clientes</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Administra la base de clientes, historiales y preferencias.</p>
            <button className="btn-outline-aura" style={{ width: '100%' }}>Ver Listado</button>
          </div>
        )}

        {/* Reportes — Admin y Cajero */}
        {(esAdmin || esCajero) && (
          <div className="card-aura" style={{ borderBottom: '6px solid #17a2b8', cursor: 'pointer' }} onClick={() => navigate('/reportes')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#e0f7fa', padding: '15px', borderRadius: '20px', color: '#00838f' }}><BarChart3 size={28} /></div>
              <h3 style={{ fontWeight: 'bold' }}>Reportes</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Métricas de ventas, citas y rendimiento del mes.</p>
            <button className="btn-outline-aura" style={{ width: '100%' }}>Ver Reportes</button>
          </div>
        )}

        {/* Mis Citas de Hoy — solo Especialista */}
        {esEspecialista && (
          <div className="card-aura" style={{ borderBottom: '6px solid var(--aura-lavender)', cursor: 'pointer' }} onClick={() => navigate('/citas-especialista')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--aura-lavender-light)', padding: '15px', borderRadius: '20px', color: 'var(--aura-navy)' }}><Calendar size={28} /></div>
              <h3 style={{ fontWeight: 'bold' }}>Mis Citas de Hoy</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Consulta y gestiona las citas asignadas a ti hoy.</p>
            <button className="btn-outline-aura" style={{ width: '100%' }}>Ver mis citas</button>
          </div>
        )}

        {/* Gestión de Citas — todos */}
        <div className="card-aura" style={{ borderBottom: '6px solid #ffc107', cursor: 'pointer' }} onClick={() => navigate('/gestion-citas')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#fff9e6', padding: '15px', borderRadius: '20px', color: '#ffc107' }}><CalendarCheck size={28} /></div>
            <h3 style={{ fontWeight: 'bold' }}>Gestión de Citas</h3>
          </div>
          <p style={{ color: '#666', marginBottom: '20px' }}>Confirma, rechaza y gestiona todas las reservas.</p>
          <button className="btn-outline-aura" style={{ width: '100%' }}>Ver Citas</button>
        </div>

        {/* Administración — solo Admin */}
        {esAdmin && (
          <div className="card-aura" style={{ borderBottom: '6px solid #9c27b0', cursor: 'pointer' }} onClick={() => navigate('/core')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '20px', color: '#9c27b0' }}><Settings size={28} /></div>
              <h3 style={{ fontWeight: 'bold' }}>Administración</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Usuarios, perfiles, sucursales e inventario.</p>
            <button className="btn-outline-aura" style={{ width: '100%' }}>Gestionar</button>
          </div>
        )}

      </div>

      {/* Mis citas de hoy — solo Especialista */}
      {esEspecialista && citasHoyEspecialista.length > 0 && (
        <div className="card-aura" style={{ marginTop: '40px', padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} style={{ color: 'var(--aura-lavender)' }} /> Mis citas de hoy
            </h3>
            <button onClick={() => navigate('/citas-especialista')} className="btn-outline-aura" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Ver todas</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {citasHoyEspecialista.map(c => {
              const ec = estadoColor[c.estado] ?? estadoColor['Pendiente'];
              return (
                <div key={c.idCita} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8f6ff', borderRadius: '15px', borderLeft: '4px solid var(--aura-lavender)' }}>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, color: 'var(--aura-navy)', fontSize: '0.9rem' }}>{c.cliente} — {c.servicio}</p>
                    <p style={{ margin: 0, color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{formatFecha(c.fechaHora)}</p>
                  </div>
                  <span style={{ background: ec.bg, color: ec.color, padding: '4px 12px', borderRadius: '30px', fontSize: '0.78rem', fontWeight: '600' }}>
                    {c.estado}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Citas pendientes de confirmación — siempre visible */}
      <div className="card-aura" style={{ marginTop: '30px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} style={{ color: '#D4AA00' }} /> Citas pendientes de confirmación
          </h3>
          <button onClick={() => navigate('/gestion-citas')} className="btn-outline-aura" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Ver todas</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {citasPendientes.length === 0 ? (
            <p style={{ color: 'var(--aura-gray)', textAlign: 'center', padding: '20px', fontSize: '0.9rem', margin: 0 }}>
              No hay citas pendientes de confirmación en este momento.
            </p>
          ) : citasPendientes.map(c => (
            <div key={c.idCita} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#FDF8EC', borderRadius: '15px', borderLeft: '4px solid #D4AA00' }}>
              <div>
                <p style={{ fontWeight: '600', margin: 0, color: 'var(--aura-navy)', fontSize: '0.9rem' }}>{c.cliente} — {c.servicio}</p>
                <p style={{ margin: 0, color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{formatFecha(c.fechaHora)}</p>
              </div>
              <button onClick={() => navigate('/gestion-citas')} style={{ padding: '6px 14px', borderRadius: '30px', border: '1px solid #D4AA00', background: 'white', color: '#D4AA00', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                Revisar
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardStaff;
