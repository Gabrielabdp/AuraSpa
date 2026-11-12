import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, BarChart2, FileText, CreditCard, DoorOpen,
  CheckCircle, Trash2, Wifi, WifiOff, Send, LogOut, Clock
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface CartItem { id: number; descripcion: string; cantidad: number; precioUnitario: number; itbis: number; subtotal: number; }
type Seccion = 'apertura' | 'ventas' | 'movimientos' | 'cotizaciones' | 'cxc' | 'cierre';

// ── DATOS ──────────────────────────────────────────────────────────────────────
const SERVICIOS = [
  { id: 1, nombre: 'Facial Hidratante', precio: 1800, categoria: 'Facial' },
  { id: 2, nombre: 'Masaje Relajante', precio: 2500, categoria: 'Masaje' },
  { id: 3, nombre: 'Depilación Piernas', precio: 1200, categoria: 'Depilación' },
  { id: 4, nombre: 'Diseño de Cejas', precio: 600, categoria: 'Cejas' },
  { id: 5, nombre: 'Manicura Semipermanente', precio: 900, categoria: 'Uñas' },
  { id: 6, nombre: 'Tinte y Corte', precio: 3500, categoria: 'Pelo' },
  { id: 7, nombre: 'Crema Hidratante', precio: 850, categoria: 'Producto' },
];
const ESPECIALISTAS = ['Nicole Martínez', 'Ana García', 'María López', 'Carmen Rodríguez'];
const CLIENTES = ['Cliente Final', 'Gabriela Duverge', 'Diana Lantigua', 'Jorge Melo'];
const ITBIS_RATE = 0.18;

const MOVIMIENTOS_DATA = [
  { id: 1, concepto: 'Venta #FAC-001', fechaHora: '05/06/2026 09:30', tipo: 'Ingreso', usuario: 'Diana Ferreras', monto: 2950.00, estado: 'Sincronizado', condicionPago: 'Contado' },
  { id: 2, concepto: 'Venta #FAC-002', fechaHora: '05/06/2026 10:15', tipo: 'Ingreso', usuario: 'Diana Ferreras', monto: 1416.00, estado: 'Pendiente', condicionPago: 'Crédito' },
];

const CXC_DATA = [
  { id: 1, ventaId: 'FAC-003', clienteNombre: 'Gabriela Duverge', montoTotal: 2950.00, montoPagado: 0, saldoPendiente: 2950.00, fechaVencimiento: '19/06/2026', estado: 'Pendiente' },
  { id: 2, ventaId: 'FAC-004', clienteNombre: 'Diana Lantigua', montoTotal: 1200.00, montoPagado: 600.00, saldoPendiente: 600.00, fechaVencimiento: '15/06/2026', estado: 'Parcial' },
];

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 15px', borderRadius: '15px', border: '1px solid #e8e0f5', outline: 'none', background: '#fcfcfc', fontSize: '0.88rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--aura-gray)', fontWeight: '500' };

// ── HELPERS ────────────────────────────────────────────────────────────────────
const subtotalCart = (cart: CartItem[]) => cart.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
const itbisCart = (cart: CartItem[]) => cart.reduce((acc, i) => acc + i.itbis, 0);
const totalCart = (cart: CartItem[]) => cart.reduce((acc, i) => acc + i.subtotal, 0);
const fmt = (n: number) => n.toLocaleString('es-DO', { minimumFractionDigits: 2 });

// ── TABLA CARRITO (fuera del componente principal) ─────────────────────────────
const TablaCarrito: React.FC<{ cart: CartItem[]; onRemove: (id: number) => void }> = ({ cart, onRemove }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
      <thead>
        <tr style={{ background: '#EDE8F5' }}>
          {['#', 'Descripción', 'Cant.', 'Precio Unit.', 'ITBIS', 'Subtotal', ''].map(h => (
            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--aura-navy)', borderBottom: '2px solid #e8e0f5' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cart.length === 0 ? (
          <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#bbb', fontSize: '0.88rem' }}>Sin ítems — selecciona un servicio para comenzar</td></tr>
        ) : cart.map((item, i) => (
          <tr key={item.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
            <td style={{ padding: '10px 14px', color: 'var(--aura-gray)' }}>{item.id}</td>
            <td style={{ padding: '10px 14px', fontWeight: '500', color: 'var(--aura-navy)' }}>{item.descripcion}</td>
            <td style={{ padding: '10px 14px' }}>{item.cantidad}</td>
            <td style={{ padding: '10px 14px' }}>RD$ {fmt(item.precioUnitario)}</td>
            <td style={{ padding: '10px 14px', color: 'var(--aura-gray)' }}>RD$ {fmt(item.itbis)}</td>
            <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--aura-navy)' }}>RD$ {fmt(item.subtotal)}</td>
            <td style={{ padding: '10px 14px' }}>
              <button onClick={() => onRemove(item.id)} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 10px', borderRadius: '8px' }}>
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── PANEL FACTURACIÓN (fuera del componente principal) ─────────────────────────
interface PanelProps { cart: CartItem[]; condicion: string; setCondicion: (v: string) => void; metodoPago: string; setMetodoPago: (v: string) => void; onFinalizar: () => void; label: string; showPago?: boolean; }
const PanelFacturacion: React.FC<PanelProps> = ({ cart, condicion, setCondicion, metodoPago, setMetodoPago, onFinalizar, label, showPago = true }) => {
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const sub = subtotalCart(cart);
  const itb = itbisCart(cart);
  const tot = totalCart(cart);
  const cambio = Number(efectivoRecibido) - tot;
  const efectivoInsuficiente = efectivoRecibido !== '' && Number(efectivoRecibido) < tot;

  return (
    <div className="card-aura" style={{ padding: '25px', position: 'sticky', top: '20px' }}>
      <h4 style={{ fontWeight: '700', marginBottom: '20px', color: 'var(--aura-navy)' }}>Facturación</h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
        <span style={{ color: 'var(--aura-gray)' }}>Subtotal</span><span>RD$ {fmt(sub)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.88rem' }}>
        <span style={{ color: 'var(--aura-gray)' }}>ITBIS (18%)</span><span>RD$ {fmt(itb)}</span>
      </div>
      <hr style={{ marginBottom: '15px', borderColor: '#f0edf5' }} />
      {showPago && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Condición de Pago</label>
            <select value={condicion} onChange={(e) => setCondicion(e.target.value)} style={inputStyle}>
              <option>Contado</option><option>Crédito</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Método de Pago</label>
            <select value={metodoPago} onChange={(e) => { setMetodoPago(e.target.value); setEfectivoRecibido(''); }} style={inputStyle}>
              <option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option>
            </select>
          </div>
          {/* Campo efectivo recibido — solo cuando método es Efectivo */}
          {metodoPago === 'Efectivo' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Efectivo Recibido (RD$)</label>
              <input
                type="text"
                value={efectivoRecibido}
                onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setEfectivoRecibido(e.target.value); }}
                placeholder="0.00"
                style={{ ...inputStyle, border: efectivoInsuficiente ? '1px solid #ef4444' : '1px solid #e8e0f5' }}
              />
              {efectivoInsuficiente && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
                  Efectivo insuficiente — faltan RD$ {fmt(tot - Number(efectivoRecibido))}
                </p>
              )}
              {/* Cambio a devolver */}
              {efectivoRecibido !== '' && !efectivoInsuficiente && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '10px 14px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: '500' }}>Cambio a devolver:</span>
                  <strong style={{ color: '#16a34a', fontSize: '1rem' }}>RD$ {fmt(cambio)}</strong>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div style={{ background: 'linear-gradient(135deg, var(--aura-navy), #2a2a72)', color: 'white', padding: '16px', borderRadius: '15px', textAlign: 'center', marginBottom: '16px', marginTop: '10px' }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>Total {showPago ? 'a Pagar' : 'Cotizado'}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>RD$ {fmt(tot)}</div>
      </div>
      <button
        onClick={onFinalizar}
        className="btn-AuraSpa"
        style={{ width: '100%', padding: '12px' }}
        disabled={cart.length === 0 || (showPago && metodoPago === 'Efectivo' && efectivoInsuficiente)}
      >
        {label}
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const Caja: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [seccion, setSeccion] = useState<Seccion>('apertura');
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fondoCaja, setFondoCaja] = useState(0);
  const [pendientesSync] = useState(2);

  // Apertura
  const [montoApertura, setMontoApertura] = useState('');
  const [observacionApertura, setObservacionApertura] = useState('');
  const [montoError, setMontoError] = useState('');

  // Ventas
  const [cartVenta, setCartVenta] = useState<CartItem[]>([]);
  const [ventaCliente, setVentaCliente] = useState('Cliente Final');
  const [ventaEspecialista, setVentaEspecialista] = useState('');
  const [ventaCategoria, setVentaCategoria] = useState('');
  const [ventaServicio, setVentaServicio] = useState('');
  const [ventaCantidad, setVentaCantidad] = useState('1');
  const [ventaCondicion, setVentaCondicion] = useState('Contado');
  const [ventaMetodoPago, setVentaMetodoPago] = useState('Efectivo');
  const [ventaEspecialistaError, setVentaEspecialistaError] = useState('');
  const [ventaSuccess, setVentaSuccess] = useState(false);

  // Cotizaciones
  const [cartCot, setCartCot] = useState<CartItem[]>([]);
  const [cotCliente, setCotCliente] = useState('Cliente Final');
  const [cotEspecialista, setCotEspecialista] = useState('');
  const [cotServicio, setCotServicio] = useState('');
  const [cotCantidad, setCotCantidad] = useState('1');
  const [cotSuccess, setCotSuccess] = useState(false);
  const [cotNumero] = useState(`COT-${String(Math.floor(Math.random() * 9000) + 1000)}`);

  // Movimientos
  const [movFechaDesde, setMovFechaDesde] = useState('');
  const [movFechaHasta, setMovFechaHasta] = useState('');
  const [movFiltrados, setMovFiltrados] = useState(MOVIMIENTOS_DATA);

  // Cierre
  const [montoCierre, setMontoCierre] = useState('');
  const [montoCierreError, setMontoCierreError] = useState('');
  const [cierreSuccess, setCierreSuccess] = useState(false);

  const validarNumero = (val: string, setter: (v: string) => void, errorSetter: (v: string) => void) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) { errorSetter('Solo se permiten valores numéricos.'); return; }
    errorSetter(''); setter(val);
  };

  const agregarItem = (cart: CartItem[], setCart: React.Dispatch<React.SetStateAction<CartItem[]>>, servicioId: string, cantidadStr: string) => {
    const svc = SERVICIOS.find(s => s.id === Number(servicioId));
    if (!svc) return;
    const cantidad = parseInt(cantidadStr) || 1;
    const sub = svc.precio * cantidad;
    const itbis = sub * ITBIS_RATE;
    const existing = cart.find(i => i.id === svc.id);
    if (existing) {
      setCart(cart.map(i => i.id === svc.id ? { ...i, cantidad: i.cantidad + cantidad, itbis: (i.cantidad + cantidad) * svc.precio * ITBIS_RATE, subtotal: (i.cantidad + cantidad) * svc.precio * (1 + ITBIS_RATE) } : i));
    } else {
      setCart([...cart, { id: svc.id, descripcion: svc.nombre, cantidad, precioUnitario: svc.precio, itbis, subtotal: sub + itbis }]);
    }
  };

  const handleAbrirCaja = () => {
    if (!montoApertura || isNaN(Number(montoApertura)) || Number(montoApertura) <= 0) { setMontoError('Ingresa un monto válido mayor a 0.'); return; }
    setFondoCaja(Number(montoApertura));
    setCajaAbierta(true);
    setSeccion('ventas');
  };

  const handleFinalizarVenta = () => {
    if (!ventaEspecialista) { setVentaEspecialistaError('Selecciona un especialista.'); return; }
    if (cartVenta.length === 0) return;
    setVentaEspecialistaError('');
    setVentaSuccess(true);
    setCartVenta([]);
    setTimeout(() => setVentaSuccess(false), 3000);
  };

  const handleGenerarCotizacion = () => {
    if (cartCot.length === 0) return;
    setCotSuccess(true);
    setCartCot([]);
    setTimeout(() => setCotSuccess(false), 3000);
  };

  const handleCerrarCaja = () => {
    if (!montoCierre || isNaN(Number(montoCierre)) || Number(montoCierre) < 0) { setMontoCierreError('Ingresa un monto válido.'); return; }
    setMontoCierreError('');
    setCierreSuccess(true);
    setCajaAbierta(false);
    setTimeout(() => { setCierreSuccess(false); navigate('/dashboard/staff'); }, 2000);
  };

  const tabs = [
    { id: 'apertura',     label: 'Apertura',          icono: <DoorOpen size={16} /> },
    { id: 'ventas',       label: 'Ventas',             icono: <ShoppingCart size={16} /> },
    { id: 'movimientos',  label: 'Movimientos',        icono: <BarChart2 size={16} /> },
    { id: 'cotizaciones', label: 'Cotizaciones',       icono: <FileText size={16} /> },
    { id: 'cxc',          label: 'Cuentas por Cobrar', icono: <CreditCard size={16} /> },
    { id: 'cierre',       label: 'Cerrar Caja',        icono: <LogOut size={16} /> },
  ];

  const totalVentas = 4366.00;
  const diferencia = Number(montoCierre) - (fondoCaja + totalVentas);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0edf5', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>
            AuraSpa <span style={{ color: 'var(--aura-lavender)' }}>Caja</span>
          </h2>
          <span style={{ background: cajaAbierta ? '#f0fdf4' : '#fef2f2', color: cajaAbierta ? '#22c55e' : '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
            {cajaAbierta ? '● ABIERTA' : '● CERRADA'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--aura-gray)' }}>Sucursal: <strong>Sucursal #101</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: pendientesSync > 0 ? '#ef4444' : '#22c55e' }}>
            {pendientesSync > 0 ? <WifiOff size={14} /> : <Wifi size={14} />}
            {pendientesSync > 0 ? `Desconectado (${pendientesSync} pendientes)` : 'Conectado'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--aura-gray)' }}>
            <Clock size={14} /> {new Date().toLocaleTimeString('es-DO')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--aura-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
              {user?.nombre?.[0] || 'U'}
            </div>
            <span style={{ fontWeight: '500', color: 'var(--aura-navy)', fontSize: '0.88rem' }}>{user?.nombre}</span>
          </div>
          <button onClick={() => navigate('/dashboard/staff')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aura-gray)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0edf5', padding: '0 40px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => (cajaAbierta || tab.id === 'apertura') ? setSeccion(tab.id as Seccion) : undefined}
            style={{ padding: '14px 20px', border: 'none', background: 'transparent', cursor: (cajaAbierta || tab.id === 'apertura') ? 'pointer' : 'not-allowed', color: seccion === tab.id ? 'var(--aura-lavender)' : (cajaAbierta || tab.id === 'apertura') ? 'var(--aura-gray)' : '#ccc', fontWeight: seccion === tab.id ? '700' : '400', fontSize: '0.88rem', whiteSpace: 'nowrap', borderBottom: seccion === tab.id ? '2px solid var(--aura-lavender)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}>
            {tab.icono} {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ padding: '30px 40px' }}>

        {/* APERTURA */}
        {seccion === 'apertura' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '45px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: '#EDE8F5', padding: '12px', borderRadius: '50%', color: 'var(--aura-lavender)' }}>
                  <DoorOpen size={24} />
                </div>
                <h3 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Apertura de Caja</h3>
              </div>
              <p style={{ color: 'var(--aura-gray)', fontSize: '0.88rem', marginBottom: '30px' }}>
                Bienvenida, <strong>{user?.nombre}</strong>. Registra el fondo inicial para comenzar el turno.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Fondo de Apertura (RD$)</label>
                <input type="text" value={montoApertura} onChange={(e) => validarNumero(e.target.value, setMontoApertura, setMontoError)} placeholder="Ej: 5,000.00" style={{ ...inputStyle, border: montoError ? '1px solid #ef4444' : '1px solid #e8e0f5' }} />
                {montoError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{montoError}</p>}
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={labelStyle}>Observación (opcional)</label>
                <input type="text" value={observacionApertura} onChange={(e) => setObservacionApertura(e.target.value)} placeholder="Ej: Turno matutino" style={inputStyle} />
              </div>
              <button onClick={handleAbrirCaja} className="btn-AuraSpa" style={{ width: '100%', padding: '14px' }}>Abrir Caja</button>
            </div>
          </div>
        )}

        {/* VENTAS */}
        {seccion === 'ventas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '25px', alignItems: 'start' }}>
            <div>
              <div className="card-aura" style={{ padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', marginBottom: '16px', fontSize: '0.95rem' }}>Información</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                  <div><label style={labelStyle}>Cliente</label>
                    <select value={ventaCliente} onChange={(e) => setVentaCliente(e.target.value)} style={inputStyle}>
                      {CLIENTES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Cajero</label>
                    <input type="text" value={user?.nombre || ''} disabled style={{ ...inputStyle, background: '#f0f0f0' }} />
                  </div>
                  <div><label style={labelStyle}>Sucursal</label>
                    <input type="text" value="Sucursal #101" disabled style={{ ...inputStyle, background: '#f0f0f0' }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--aura-gray)', margin: 0, textAlign: 'right' }}>
                  Fondo disponible: <strong style={{ color: 'var(--aura-navy)' }}>RD$ {fmt(fondoCaja)}</strong>
                </p>
              </div>

              <div className="card-aura" style={{ padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', marginBottom: '16px', fontSize: '0.95rem' }}>Añadir Servicio / Producto</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px auto', gap: '12px', alignItems: 'end' }}>
                  <div><label style={labelStyle}>Categoría</label>
                    <select value={ventaCategoria} onChange={(e) => setVentaCategoria(e.target.value)} style={inputStyle}>
                      <option value="">Todas</option>
                      {['Facial','Masaje','Depilación','Cejas','Uñas','Pelo','Producto'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Especialista</label>
                    <select value={ventaEspecialista} onChange={(e) => { setVentaEspecialista(e.target.value); setVentaEspecialistaError(''); }} style={{ ...inputStyle, border: ventaEspecialistaError ? '1px solid #ef4444' : '1px solid #e8e0f5' }}>
                      <option value="">Selecciona...</option>
                      {ESPECIALISTAS.map(e => <option key={e}>{e}</option>)}
                    </select>
                    {ventaEspecialistaError && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '2px' }}>{ventaEspecialistaError}</p>}
                  </div>
                  <div><label style={labelStyle}>Servicio / Producto</label>
                    <select value={ventaServicio} onChange={(e) => setVentaServicio(e.target.value)} style={inputStyle}>
                      <option value="">Selecciona...</option>
                      {SERVICIOS.filter(s => !ventaCategoria || s.categoria === ventaCategoria).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Cant.</label>
                    <input type="text" value={ventaCantidad} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setVentaCantidad(e.target.value); }} style={inputStyle} />
                  </div>
                  <div>
                    <button onClick={() => agregarItem(cartVenta, setCartVenta, ventaServicio, ventaCantidad)} className="btn-AuraSpa" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>+ Añadir</button>
                  </div>
                </div>
              </div>

              <div className="card-aura" style={{ padding: '20px' }}>
                {ventaSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '10px 16px', marginBottom: '15px' }}>
                    <CheckCircle size={16} color="#22c55e" />
                    <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>Venta registrada exitosamente.</span>
                  </div>
                )}
                <TablaCarrito cart={cartVenta} onRemove={(id) => setCartVenta(cartVenta.filter(i => i.id !== id))} />
                <div style={{ marginTop: '15px' }}>
                  <button onClick={() => setCartVenta([])} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Limpiar carrito</button>
                </div>
              </div>
            </div>
            <PanelFacturacion cart={cartVenta} condicion={ventaCondicion} setCondicion={setVentaCondicion} metodoPago={ventaMetodoPago} setMetodoPago={setVentaMetodoPago} onFinalizar={handleFinalizarVenta} label="Finalizar Compra" />
          </div>
        )}

        {/* MOVIMIENTOS */}
        {seccion === 'movimientos' && (
          <div>
            <div className="card-aura" style={{ padding: '25px', marginBottom: '20px' }}>
              <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', marginBottom: '20px' }}>Filtros</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div><label style={labelStyle}>No. Factura</label><input type="text" placeholder="FAC-001" style={inputStyle} /></div>
                <div><label style={labelStyle}>Empleado</label><select style={inputStyle}><option>Todos</option>{ESPECIALISTAS.map(e => <option key={e}>{e}</option>)}</select></div>
                <div><label style={labelStyle}>Cliente</label><input type="text" placeholder="Nombre" style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha Desde</label><input type="date" value={movFechaDesde} onChange={(e) => setMovFechaDesde(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha Hasta</label><input type="date" value={movFechaHasta} onChange={(e) => setMovFechaHasta(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Método de Pago</label><select style={inputStyle}><option>Todos</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></div>
                <div><label style={labelStyle}>Condición de Pago</label><select style={inputStyle}><option>Todos</option><option>Contado</option><option>Crédito</option></select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setMovFiltrados(MOVIMIENTOS_DATA)} className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Filtrar</button>
                <button onClick={() => setMovFiltrados(MOVIMIENTOS_DATA)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Limpiar</button>
              </div>
            </div>
            <div className="card-aura" style={{ padding: '25px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#EDE8F5' }}>
                   {['ID','Concepto','Fecha y Hora','Tipo','Condición','Usuario','Monto','Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--aura-navy)', borderBottom: '2px solid #e8e0f5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movFiltrados.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={{ padding: '10px 14px' }}>{m.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '500' }}>{m.concepto}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--aura-gray)' }}>{m.fechaHora}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ color: m.tipo === 'Ingreso' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>{m.tipo}</span></td>
                      <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: m.condicionPago === 'Crédito' ? '#fffbeb' : '#f0fdf4', color: m.condicionPago === 'Crédito' ? '#f59e0b' : '#22c55e', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                        {m.condicionPago}
                      </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--aura-gray)' }}>{m.usuario}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--aura-navy)' }}>RD$ {fmt(m.monto)}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: m.estado === 'Sincronizado' ? '#f0fdf4' : '#fffbeb', color: m.estado === 'Sincronizado' ? '#22c55e' : '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{m.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '25px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0edf5', fontSize: '0.88rem' }}>
                <span>Total Ingresos: <strong style={{ color: '#22c55e' }}>RD$ {fmt(movFiltrados.filter(m => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.monto, 0))}</strong></span>
                <span>Saldo Neto: <strong style={{ color: 'var(--aura-navy)' }}>RD$ {fmt(movFiltrados.filter(m => m.tipo === 'Ingreso').reduce((acc, m) => acc + m.monto, 0))}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* COTIZACIONES */}
        {seccion === 'cotizaciones' && (
          <div>
            {cotSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '15px', padding: '12px 20px', marginBottom: '20px' }}>
                <CheckCircle size={18} color="#22c55e" />
                <span style={{ color: '#16a34a', fontSize: '0.88rem' }}>Cotización <strong>{cotNumero}</strong> generada.</span>
                <button className="btn-AuraSpa" style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Send size={13} /> Correo</button>
                <button style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Send size={13} /> WhatsApp</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '25px', alignItems: 'start' }}>
              <div>
                <div className="card-aura" style={{ padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0, fontSize: '0.95rem' }}>Información</h4>
                    <span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>No. {cotNumero}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div><label style={labelStyle}>Cliente</label>
                      <select value={cotCliente} onChange={(e) => setCotCliente(e.target.value)} style={inputStyle}>{CLIENTES.map(c => <option key={c}>{c}</option>)}</select>
                    </div>
                    <div><label style={labelStyle}>Especialista</label>
                      <select value={cotEspecialista} onChange={(e) => setCotEspecialista(e.target.value)} style={inputStyle}><option value="">Selecciona...</option>{ESPECIALISTAS.map(e => <option key={e}>{e}</option>)}</select>
                    </div>
                    <div><label style={labelStyle}>Sucursal</label>
                      <input type="text" value="Sucursal #101" disabled style={{ ...inputStyle, background: '#f0f0f0' }} />
                    </div>
                  </div>
                </div>
                <div className="card-aura" style={{ padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', marginBottom: '16px', fontSize: '0.95rem' }}>Añadir Servicio</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '12px', alignItems: 'end' }}>
                    <div><label style={labelStyle}>Servicio</label>
                      <select value={cotServicio} onChange={(e) => setCotServicio(e.target.value)} style={inputStyle}>
                        <option value="">Selecciona...</option>
                        {SERVICIOS.filter(s => s.categoria !== 'Producto').map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Cant.</label>
                      <input type="text" value={cotCantidad} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setCotCantidad(e.target.value); }} style={inputStyle} />
                    </div>
                    <div><button onClick={() => agregarItem(cartCot, setCartCot, cotServicio, cotCantidad)} className="btn-AuraSpa" style={{ padding: '10px 18px' }}>+ Añadir</button></div>
                  </div>
                </div>
                <div className="card-aura" style={{ padding: '20px' }}>
                  <TablaCarrito cart={cartCot} onRemove={(id) => setCartCot(cartCot.filter(i => i.id !== id))} />
                  <div style={{ marginTop: '15px' }}>
                    <button onClick={() => setCartCot([])} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Limpiar</button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <PanelFacturacion cart={cartCot} onFinalizar={handleGenerarCotizacion} label="Generar Cotización" showPago={false} condicion="" setCondicion={() => {}} metodoPago="" setMetodoPago={() => {}} />
                  <button
                  onClick={() => {
                  if (cartCot.length === 0) return;
                  setCartVenta(cartCot);
                  setCartCot([]);
                  setSeccion('ventas');
                    }}
                    className="btn-outline-aura"
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    disabled={cartCot.length === 0}
                    >
                   <ShoppingCart size={16} /> Generar Orden
                    </button>
              </div>
            </div>
          </div>
        )}

        {/* CXC */}
        {seccion === 'cxc' && (
          <div>
            <div className="card-aura" style={{ padding: '25px', marginBottom: '20px' }}>
              <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', marginBottom: '20px' }}>Filtros</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div><label style={labelStyle}>Cliente</label><input type="text" style={inputStyle} /></div>
                <div><label style={labelStyle}>Sucursal</label><select style={inputStyle}><option>Todas</option><option>Sucursal #101</option></select></div>
                <div><label style={labelStyle}>No. Factura</label><input type="text" style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha de Venta</label><input type="date" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Aplicar Filtro</button>
                <button className="btn-outline-aura" style={{ padding: '10px 25px' }}>Limpiar</button>
              </div>
            </div>
            <div className="card-aura" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button className="btn-outline-aura" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Ver Historial de Pagos</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#EDE8F5' }}>
                    {['Id','Factura','Cliente','Monto Total','Pagado','Saldo Pendiente','Vencimiento','Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--aura-navy)', borderBottom: '2px solid #e8e0f5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CXC_DATA.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={{ padding: '10px 14px' }}>{c.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '500' }}>{c.ventaId}</td>
                      <td style={{ padding: '10px 14px' }}>{c.clienteNombre}</td>
                      <td style={{ padding: '10px 14px' }}>RD$ {fmt(c.montoTotal)}</td>
                      <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: '600' }}>RD$ {fmt(c.montoPagado)}</td>
                      <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: '600' }}>RD$ {fmt(c.saldoPendiente)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--aura-gray)' }}>{c.fechaVencimiento}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: c.estado === 'Parcial' ? '#fffbeb' : '#fef2f2', color: c.estado === 'Parcial' ? '#f59e0b' : '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{c.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0edf5' }}>
                <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Registrar Abono</button>
                <div style={{ display: 'flex', gap: '25px', fontSize: '0.88rem' }}>
                  <span>Deudores: <strong>{CXC_DATA.length}</strong></span>
                  <span>Total Deudas: <strong style={{ color: '#ef4444' }}>RD$ {fmt(CXC_DATA.reduce((acc, c) => acc + c.saldoPendiente, 0))}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CIERRE */}
        {seccion === 'cierre' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            {cierreSuccess ? (
              <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '50px', textAlign: 'center' }}>
                <CheckCircle size={52} color="#22c55e" style={{ marginBottom: '20px' }} />
                <h3 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--aura-navy)' }}>Caja cerrada correctamente</h3>
                <p style={{ color: 'var(--aura-gray)', fontSize: '0.88rem' }}>Redirigiendo al panel de control...</p>
              </div>
            ) : (
              <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '45px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                  <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
                    <LogOut size={24} />
                  </div>
                  <h3 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Cierre de Turno y Cuadre</h3>
                </div>
                <div style={{ background: '#f8f6ff', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--aura-navy)', fontSize: '0.9rem' }}>Resumen del Turno</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--aura-gray)' }}>Fondo inicial:</span>
                    <strong>RD$ {fmt(fondoCaja)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--aura-gray)' }}>Total ventas del turno:</span>
                    <strong style={{ color: '#22c55e' }}>RD$ {fmt(totalVentas)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderTop: '1px solid #e8e0f5', paddingTop: '8px' }}>
                    <span style={{ color: 'var(--aura-gray)' }}>El sistema reporta:</span>
                    <strong style={{ color: 'var(--aura-navy)' }}>RD$ {fmt(fondoCaja + totalVentas)}</strong>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Efectivo contado en gaveta (RD$)</label>
                  <input type="text" value={montoCierre} onChange={(e) => validarNumero(e.target.value, setMontoCierre, setMontoCierreError)} placeholder="0.00" style={{ ...inputStyle, border: montoCierreError ? '1px solid #ef4444' : '1px solid #e8e0f5' }} />
                  {montoCierreError && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{montoCierreError}</p>}
                </div>
                {montoCierre && !isNaN(Number(montoCierre)) && (
                  <div style={{ background: diferencia >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diferencia >= 0 ? '#86efac' : '#fecaca'}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.88rem' }}>
                    Diferencia: <strong style={{ color: diferencia >= 0 ? '#22c55e' : '#ef4444' }}>RD$ {fmt(Math.abs(diferencia))} {diferencia >= 0 ? '(Sobrante)' : '(Faltante)'}</strong>
                  </div>
                )}
                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Observación</label>
                  <input type="text" placeholder="Ej: Cierre de turno sin novedades" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCerrarCaja} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>Cerrar Caja</button>
                  <button onClick={() => setSeccion('ventas')} className="btn-outline-aura" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Caja;
