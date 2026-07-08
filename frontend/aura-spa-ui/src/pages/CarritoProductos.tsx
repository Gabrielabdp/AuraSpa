import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import apiClient from '../services/apiClient';
import jsPDF from 'jspdf';

interface ProductoItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string;
}

const SUCURSALES = ['AuraSpa Piantini', 'AuraSpa Bella Vista', 'AuraSpa Principal'];

const CarritoProductos: React.FC = () => {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState<ProductoItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_carrito') || '[]'); } catch { return []; }
  });
  const [sucursal,   setSucursal]   = useState(SUCURSALES[0]);
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
      // En producción: POST /api/reservas con los productos y la sucursal
      await new Promise(r => setTimeout(r, 1200)); // simulación
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
    const pw = doc.internal.pageSize.getWidth();
    const m  = 20;

    // Header navy
    doc.setFillColor(31, 45, 61);
    doc.rect(0, 0, pw, 45, 'F');
    doc.setFontSize(22); doc.setFont('helvetica','bold');
    doc.setTextColor(255,255,255); doc.text('AURA', m, 25);
    const aw = doc.getTextWidth('AURA');
    doc.setTextColor(151,138,221); doc.text(' Spa', m+aw, 25);
    doc.setFontSize(9); doc.setTextColor(200,200,200);
    doc.text('Comprobante de Reserva de Productos', m, 36);

    // Número de reserva
    const ref = `RES-${String(Date.now()).slice(-6)}`;
    doc.setFontSize(10); doc.setTextColor(150,138,221);
    doc.text(ref, pw-m, 25, {align:'right'});

    let y = 65;
    doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.setTextColor(31,45,61);
    doc.text('Comprobante de Reserva', m, y); y += 10;

    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.setTextColor(100,100,100);
    doc.text(`Fecha: ${new Date().toLocaleString('es-DO')}`, m, y); y += 6;
    doc.text(`Sucursal: ${sucursal}`, m, y); y += 6;
    doc.text('Estado: Reservado — Pendiente de pago en sucursal', m, y); y += 15;

    // Tabla de productos
    doc.setFillColor(237,232,245);
    doc.rect(m, y-5, pw-2*m, 10, 'F');
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(31,45,61);
    doc.text('Producto', m+2, y+2);
    doc.text('Cant.', pw-70, y+2, {align:'right'});
    doc.text('Precio Unit.', pw-45, y+2, {align:'right'});
    doc.text('Subtotal', pw-m, y+2, {align:'right'});
    y += 12;

    doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80);
    const itemsParaPDF = snapshotRef.current.length > 0 ? snapshotRef.current : carritoSnapshot;
    itemsParaPDF.forEach(item => {
      doc.text(item.nombre.slice(0,35), m+2, y);
      doc.text(String(item.cantidad), pw-70, y, {align:'right'});
      doc.text(`RD$ ${item.precio.toLocaleString('es-DO',{minimumFractionDigits:2})}`, pw-45, y, {align:'right'});
      doc.text(`RD$ ${(item.precio*item.cantidad).toLocaleString('es-DO',{minimumFractionDigits:2})}`, pw-m, y, {align:'right'});
      y += 7;
    });

    y += 5;
    doc.setDrawColor(220,216,240); doc.line(m, y, pw-m, y); y += 8;
    doc.setFont('helvetica','bold'); doc.setTextColor(31,45,61);
    const tTotal = totalRef.current > 0 ? totalRef.current : totalSnapshot;
    const tItbis = itbisRef.current > 0 ? itbisRef.current : itbisSnapshot;
    doc.text(`Total (inc. ITBIS 18%): RD$ ${(tTotal+tItbis).toLocaleString('es-DO',{minimumFractionDigits:2})}`, pw-m, y, {align:'right'});

    y += 15;
    doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(150,150,150);
    doc.text('Tiene 48 horas para recoger y pagar en la sucursal seleccionada.', m, y);
    doc.text('AuraSpa — contacto@auraspa.com  |  809-000-0000', m, y+7);

    doc.save(`Reserva-${ref}.pdf`);
  };

  if (reservado) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh', background:'var(--aura-beige)' }}>
      <div className="card-aura animate-fade-in" style={{ maxWidth:'500px', width:'90%', padding:'50px', borderRadius:'28px', textAlign:'center' }}>
        <CheckCircle size={60} color="#22c55e" style={{ marginBottom:'20px' }}/>
        <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'12px' }}>Reserva realizada</h2>
        <p style={{ color:'#666', marginBottom:'8px' }}>
          Tus productos están reservados en <strong>{sucursal}</strong>.
        </p>
        <p style={{ color:'#888', marginBottom:'8px' }}>
          Tus productos están reservados en <strong>{sucursal}</strong>.
        </p>
        <p style={{ color:'#888', fontSize:'0.88rem', marginBottom:'20px' }}>
          Tienes 48 horas para pasar a recogerlos y completar el pago.
        </p>
        <button onClick={generarComprobantePDF} className="btn-AuraSpa"
          style={{ width:'100%', padding:'12px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          Descargar comprobante PDF
        </button>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn-AuraSpa" onClick={() => navigate('/catalog?tipo=Producto')} style={{ padding:'12px 24px' }}>
            Seguir comprando
          </button>
          <button className="btn-outline-aura" onClick={() => navigate('/dashboard/client')} style={{ padding:'12px 24px' }}>
            Mi cuenta
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--aura-beige)', padding:'40px 6%' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>
        
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'30px' }}>
          <button onClick={() => navigate('/catalog?tipo=Producto')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--aura-gray)', display:'flex', alignItems:'center', gap:'6px' }}>
            <ArrowLeft size={18}/> Seguir comprando
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
                <div key={item.id} className="card-aura" style={{ marginBottom:'14px', padding:'18px', display:'flex', alignItems:'center', gap:'16px' }}>
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
              <div className="card-aura" style={{ padding:'18px' }}>
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
              <div className="card-aura" style={{ padding:'22px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <MapPin size={18} color="var(--aura-lavender)"/>
                  <span style={{ fontWeight:'700', color:'var(--aura-navy)', fontSize:'0.92rem' }}>Sucursal de retiro</span>
                </div>
                {SUCURSALES.map(s => (
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
              <div className="card-aura" style={{ padding:'22px' }}>
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
