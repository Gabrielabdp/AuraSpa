import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus, MapPin, CheckCircle, ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import jsPDF from 'jspdf';

interface ProductoItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string;
}

const CarritoProductos: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [carrito, setCarrito] = useState<ProductoItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_carrito') || '[]'); } catch { return []; }
  });
  const [sucursales, setSucursales] = useState<string[]>([]);
  const [sucursal,   setSucursal]   = useState('');

  useEffect(() => {
    apiClient.get('/api/catalog/sucursales').then(res => {
      const nombres = res.data.map((s: any) => s.nombre);
      setSucursales(nombres);
      if (nombres.length > 0) setSucursal(nombres[0]);
    }).catch(() => {});
  }, []);
  const [reservado,  setReservado]  = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [notas,      setNotas]      = useState('');
  const [carritoSnapshot, setCarritoSnapshot] = useState<ProductoItem[]>([]);
  const [totalSnapshot,   setTotalSnapshot]   = useState(0);
  const [itbisSnapshot,   setItbisSnapshot]   = useState(0);
  // Ref para acceso sincrónico en el PDF (los useState son asíncronos)
  const snapshotRef = useRef<ProductoItem[]>([]);
  const totalRef    = useRef(0);
  const itbisRef    = useRef(0);

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('aura_carrito', JSON.stringify(carrito));
  }, [carrito]);

  const actualizar = (id:number, delta:number) => {
    setCarrito(prev => prev.map(p => p.id===id
      ? { ...p, cantidad: Math.max(1, p.cantidad + delta) }
      : p
    ));
  };

  const quitar = (id:number) => setCarrito(prev => prev.filter(p => p.id !== id));

  const total    = carrito.reduce((a,p) => a + p.precio * p.cantidad, 0);
  const itbis    = carrito.reduce((a,p) => a + p.precio * p.cantidad * 0.18, 0);

  const reservar = async () => {
    if (carrito.length === 0) return;
    setProcesando(true);
    try {
      // Nota: aún no existe un backend de órdenes/reservas de productos;
      // esta llamada solo registra los puntos de lealtad por el monto reservado.
      await apiClient.post('/api/lealtad/reservar-productos', { montoTotal: total + itbis });
      // Guardar snapshot para el PDF antes de limpiar
      const snapData  = [...carrito];
      const snapTotal = carrito.reduce((a,p)=>a+p.precio*p.cantidad,0);
      const snapItbis = carrito.reduce((a,p)=>a+p.precio*p.cantidad*0.18,0);
      // Guardar en ref (sincrónico) Y en estado (para re-render)
      snapshotRef.current = snapData;
      totalRef.current    = snapTotal;
      itbisRef.current    = snapItbis;
      setCarritoSnapshot(snapData);
      setTotalSnapshot(snapTotal);
      setItbisSnapshot(carrito.reduce((a,p)=>a+p.precio*p.cantidad*0.18,0));
      setReservado(true);
      localStorage.removeItem('aura_carrito');
      setCarrito([]);
    } catch {
      alert('Error al procesar la reserva. Intenta de nuevo.');
    } finally { setProcesando(false); }
  };

  const generarComprobantePDF = () => {
    const doc = new jsPDF();
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const referencia = `RES-${String(Date.now()).slice(-6)}`;
    const fechaHoy = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });

    // ── HEADER NAVY ──────────────────────────────────
    doc.setFillColor(31, 45, 61);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); doc.text('AURA', margin, 22);
    const auraWidth = doc.getTextWidth('AURA');
    doc.setTextColor(151, 138, 221); doc.text(' Spa', margin + auraWidth, 22);

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Comprobante de Reserva de Productos', margin, 32);
    doc.text('AuraSpa Piantini — Sucursal Principal', margin, 39);

    doc.setFontSize(8); doc.setTextColor(180, 180, 200);
    doc.text('No. Referencia', pageWidth - margin, 22, { align: 'right' });
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(151, 138, 221);
    doc.text(referencia, pageWidth - margin, 30, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(`Emitido: ${fechaHoy}`, pageWidth - margin, 38, { align: 'right' });

    doc.setDrawColor(151, 138, 221); doc.setLineWidth(0.8);
    doc.line(margin, 50, pageWidth - margin, 50);

    let y = 62;

    // ── SECCIÓN: INFORMACIÓN DEL CLIENTE ────────────
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Información del Cliente', margin, y);
    doc.setDrawColor(220, 215, 235); doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);

    y += 12;
    const nombreCompleto = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Cliente AuraSpa';
    const clienteData: [string, string][] = [
      ['Nombre:', nombreCompleto],
      ['Correo:', user?.email ?? '—'],
      ['Telefono:', user?.telefono ?? '—'],
    ];
    clienteData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.setTextColor(100, 100, 100); doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 35, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(220, 215, 235); doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // ── SECCIÓN: DETALLES DE LA RESERVA ─────────────
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Detalles de la Reserva', margin, y);
    doc.setDrawColor(220, 215, 235); doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);

    y += 12;
    const reservaData: [string, string][] = [
      ['Sucursal de retiro:', sucursal],
      ['Fecha de reserva:', fechaHoy],
      ['Estado:', 'Reservado — Pendiente de pago en sucursal'],
    ];
    reservaData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.setTextColor(100, 100, 100); doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 40, y);
      y += 9;
    });

    y += 8;

    // Tabla de productos
    doc.setFillColor(237, 232, 245);
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 45, 61);
    doc.text('Producto', margin + 2, y + 2);
    doc.text('Cant.', pageWidth - 70, y + 2, { align: 'right' });
    doc.text('Precio Unit.', pageWidth - 45, y + 2, { align: 'right' });
    doc.text('Subtotal', pageWidth - margin, y + 2, { align: 'right' });
    y += 12;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    const itemsParaPDF = snapshotRef.current.length > 0 ? snapshotRef.current : carritoSnapshot;
    itemsParaPDF.forEach(item => {
      doc.text(item.nombre.slice(0, 35), margin + 2, y);
      doc.text(String(item.cantidad), pageWidth - 70, y, { align: 'right' });
      doc.text(`RD$ ${item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, pageWidth - 45, y, { align: 'right' });
      doc.text(`RD$ ${(item.precio * item.cantidad).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
      y += 7;
    });

    y += 5;
    doc.setDrawColor(220, 216, 240); doc.line(margin, y, pageWidth - margin, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 45, 61);
    const tTotal = totalRef.current > 0 ? totalRef.current : totalSnapshot;
    const tItbis = itbisRef.current > 0 ? itbisRef.current : itbisSnapshot;
    doc.text(`Total (inc. ITBIS 18%): RD$ ${(tTotal + tItbis).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });

    y += 18;

    // ── LÍNEA FINAL ──────────────────────────────────
    doc.setDrawColor(151, 138, 221); doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(`${referencia} — Comprobante generado el ${fechaHoy}`, pageWidth / 2, y, { align: 'center' });
    doc.text('Tiene 48 horas para recoger y pagar en la sucursal seleccionada.', pageWidth / 2, y + 7, { align: 'center' });

    // ── FOOTER ───────────────────────────────────────
    doc.setFillColor(31, 45, 61);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text('www.auraspa.com  |  contacto@auraspa.com  |  809-000-0000', pageWidth / 2, pageHeight - 4, { align: 'center' });

    doc.save(`comprobante-reserva-${referencia}.pdf`);
  };

  if (reservado) {
    const itemsConfirmados = carritoSnapshot.length > 0 ? carritoSnapshot : snapshotRef.current;
    const totalConfirmado = (totalSnapshot > 0 ? totalSnapshot : totalRef.current) + (itbisSnapshot > 0 ? itbisSnapshot : itbisRef.current);

    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'var(--aura-beige)', padding:'40px 20px' }}>
        <div className="card-aura animate-fade-in" style={{ width:'100%', maxWidth:'520px', padding:'50px', borderRadius:'30px', textAlign:'center' }}>

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'20px' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #86efac' }}>
              <CheckCircle size={44} color="#22c55e" />
            </div>
          </div>

          <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'8px', fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            ¡Reserva confirmada!
          </h2>
          <p style={{ color:'var(--aura-gray)', fontSize:'0.95rem', marginBottom:'35px' }}>
            Tus productos han sido reservados. Pasa por la sucursal para completar tu compra.
          </p>

          <div style={{ background:'#f8f6ff', borderRadius:'20px', padding:'25px', marginBottom:'25px', textAlign:'left' }}>
            <p style={{ color:'var(--aura-lavender)', fontWeight:'600', marginBottom:'16px', fontSize:'0.9rem' }}>
              🛍️ Resumen de tu reserva
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {itemsConfirmados.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <ShoppingBag size={16} color="var(--aura-lavender)" />
                  <div style={{ flexGrow:1 }}>
                    <span style={{ fontSize:'0.8rem', color:'var(--aura-gray)' }}>
                      {item.cantidad} × RD$ {item.precio.toLocaleString('es-DO', { minimumFractionDigits:2 })}
                    </span>
                    <p style={{ fontSize:'0.9rem', fontWeight:'600', color:'var(--aura-navy)', margin:0 }}>{item.nombre}</p>
                  </div>
                  <span style={{ fontSize:'0.88rem', fontWeight:'700', color:'var(--aura-navy)' }}>
                    RD$ {(item.precio * item.cantidad).toLocaleString('es-DO', { minimumFractionDigits:2 })}
                  </span>
                </div>
              ))}
            </div>
            <hr style={{ border:'none', borderTop:'1px solid #e4defa', margin:'16px 0' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', color:'var(--aura-navy)', fontSize:'0.95rem' }}>
              <span>Total</span>
              <span>RD$ {totalConfirmado.toLocaleString('es-DO', { minimumFractionDigits:2 })}</span>
            </div>
          </div>

          <button onClick={generarComprobantePDF}
            style={{ width:'100%', padding:'15px', fontSize:'1rem', borderRadius:'50px', border:'2px solid #6B5B93', background:'#f0ecff', color:'#6B5B93', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'12px' }}>
            <Download size={18} /> Descargar comprobante
          </button>

          <button className="btn-AuraSpa" onClick={() => navigate('/catalog')} style={{ width:'100%', padding:'15px', fontSize:'1rem', marginBottom:'12px' }}>
            Seguir reservando
          </button>

          <button onClick={() => navigate('/dashboard/client')}
            style={{ width:'100%', padding:'15px', fontSize:'1rem', borderRadius:'50px', border:'2px solid var(--aura-lavender)', background:'transparent', color:'var(--aura-lavender)', fontWeight:'700', cursor:'pointer' }}>
            Ir a mi panel
          </button>

        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--aura-beige)' }}>
      <div style={{ maxWidth:'100%', padding:'40px 8%' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'30px' }}>
          <button onClick={() => navigate('/catalog?tipo=Producto')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--aura-gray)', display:'flex', alignItems:'center', gap:'6px' }}>
            <ArrowLeft size={18}/> Seguir reservando
          </button>
          <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:0 }}>
            Carrito de Productos
          </h2>
          <span style={{ background:'var(--aura-lavender)', color:'white', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:'bold' }}>
            {carrito.reduce((a,p)=>a+p.cantidad,0)}
          </span>
        </div>

        {carrito.length === 0 ? (
          <div className="card-aura" style={{ textAlign:'center', padding:'60px', borderRadius:'24px' }}>
            <ShoppingCart size={48} color="#ddd" style={{ marginBottom:'16px' }}/>
            <h3 style={{ color:'#ccc', marginBottom:'8px' }}>Tu carrito está vacío</h3>
            <p style={{ color:'#aaa', marginBottom:'24px' }}>Explora nuestro catálogo de productos para agregar items.</p>
            <button className="btn-AuraSpa" onClick={() => navigate('/catalog?tipo=Producto')} style={{ padding:'12px 28px' }}>
              Ver productos
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'25px', alignItems:'start' }}>
            
            {/* Lista de productos */}
            <div>
              {carrito.map(item => (
                <div key={item.id} className="card-aura" style={{ marginBottom:'14px', padding:'18px', borderRadius:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
                  <div style={{ width:'60px', height:'60px', borderRadius:'12px', background:'#f0ecff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {item.imagenUrl
                      ? <img src={item.imagenUrl} alt={item.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'12px' }}/>
                      : <span style={{ fontSize:'1.6rem' }}>🧴</span>}
                  </div>
                  <div style={{ flexGrow:1 }}>
                    <div style={{ fontWeight:'bold', color:'var(--aura-navy)', fontSize:'0.92rem', marginBottom:'4px' }}>{item.nombre}</div>
                    <div style={{ color:'var(--aura-lavender)', fontWeight:'700' }}>RD$ {item.precio.toLocaleString('es-DO', {minimumFractionDigits:2})}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8f6ff', borderRadius:'10px', padding:'6px 12px' }}>
                    <button onClick={()=>actualizar(item.id,-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--aura-navy)' }}><Minus size={14}/></button>
                    <span style={{ fontWeight:'bold', minWidth:'20px', textAlign:'center' }}>{item.cantidad}</span>
                    <button onClick={()=>actualizar(item.id, 1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--aura-navy)' }}><Plus  size={14}/></button>
                  </div>
                  <div style={{ fontWeight:'bold', color:'var(--aura-navy)', minWidth:'90px', textAlign:'right' }}>
                    RD$ {(item.precio*item.cantidad).toLocaleString('es-DO', {minimumFractionDigits:2})}
                  </div>
                  <button onClick={()=>quitar(item.id)} style={{ background:'#fef2f2', border:'none', cursor:'pointer', color:'#ef4444', padding:'6px', borderRadius:'8px' }}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}
              
              {/* Notas */}
              <div className="card-aura" style={{ padding:'18px', borderRadius:'20px' }}>
                <label style={{ display:'block', marginBottom:'8px', fontWeight:'600', color:'var(--aura-navy)', fontSize:'0.88rem' }}>
                  Notas adicionales (opcional)
                </label>
                <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3}
                  placeholder="Ej: Prefiero el esmalte en color nude..."
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'12px', border:'1px solid #ddd', outline:'none', resize:'vertical', fontSize:'0.88rem', boxSizing:'border-box' }}/>
              </div>
            </div>

            {/* Panel resumen */}
            <div>
              {/* Selector de sucursal */}
              <div className="card-aura" style={{ padding:'22px', marginBottom:'16px', borderRadius:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <MapPin size={18} color="var(--aura-lavender)"/>
                  <span style={{ fontWeight:'700', color:'var(--aura-navy)', fontSize:'0.92rem' }}>Sucursal de retiro</span>
                </div>
                {sucursales.map(s => (
                  <label key={s} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', cursor:'pointer' }}>
                    <input type="radio" name="sucursal" checked={sucursal===s} onChange={()=>setSucursal(s)}
                      style={{ accentColor:'var(--aura-lavender)', width:'16px', height:'16px' }}/>
                    <span style={{ fontSize:'0.88rem', color: sucursal===s?'var(--aura-navy)':'#666', fontWeight:sucursal===s?'600':'400' }}>{s}</span>
                  </label>
                ))}
                <p style={{ color:'#aaa', fontSize:'0.75rem', marginTop:'10px', marginBottom:0 }}>
                  Tienes 48 horas para pasar a recoger y pagar en sucursal.
                </p>
              </div>

              {/* Totales */}
              <div className="card-aura" style={{ padding:'22px', borderRadius:'20px' }}>
                <h4 style={{ fontWeight:'bold', marginBottom:'16px', color:'var(--aura-navy)' }}>Resumen</h4>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'0.88rem' }}>
                  <span style={{ color:'#666' }}>Subtotal</span>
                  <span>RD$ {total.toLocaleString('es-DO',{minimumFractionDigits:2})}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px', fontSize:'0.88rem' }}>
                  <span style={{ color:'#666' }}>ITBIS (18%)</span>
                  <span>RD$ {itbis.toLocaleString('es-DO',{minimumFractionDigits:2})}</span>
                </div>
                <hr style={{ borderColor:'#f0edf5', marginBottom:'16px' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px', fontSize:'1.1rem', fontWeight:'bold', color:'var(--aura-navy)' }}>
                  <span>Total</span>
                  <span>RD$ {(total+itbis).toLocaleString('es-DO',{minimumFractionDigits:2})}</span>
                </div>
                <button onClick={reservar} className="btn-AuraSpa" disabled={procesando}
                  style={{ width:'100%', padding:'13px', fontSize:'0.95rem' }}>
                  {procesando ? 'Procesando...' : 'Confirmar reserva'}
                </button>
                <p style={{ color:'#aaa', fontSize:'0.75rem', textAlign:'center', marginTop:'10px' }}>
                  El pago se realiza al recoger en sucursal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoProductos;
