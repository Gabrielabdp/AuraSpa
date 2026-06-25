import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, Calendar, DollarSign, Star, Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import apiClient from '../services/apiClient';

const COLORES = ['#6B5B93', '#B8A9C9', '#1F2D3D', '#8B7BA8', '#F5F0E8', '#4caf50', '#ff9800'];

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    // INC-W13: datos reales desde el backend (no hardcodeados)
    apiClient.get(`/api/dashboard/reportes?mes=${mes}&anio=${anio}`).then(res => {
      setData(res.data);
    }).catch(() => {
      setError('No se pudieron cargar los reportes. Verifica que tengas permisos de Cajero o Admin.');
    }).finally(() => setLoading(false));
  }, [mes, anio]);

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 8%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Reportes y Análisis</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Métricas reales del negocio</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: '10px 15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: 'white', fontSize: '0.85rem' }}>
            {meses.map((m, i) => <option key={i} value={i+1}>{m} {anio}</option>)}
          </select>
          <button onClick={() => navigate('/dashboard/staff')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '80px' }}><Loader2 className="animate-spin" size={40} style={{ color: 'var(--aura-lavender)' }} /></div>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '40px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && data && (
        <>
          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {[
              { label: 'Ingresos Netos', valor: `RD$ ${(data.resumenMes?.ingresosNetos ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, icono: <DollarSign size={22} />, color: '#22c55e', bg: '#f0fdf4' },
              { label: 'Total Ventas', valor: String(data.resumenMes?.totalVentas ?? 0), icono: <Calendar size={22} />, color: '#6B5B93', bg: '#f0ecff' },
              { label: 'CxC Pendientes', valor: String(data.cxcPendientes ?? 0), icono: <Users size={22} />, color: '#f59e0b', bg: '#fffbeb' },
              { label: 'ITBIS del mes', valor: `RD$ ${(data.resumenMes?.itbisTotal ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, icono: <Star size={22} />, color: '#1F2D3D', bg: '#E8EEF4' },
            ].map((m, i) => (
              <div key={i} className="card-aura" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: m.bg, color: m.color, padding: '12px', borderRadius: '15px' }}>{m.icono}</div>
                <div>
                  <p style={{ color: 'var(--aura-gray)', fontSize: '0.82rem', margin: '0 0 4px' }}>{m.label}</p>
                  <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '1.3rem' }}>{m.valor}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico ventas por día */}
          {data.ventasPorDia?.length > 0 && (
            <div className="card-aura" style={{ padding: '30px', marginBottom: '25px' }}>
              <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Ventas por día — {meses[mes-1]} {anio}</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.ventasPorDia.map((d: any) => ({ dia: `Día ${d.dia}`, total: d.total }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `RD$${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`RD$ ${v.toLocaleString('es-DO')}`, 'Total']} />
                  <Bar dataKey="total" fill="#6B5B93" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top servicios + distribución por categoría */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            {data.topServicios?.length > 0 && (
              <div className="card-aura" style={{ padding: '30px' }}>
                <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Top Servicios</h4>
                {data.topServicios.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '10px 15px', background: i === 0 ? '#f0ecff' : '#f8f9fa', borderRadius: '10px' }}>
                    <span style={{ fontWeight: i === 0 ? '700' : '500', fontSize: '0.88rem', color: 'var(--aura-navy)' }}>#{i+1} {s.servicio}</span>
                    <span style={{ color: '#6B5B93', fontWeight: '600', fontSize: '0.85rem' }}>RD$ {(s.ingresos ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}

            {data.citasPorCategoria?.length > 0 && (
              <div className="card-aura" style={{ padding: '30px' }}>
                <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Citas completadas por categoría</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.citasPorCategoria.map((c: any) => ({ name: c.categoria, value: c.cantidad }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.citasPorCategoria.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reportes;
