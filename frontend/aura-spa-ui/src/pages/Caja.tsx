import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, BarChart2, FileText, CreditCard, DoorOpen,
  CheckCircle, Trash2, Wifi, WifiOff, Send, LogOut, Clock,
  Search, CreditCard as CardIcon, Banknote, ArrowDownLeft
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────
interface CartItem { id:number; descripcion:string; cantidad:number; precioUnitario:number; itbis:number; subtotal:number; }
type Seccion = 'apertura'|'ventas'|'movimientos'|'cotizaciones'|'cxc'|'cierre';
type Turno = 'Matutino (7AM-1PM)'|'Vespertino (1PM-6PM)'|'Nocturno (6PM-11PM)'|'Personalizado';

// ── DATOS MOCK ────────────────────────────────────────────────
const SERVICIOS = [
  { id:1,  nombre:'Facial Hidratante',      precio:1800, categoria:'Facial' },
  { id:2,  nombre:'Masaje Relajante 60min', precio:2500, categoria:'Masaje' },
  { id:3,  nombre:'Masaje Relajante 90min', precio:3500, categoria:'Masaje' },
  { id:4,  nombre:'Masaje Piedras Volcánicas', precio:4000, categoria:'Masaje' },
  { id:5,  nombre:'Depilación Piernas',     precio:1200, categoria:'Depilación' },
  { id:6,  nombre:'Diseño de Cejas',        precio:600,  categoria:'Cejas' },
  { id:7,  nombre:'Manicura Rusa',          precio:1200, categoria:'Uñas' },
  { id:8,  nombre:'Pedicura Spa',           precio:1500, categoria:'Uñas' },
  { id:9,  nombre:'Corte Femenino',         precio:1500, categoria:'Pelo' },
  { id:10, nombre:'Keratina (por onza)',     precio:350,  categoria:'Pelo' },
  { id:11, nombre:'Esmalte Semipermanente', precio:850,  categoria:'Producto' },
  { id:12, nombre:'Sérum Vitamina C',       precio:1200, categoria:'Producto' },
];
const ESPECIALISTAS = ['Nicole Martínez','Valentina Reyes','Camila Santos'];
const ITBIS_RATE = 0.18;
const MOVIMIENTOS_DATA = [
  { id:1, concepto:'Venta #FAC-001', fechaHora:'05/06/2026 09:30', tipo:'Ingreso', usuario:'Sofía Pérez (Cajera)', monto:2950.00, estado:'Sincronizado', condicionPago:'Contado' },
  { id:2, concepto:'Venta #FAC-002', fechaHora:'05/06/2026 10:15', tipo:'Ingreso', usuario:'Sofía Pérez (Cajera)', monto:1416.00, estado:'Pendiente',    condicionPago:'Crédito' },
];
const CXC_DATA = [
  { id:1, ventaId:'FAC-003', clienteNombre:'Gabriela Duverge', montoTotal:2950.00, montoPagado:0,      saldoPendiente:2950.00, fechaVencimiento:'19/06/2026', estado:'Pendiente', diasMora:0 },
  { id:2, ventaId:'FAC-004', clienteNombre:'Diana Lantigua',   montoTotal:1200.00, montoPagado:600.00, saldoPendiente:600.00,  fechaVencimiento:'15/06/2026', estado:'Parcial',   diasMora:2 },
];
const fmt = (n:number) => n.toLocaleString('es-DO',{minimumFractionDigits:2});
const inputStyle:React.CSSProperties = { width:'100%', padding:'10px 15px', borderRadius:'15px', border:'1px solid #e8e0f5', outline:'none', background:'#fcfcfc', fontSize:'0.88rem', boxSizing:'border-box' };
const labelStyle:React.CSSProperties = { display:'block', marginBottom:'6px', fontSize:'0.82rem', color:'var(--aura-gray)', fontWeight:'500' };

// ── Tabla carrito ─────────────────────────────────────────────
const TablaCarrito:React.FC<{cart:CartItem[];onRemove:(id:number)=>void}> = ({cart,onRemove}) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
      <thead>
        <tr style={{background:'#EDE8F5'}}>
          {['#','Descripción','Cant.','Precio Unit.','ITBIS','Subtotal',''].map(h=>(
            <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:'600',color:'var(--aura-navy)',borderBottom:'2px solid #e8e0f5'}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cart.length===0?(
          <tr><td colSpan={7} style={{padding:'30px',textAlign:'center',color:'#bbb',fontSize:'0.88rem'}}>Sin ítems — selecciona un servicio</td></tr>
        ):cart.map((item,i)=>(
          <tr key={item.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
            <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>{i+1}</td>
            <td style={{padding:'10px 14px',fontWeight:'500',color:'var(--aura-navy)'}}>{item.descripcion}</td>
            <td style={{padding:'10px 14px'}}>{item.cantidad}</td>
            <td style={{padding:'10px 14px'}}>RD$ {fmt(item.precioUnitario)}</td>
            <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>RD$ {fmt(item.itbis)}</td>
            <td style={{padding:'10px 14px',fontWeight:'600',color:'var(--aura-navy)'}}>RD$ {fmt(item.subtotal)}</td>
            <td style={{padding:'10px 14px'}}>
              <button onClick={()=>onRemove(item.id)} style={{background:'#fef2f2',border:'none',cursor:'pointer',color:'#ef4444',padding:'4px 10px',borderRadius:'8px'}}><Trash2 size={14}/></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Búsqueda de cliente con debounce ──────────────────────────
const BuscarCliente:React.FC<{onSelect:(nombre:string)=>void}> = ({onSelect}) => {
  const [q, setQ] = useState('');
  const [resultados] = useState(['Gabriela Duverge','Diana Ferreras','Diana Lantigua','María González','Laura Ramírez','Carmen Torres','Ana Jiménez','Patricia Castro']);
  const filtrados = q.length>1 ? resultados.filter(r=>r.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div style={{position:'relative'}}>
      <div style={{position:'relative'}}>
        <Search size={14} style={{position:'absolute',left:'12px',top:'12px',color:'#999'}}/>
        <input type="text" placeholder="Buscar cliente por nombre..." value={q} onChange={e=>setQ(e.target.value)}
          style={{...inputStyle,paddingLeft:'34px'}}/>
      </div>
      {filtrados.length>0&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'white',border:'1px solid #eee',borderRadius:'12px',zIndex:100,boxShadow:'0 4px 20px rgba(0,0,0,0.1)',maxHeight:'180px',overflowY:'auto'}}>
          {filtrados.map(c=>(
            <div key={c} onClick={()=>{onSelect(c);setQ(c);}} style={{padding:'10px 16px',cursor:'pointer',fontSize:'0.88rem',borderBottom:'1px solid #f5f5f5'}}
              onMouseEnter={e=>(e.currentTarget.style.background='#f0ecff')}
              onMouseLeave={e=>(e.currentTarget.style.background='white')}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Modal pago con tarjeta ─────────────────────────────────────
const ModalTarjeta:React.FC<{total:number;condicion:string;onConfirm:()=>void;onCancel:()=>void}> = ({total,condicion,onConfirm,onCancel}) => {
  const [paso, setPaso] = useState<'procesar'|'exito'>('procesar');
  const [procesando, setProcesando] = useState(false);
  const [abono, setAbono] = useState('');

  const simularPago = () => {
    setProcesando(true);
    setTimeout(()=>{ setProcesando(false); setPaso('exito'); },2000);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div className="card-aura animate-fade-in" style={{width:'420px',padding:'40px',borderRadius:'24px',textAlign:'center'}}>
        {paso==='procesar'?(
          <>
            <div style={{background:'#f0ecff',color:'var(--aura-lavender)',width:'64px',height:'64px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <CardIcon size={28}/>
            </div>
            <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',marginBottom:'8px'}}>Procesando tarjeta</h3>
            {condicion==='Credito'&&(
              <div style={{marginBottom:'16px',textAlign:'left'}}>
                <label style={labelStyle}>Abono inicial (RD$) <span style={{color:'#888',fontWeight:'normal'}}>(opcional)</span></label>
                <input type="text" value={abono} onChange={e=>{ if(/^\d*\.?\d*$/.test(e.target.value)) setAbono(e.target.value); }}
                  placeholder="0.00" style={inputStyle}/>
                <p style={{color:'#888',fontSize:'0.78rem',marginTop:'4px'}}>
                  Saldo a crédito: RD$ {fmt(total - (parseFloat(abono)||0))}
                </p>
              </div>
            )}
            <div style={{background:'#f8f6ff',borderRadius:'14px',padding:'16px',marginBottom:'20px'}}>
              <div style={{fontSize:'0.82rem',color:'#888',marginBottom:'4px'}}>Total {condicion==='Credito'?'de la venta':'a cobrar'}</div>
              <div style={{fontSize:'1.8rem',fontWeight:'bold',color:'var(--aura-navy)'}}>RD$ {fmt(total)}</div>
            </div>
            {procesando?(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'16px',background:'#f0ecff',borderRadius:'14px'}}>
                <div style={{width:'20px',height:'20px',border:'3px solid var(--aura-lavender)',borderTop:'3px solid transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                <span style={{color:'var(--aura-lavender)',fontWeight:'600'}}>Pasando tarjeta...</span>
              </div>
            ):(
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={simularPago} className="btn-AuraSpa" style={{flex:1,padding:'13px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                  <CardIcon size={16}/> Pasar tarjeta
                </button>
                <button onClick={onCancel} className="btn-outline-aura" style={{flex:1,padding:'13px'}}>Cancelar</button>
              </div>
            )}
          </>
        ):(
          <>
            <CheckCircle size={52} color="#22c55e" style={{marginBottom:'16px'}}/>
            <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',marginBottom:'8px'}}>¡Pago aprobado!</h3>
            {condicion==='Credito'&&abono&&(
              <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'12px',padding:'14px',marginBottom:'16px',fontSize:'0.88rem'}}>
                <div>Abono recibido: <strong>RD$ {fmt(parseFloat(abono)||0)}</strong></div>
                <div>Saldo pendiente: <strong style={{color:'#f59e0b'}}>RD$ {fmt(total-(parseFloat(abono)||0))}</strong></div>
              </div>
            )}
            <p style={{color:'#888',fontSize:'0.88rem',marginBottom:'20px'}}>La transacción fue procesada correctamente.</p>
            <button onClick={onConfirm} className="btn-AuraSpa" style={{width:'100%',padding:'13px'}}>Finalizar</button>
          </>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
const Caja:React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const esAdmin = user?.perfil==='Admin';

  const [seccion,  setSeccion]  = useState<Seccion>('apertura');
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [fondoCaja,   setFondoCaja]   = useState(0);
  const [pendientesSync] = useState(1);

  // Apertura
  const [montoApertura, setMontoApertura] = useState('');
  const [turno, setTurno] = useState<Turno>('Matutino (7AM-1PM)');
  const [montoError, setMontoError] = useState('');

  // Ventas
  const [cartVenta,      setCartVenta]      = useState<CartItem[]>([]);
  const [ventaCliente,   setVentaCliente]   = useState('Cliente Final');
  const [ventaEspecialista, setVentaEspecialista] = useState('');
  const [ventaCategoria, setVentaCategoria] = useState('');
  const [ventaServicio,  setVentaServicio]  = useState('');
  const [ventaCantidad,  setVentaCantidad]  = useState('1');
  const [ventaCondicion, setVentaCondicion] = useState('Contado');
  const [ventaMetodo,    setVentaMetodo]    = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [ventaSuccess,   setVentaSuccess]   = useState(false);
  const [espError,       setEspError]       = useState('');
  const [modalTarjeta,   setModalTarjeta]   = useState(false);

  // Cotizaciones — sin cliente ni especialista, solo ítems y precios
  const [cartCot,   setCartCot]   = useState<CartItem[]>([]);
  const [cotServicio, setCotServicio] = useState('');
  const [cotCantidad, setCotCantidad] = useState('1');
  const [cotSuccess,  setCotSuccess]  = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const cotContador = React.useRef(1001);
  const [cotNumero, setCotNumero] = useState(`COT-${String(cotContador.current).padStart(4,'0')}`);

  // Movimientos
  const [movFechaDesde, setMovFechaDesde] = useState('');
  const [movFechaHasta, setMovFechaHasta] = useState('');
  const [movFiltrados,  setMovFiltrados]  = useState(MOVIMIENTOS_DATA);
  const [movFechaError, setMovFechaError] = useState('');

  // CxC
  const [cxcClienteFiltro, setCxcClienteFiltro] = useState('');
  const [cxcFacturaFiltro, setCxcFacturaFiltro] = useState('');
  const [cxcEstadoFiltro, setCxcEstadoFiltro] = useState('Todos');
  const [abonoModal, setAbonoModal] = useState<{id:number;nombre:string;saldo:number}|null>(null);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [cxcData,    setCxcData]    = useState(CXC_DATA);

  // Cierre
  const [montoCierre,      setMontoCierre]      = useState('');
  const [montoCierreError, setMontoCierreError] = useState('');
  const [cierreSuccess,    setCierreSuccess]    = useState(false);

  const validarNumero = (val:string, setter:(v:string)=>void, errSetter:(v:string)=>void) => {
    if(val!==''&&!/^\d*\.?\d*$/.test(val)){ errSetter('Solo valores numéricos.'); return; }
    errSetter(''); setter(val);
  };

  const agregarItem = (cart:CartItem[], setCart:React.Dispatch<React.SetStateAction<CartItem[]>>, svcId:string, cantStr:string) => {
    const svc = SERVICIOS.find(s=>s.id===Number(svcId));
    if(!svc) return;
    const cantidad = parseInt(cantStr)||1;
    const sub = svc.precio*cantidad;
    const itbis = sub*ITBIS_RATE;
    const ex = cart.find(i=>i.id===svc.id);
    if(ex){
      setCart(cart.map(i=>i.id===svc.id?{...i,cantidad:i.cantidad+cantidad,itbis:(i.cantidad+cantidad)*svc.precio*ITBIS_RATE,subtotal:(i.cantidad+cantidad)*svc.precio*(1+ITBIS_RATE)}:i));
    } else {
      setCart([...cart,{id:svc.id,descripcion:svc.nombre,cantidad,precioUnitario:svc.precio,itbis,subtotal:sub+itbis}]);
    }
  };

  const handleAbrirCaja = () => {
    if(!montoApertura||isNaN(Number(montoApertura))||Number(montoApertura)<0){ setMontoError('Ingresa un monto válido (puede ser 0).'); return; }
    setFondoCaja(Number(montoApertura));
    setCajaAbierta(true);
    setSeccion('ventas');
  };

  const subVenta = cartVenta.reduce((a,i)=>a+i.precioUnitario*i.cantidad,0);
  const itbVenta = cartVenta.reduce((a,i)=>a+i.itbis,0);
  const totVenta = cartVenta.reduce((a,i)=>a+i.subtotal,0);
  const cambioEfectivo = Number(efectivoRecibido)-totVenta;
  const efectivoInsuficiente = efectivoRecibido!==''&&Number(efectivoRecibido)<totVenta;

  const handleFinalizarVenta = () => {
    if(!ventaEspecialista){ setEspError('Selecciona un especialista.'); return; }
    if(cartVenta.length===0) return;
    setEspError('');
    if(ventaMetodo==='Tarjeta'){ setModalTarjeta(true); return; }
    // Efectivo
    setVentaSuccess(true);
    setCartVenta([]); setEfectivoRecibido('');
    setTimeout(()=>setVentaSuccess(false),3000);
  };

  const confirmarPagoTarjeta = () => {
    setModalTarjeta(false);
    setVentaSuccess(true);
    setCartVenta([]); setEfectivoRecibido('');
    setTimeout(()=>setVentaSuccess(false),3000);
  };

  const calcularMora = (cxc: typeof CXC_DATA[0]) => {
    const hoy = new Date();
    const venc = new Date(cxc.fechaVencimiento.split('/').reverse().join('-'));
    const dias = Math.floor((hoy.getTime()-venc.getTime())/(1000*60*60*24));
    return dias > 0 ? Math.round(cxc.saldoPendiente * 0.03 * dias) : 0; // 3% mensual
  };

  const registrarAbono = () => {
    if(!abonoModal||!abonoMonto) return;
    const monto = parseFloat(abonoMonto);
    if(isNaN(monto)||monto<=0||monto>abonoModal.saldo) return;
    setCxcData(prev=>prev.map(c=>c.id===abonoModal.id?{
      ...c, montoPagado:c.montoPagado+monto, saldoPendiente:c.saldoPendiente-monto,
      estado:c.saldoPendiente-monto<=0?'Saldada':'Parcial'
    }:c));
    setAbonoModal(null); setAbonoMonto('');
  };

  const totalVentasTurno = 4366.00;
  const diferenciaCierre = Number(montoCierre)-(fondoCaja+totalVentasTurno);

  const tabs = [
    {id:'apertura',    label:'Apertura',          icono:<DoorOpen size={16}/>},
    {id:'ventas',      label:'Ventas',             icono:<ShoppingCart size={16}/>},
    {id:'movimientos', label:'Movimientos',        icono:<BarChart2 size={16}/>},
    {id:'cotizaciones',label:'Cotizaciones',       icono:<FileText size={16}/>},
    {id:'cxc',         label:'Cuentas x Cobrar',  icono:<CreditCard size={16}/>},
    {id:'cierre',      label:'Cerrar Caja',        icono:<LogOut size={16}/>},
  ];

  return (
    <div style={{minHeight:'100vh',background:'var(--aura-beige)'}}>
      {modalTarjeta&&<ModalTarjeta total={totVenta} condicion={ventaCondicion} onConfirm={confirmarPagoTarjeta} onCancel={()=>setModalTarjeta(false)}/>}

      {/* Abono modal */}
      {abonoModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="card-aura" style={{width:'380px',padding:'35px',borderRadius:'22px'}}>
            <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',marginBottom:'6px'}}>Registrar Abono</h3>
            <p style={{color:'#888',fontSize:'0.85rem',marginBottom:'20px'}}>{abonoModal.nombre}</p>
            <div style={{background:'#fef2f2',borderRadius:'12px',padding:'14px',marginBottom:'16px',display:'flex',justifyContent:'space-between',fontSize:'0.88rem'}}>
              <span style={{color:'#666'}}>Saldo pendiente:</span>
              <strong style={{color:'#ef4444'}}>RD$ {fmt(abonoModal.saldo)}</strong>
            </div>
            <div style={{marginBottom:'20px'}}>
              <label style={labelStyle}>Monto del abono (RD$)</label>
              <input type="text" value={abonoMonto} onChange={e=>{if(/^\d*\.?\d*$/.test(e.target.value))setAbonoMonto(e.target.value);}}
                placeholder="0.00" style={inputStyle} autoFocus/>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={registrarAbono} className="btn-AuraSpa" style={{flex:1,padding:'12px'}}>Registrar</button>
              <button onClick={()=>{setAbonoModal(null);setAbonoMonto('');}} className="btn-outline-aura" style={{flex:1,padding:'12px'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:'white',borderBottom:'1px solid #f0edf5',padding:'16px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'15px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'15px'}}>
          <h2 style={{color:'var(--aura-navy)',fontWeight:'bold',margin:0,fontSize:'1.2rem'}}>
            AuraSpa <span style={{color:'var(--aura-lavender)'}}>Caja</span>
          </h2>
          <span style={{background:cajaAbierta?'#f0fdf4':'#fef2f2',color:cajaAbierta?'#22c55e':'#ef4444',padding:'4px 12px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:'600'}}>
            {cajaAbierta?'● ABIERTA':'● CERRADA'}
          </span>
          {/* Admin puede abrir caja aunque ya esté abierta */}
          {esAdmin&&!cajaAbierta&&(
            <button onClick={()=>setSeccion('apertura')} style={{background:'#f0ecff',color:'var(--aura-lavender)',border:'none',padding:'5px 14px',borderRadius:'20px',cursor:'pointer',fontSize:'0.78rem',fontWeight:'600'}}>
              Abrir caja
            </button>
          )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'20px',fontSize:'0.82rem'}}>
          <span style={{display:'flex',alignItems:'center',gap:'5px',color:pendientesSync>0?'#ef4444':'#22c55e'}}>
            {pendientesSync>0?<WifiOff size={14}/>:<Wifi size={14}/>}
            {pendientesSync>0?`Desconectado (${pendientesSync} pendientes)`:'Conectado'}
          </span>
          <span style={{display:'flex',alignItems:'center',gap:'4px',color:'var(--aura-gray)'}}>
            <Clock size={14}/>{new Date().toLocaleTimeString('es-DO')}
          </span>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'var(--aura-lavender)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'0.85rem'}}>
              {user?.nombre?.[0]||'U'}
            </div>
            <span style={{fontWeight:'500',color:'var(--aura-navy)',fontSize:'0.88rem'}}>{user?.nombre} ({user?.perfil})</span>
          </div>
          <button onClick={()=>navigate('/dashboard/staff')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--aura-gray)',display:'flex',alignItems:'center',gap:'5px',fontSize:'0.82rem'}}>
            <LogOut size={14}/> Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'white',borderBottom:'1px solid #f0edf5',padding:'0 40px',display:'flex',gap:'4px',overflowX:'auto'}}>
        {tabs.map(tab=>(
          <button key={tab.id}
            onClick={()=>(cajaAbierta||tab.id==='apertura')?setSeccion(tab.id as Seccion):undefined}
            style={{padding:'14px 20px',border:'none',background:'transparent',cursor:(cajaAbierta||tab.id==='apertura')?'pointer':'not-allowed',
              color:seccion===tab.id?'var(--aura-lavender)':(cajaAbierta||tab.id==='apertura')?'var(--aura-gray)':'#ccc',
              fontWeight:seccion===tab.id?'700':'400',fontSize:'0.88rem',whiteSpace:'nowrap',
              borderBottom:seccion===tab.id?'2px solid var(--aura-lavender)':'2px solid transparent',
              display:'flex',alignItems:'center',gap:'6px'}}>
            {tab.icono}{tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:'30px 40px'}}>

        {/* ── APERTURA ── */}
        {seccion==='apertura'&&(
          <div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}>
            <div className="card-aura animate-fade-in" style={{width:'100%',maxWidth:'520px',padding:'45px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                <div style={{background:'#EDE8F5',padding:'12px',borderRadius:'50%',color:'var(--aura-lavender)'}}><DoorOpen size={24}/></div>
                <h3 style={{fontWeight:'700',color:'var(--aura-navy)',margin:0}}>Apertura de Caja</h3>
              </div>
              <p style={{color:'var(--aura-gray)',fontSize:'0.88rem',marginBottom:'28px'}}>
                Bienvenida, <strong>{user?.nombre}</strong>. Registra el fondo inicial para comenzar el turno.
              </p>
              {/* Fondo */}
              <div style={{marginBottom:'18px'}}>
                <label style={labelStyle}>Fondo de Apertura (RD$)</label>
                <input type="text" value={montoApertura} onChange={e=>validarNumero(e.target.value,setMontoApertura,setMontoError)}
                  placeholder="Ej: 5,000.00"
                  style={{...inputStyle,border:montoError?'1px solid #ef4444':'1px solid #e8e0f5'}}/>
                {montoError&&<p style={{color:'#ef4444',fontSize:'0.78rem',marginTop:'4px'}}>{montoError}</p>}
              </div>
              {/* Turno — dropdown no texto libre */}
              <div style={{marginBottom:'18px'}}>
                <label style={labelStyle}>Turno</label>
                <select value={turno} onChange={e=>setTurno(e.target.value as Turno)} style={{...inputStyle,cursor:'pointer'}}>
                  <option>Matutino (7AM-1PM)</option>
                  <option>Vespertino (1PM-6PM)</option>
                  <option>Nocturno (6PM-11PM)</option>
                  <option>Personalizado</option>
                </select>
              </div>
              <button onClick={handleAbrirCaja} className="btn-AuraSpa" style={{width:'100%',padding:'14px'}}>Abrir Caja</button>
            </div>
          </div>
        )}

        {/* ── VENTAS ── */}
        {seccion==='ventas'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'25px',alignItems:'start'}}>
            <div>
              <div className="card-aura" style={{padding:'20px',marginBottom:'20px'}}>
                <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'16px',fontSize:'0.95rem'}}>Información</h4>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'15px',marginBottom:'10px'}}>
                  <div>
                    <label style={labelStyle}>Cliente</label>
                    {/* Búsqueda con texto libre en vez de dropdown */}
                    <BuscarCliente onSelect={setVentaCliente}/>
                    <p style={{fontSize:'0.75rem',color:'#888',marginTop:'3px'}}>Seleccionado: <strong>{ventaCliente}</strong></p>
                  </div>
                  <div>
                    <label style={labelStyle}>Cajero</label>
                    <input type="text" value={user?.nombre||''} disabled style={{...inputStyle,background:'#f0f0f0'}}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Sucursal</label>
                    <input type="text" value="AuraSpa Principal" disabled style={{...inputStyle,background:'#f0f0f0'}}/>
                  </div>
                </div>
                <p style={{fontSize:'0.78rem',color:'var(--aura-gray)',margin:0,textAlign:'right'}}>
                  Fondo en caja: <strong style={{color:'var(--aura-navy)'}}>RD$ {fmt(fondoCaja)}</strong>
                </p>
              </div>

              <div className="card-aura" style={{padding:'20px',marginBottom:'20px'}}>
                <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'16px',fontSize:'0.95rem'}}>Añadir Servicio / Producto</h4>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 80px auto',gap:'12px',alignItems:'end'}}>
                  <div>
                    <label style={labelStyle}>Categoría</label>
                    <select value={ventaCategoria} onChange={e=>setVentaCategoria(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                      <option value="">Todas</option>
                      {['Facial','Masaje','Depilación','Cejas','Uñas','Pelo','Producto'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Especialista</label>
                    <select value={ventaEspecialista} onChange={e=>{setVentaEspecialista(e.target.value);setEspError('');}}
                      style={{...inputStyle,cursor:'pointer',border:espError?'1px solid #ef4444':'1px solid #e8e0f5'}}>
                      <option value="">Selecciona...</option>
                      {ESPECIALISTAS.map(e=><option key={e}>{e}</option>)}
                    </select>
                    {espError&&<p style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'2px'}}>{espError}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Servicio / Producto</label>
                    <select value={ventaServicio} onChange={e=>setVentaServicio(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                      <option value="">Selecciona...</option>
                      {SERVICIOS.filter(s=>!ventaCategoria||s.categoria===ventaCategoria).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Cant.</label>
                    <input type="text" value={ventaCantidad} onChange={e=>{if(/^\d*$/.test(e.target.value))setVentaCantidad(e.target.value);}} style={inputStyle}/>
                  </div>
                  <div>
                    <button onClick={()=>agregarItem(cartVenta,setCartVenta,ventaServicio,ventaCantidad)} className="btn-AuraSpa" style={{padding:'10px 18px',whiteSpace:'nowrap'}}>+ Añadir</button>
                  </div>
                </div>
              </div>

              <div className="card-aura" style={{padding:'20px'}}>
                {ventaSuccess&&(
                  <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'12px',padding:'10px 16px',marginBottom:'15px'}}>
                    <CheckCircle size={16} color="#22c55e"/>
                    <span style={{color:'#16a34a',fontSize:'0.85rem'}}>Venta registrada exitosamente.</span>
                  </div>
                )}
                <TablaCarrito cart={cartVenta} onRemove={id=>setCartVenta(cartVenta.filter(i=>i.id!==id))}/>
                <button onClick={()=>setCartVenta([])} style={{marginTop:'12px',background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',padding:'8px 20px',borderRadius:'30px',cursor:'pointer',fontWeight:'600',fontSize:'0.85rem'}}>
                  Limpiar carrito
                </button>
              </div>
            </div>

            {/* Panel facturación */}
            <div className="card-aura" style={{padding:'25px',position:'sticky',top:'20px'}}>
              <h4 style={{fontWeight:'700',marginBottom:'20px',color:'var(--aura-navy)'}}>Facturación</h4>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'0.88rem'}}>
                <span style={{color:'var(--aura-gray)'}}>Subtotal</span><span>RD$ {fmt(subVenta)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px',fontSize:'0.88rem'}}>
                <span style={{color:'var(--aura-gray)'}}>ITBIS (18%)</span><span>RD$ {fmt(itbVenta)}</span>
              </div>
              <hr style={{marginBottom:'15px',borderColor:'#f0edf5'}}/>

              <div style={{marginBottom:'12px'}}>
                <label style={labelStyle}>Condición de Pago</label>
                <select value={ventaCondicion} onChange={e=>setVentaCondicion(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                  <option>Contado</option><option>Crédito</option>
                </select>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={labelStyle}>Método de Pago</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                  {['Efectivo','Tarjeta','Transferencia'].map(m=>(
                    <button key={m} onClick={()=>{setVentaMetodo(m);setEfectivoRecibido('');}}
                      style={{padding:'9px 6px',borderRadius:'10px',border:`2px solid ${ventaMetodo===m?'var(--aura-lavender)':'#eee'}`,background:ventaMetodo===m?'#f0ecff':'white',cursor:'pointer',fontSize:'0.78rem',fontWeight:ventaMetodo===m?'700':'400',color:ventaMetodo===m?'var(--aura-lavender)':'#666',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                      {m==='Efectivo'?<Banknote size={13}/>:m==='Tarjeta'?<CardIcon size={13}/>:<ArrowDownLeft size={13}/>} {m}
                    </button>
                  ))}
                </div>
              </div>

              {ventaMetodo==='Efectivo'&&(
                <div style={{marginBottom:'12px'}}>
                  <label style={labelStyle}>Efectivo recibido (RD$)</label>
                  <input type="text" value={efectivoRecibido} onChange={e=>{if(/^\d*\.?\d*$/.test(e.target.value))setEfectivoRecibido(e.target.value);}}
                    placeholder="0.00" style={{...inputStyle,border:efectivoInsuficiente?'1px solid #ef4444':'1px solid #e8e0f5'}}/>
                  {efectivoInsuficiente&&<p style={{color:'#ef4444',fontSize:'0.75rem',marginTop:'4px'}}>Faltan RD$ {fmt(totVenta-Number(efectivoRecibido))}</p>}
                  {efectivoRecibido!==''&&!efectivoInsuficiente&&(
                    <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'10px',padding:'10px 14px',marginTop:'8px',display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:'0.82rem',color:'#16a34a',fontWeight:'500'}}>Cambio:</span>
                      <strong style={{color:'#16a34a'}}>RD$ {fmt(cambioEfectivo)}</strong>
                    </div>
                  )}
                </div>
              )}

              <div style={{background:'linear-gradient(135deg,var(--aura-navy),#2a2a72)',color:'white',padding:'16px',borderRadius:'15px',textAlign:'center',marginBottom:'16px',marginTop:'10px'}}>
                <div style={{fontSize:'0.75rem',opacity:0.8,marginBottom:'4px'}}>Total a Pagar</div>
                <div style={{fontSize:'1.6rem',fontWeight:'800'}}>RD$ {fmt(totVenta)}</div>
              </div>
              <button onClick={handleFinalizarVenta} className="btn-AuraSpa" style={{width:'100%',padding:'12px'}}
                disabled={cartVenta.length===0||(ventaMetodo==='Efectivo'&&efectivoInsuficiente)}>
                {ventaMetodo==='Tarjeta'?<><CardIcon size={15}/> Pasar Tarjeta</>:'Finalizar Compra'}
              </button>
            </div>
          </div>
        )}

        {/* ── MOVIMIENTOS ── */}
        {seccion==='movimientos'&&(
          <div>
            <div className="card-aura" style={{padding:'25px',marginBottom:'20px'}}>
              <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'20px'}}>Filtros</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'15px',marginBottom:'15px'}}>
                <div><label style={labelStyle}>No. Factura</label><input type="text" placeholder="FAC-001" style={inputStyle}/></div>
                <div><label style={labelStyle}>Empleado</label><select style={inputStyle}><option>Todos</option>{ESPECIALISTAS.map(e=><option key={e}>{e}</option>)}</select></div>
                <div><label style={labelStyle}>Fecha Desde</label><input type="date" value={movFechaDesde} onChange={e=>setMovFechaDesde(e.target.value)} style={inputStyle}/></div>
                <div><label style={labelStyle}>Fecha Hasta</label><input type="date" value={movFechaHasta} onChange={e=>setMovFechaHasta(e.target.value)} style={inputStyle}/></div>
                <div><label style={labelStyle}>Condición</label><select style={inputStyle}><option>Todos</option><option>Contado</option><option>Crédito</option></select></div>
              </div>
              <div style={{display:'flex',gap:'10px',flexDirection:'column'}}>
                {movFechaError && <p style={{color:'#ef4444',fontSize:'0.82rem',margin:'0'}}>{movFechaError}</p>}
                <div style={{display:'flex',gap:'10px'}}>
                <button onClick={()=>{
                  if(movFechaDesde && movFechaHasta && movFechaDesde > movFechaHasta){
                    setMovFechaError('La fecha de inicio no puede ser mayor que la fecha final. Ingresa un rango válido.');
                    return;
                  }
                  setMovFechaError('');
                  setMovFiltrados(MOVIMIENTOS_DATA);
                }} className="btn-AuraSpa" style={{padding:'10px 25px'}}>Filtrar</button>
                <button onClick={()=>{setMovFechaDesde('');setMovFechaHasta('');setMovFiltrados(MOVIMIENTOS_DATA);setMovFechaError('');}} className="btn-outline-aura" style={{padding:'10px 25px'}}>Limpiar</button>
              </div></div>
            </div>
            <div className="card-aura" style={{padding:'25px'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
                <thead>
                  <tr style={{background:'#EDE8F5'}}>
                    {['ID','Concepto','Fecha y Hora','Tipo','Condición','Usuario','Monto','Estado'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:'600',color:'var(--aura-navy)',borderBottom:'2px solid #e8e0f5'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movFiltrados.map((m,i)=>(
                    <tr key={m.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                      <td style={{padding:'10px 14px'}}>{m.id}</td>
                      <td style={{padding:'10px 14px',fontWeight:'500'}}>{m.concepto}</td>
                      <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>{m.fechaHora}</td>
                      <td style={{padding:'10px 14px'}}><span style={{color:m.tipo==='Ingreso'?'#22c55e':'#ef4444',fontWeight:'600'}}>{m.tipo}</span></td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{background:m.condicionPago==='Crédito'?'#fffbeb':'#f0fdf4',color:m.condicionPago==='Crédito'?'#f59e0b':'#22c55e',padding:'3px 10px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:'600'}}>{m.condicionPago}</span>
                      </td>
                      {/* Usuario corregido — el cajero es quien hace la transacción */}
                      <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>{m.usuario}</td>
                      <td style={{padding:'10px 14px',fontWeight:'600',color:'var(--aura-navy)'}}>RD$ {fmt(m.monto)}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{background:m.estado==='Sincronizado'?'#f0fdf4':'#fffbeb',color:m.estado==='Sincronizado'?'#22c55e':'#f59e0b',padding:'3px 10px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:'600'}}>{m.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:'flex',gap:'25px',marginTop:'15px',paddingTop:'15px',borderTop:'1px solid #f0edf5',fontSize:'0.88rem'}}>
                <span>Total Ingresos: <strong style={{color:'#22c55e'}}>RD$ {fmt(movFiltrados.filter(m=>m.tipo==='Ingreso').reduce((a,m)=>a+m.monto,0))}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ── COTIZACIONES — solo precios, sin cliente ni especialista ── */}
        {seccion==='cotizaciones'&&(
          <div>
            {cotSuccess&&(
              <div style={{display:'flex',alignItems:'center',gap:'10px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'15px',padding:'12px 20px',marginBottom:'20px'}}>
                <CheckCircle size={18} color="#22c55e"/>
                <span style={{color:'#16a34a',fontSize:'0.88rem'}}>Cotización <strong>{cotNumero}</strong> generada.</span>
                <button onClick={()=>{setEmailEnviado(true);setTimeout(()=>setEmailEnviado(false),3000);}}
                  className="btn-AuraSpa" style={{marginLeft:'auto',padding:'6px 16px',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'5px'}}>
                  <Send size={13}/> {emailEnviado ? '✓ Correo enviado' : 'Enviar por correo'}
                </button>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'25px',alignItems:'start'}}>
              <div>
                <div className="card-aura" style={{padding:'20px',marginBottom:'16px',background:'#f8f6ff',border:'1px solid #e8e0f5'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                    <span style={{background:'#f0ecff',color:'var(--aura-lavender)',padding:'5px 14px',borderRadius:'20px',fontSize:'0.82rem',fontWeight:'600'}}>No. {cotNumero}</span>
                    <span style={{fontSize:'0.82rem',color:'#888'}}>Las cotizaciones muestran precios del sistema — sin datos de cliente ni especialista.</span>
                  </div>
                </div>
                <div className="card-aura" style={{padding:'20px',marginBottom:'20px'}}>
                  <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'16px',fontSize:'0.95rem'}}>Añadir Servicio</h4>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 80px auto',gap:'12px',alignItems:'end'}}>
                    <div>
                      <label style={labelStyle}>Servicio / Producto</label>
                      <select value={cotServicio} onChange={e=>setCotServicio(e.target.value)} style={{...inputStyle,cursor:'pointer'}}>
                        <option value="">Selecciona...</option>
                        {SERVICIOS.map(s=><option key={s.id} value={s.id}>{s.nombre} — RD$ {fmt(s.precio)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Cant.</label>
                      <input type="text" value={cotCantidad} onChange={e=>{if(/^\d*$/.test(e.target.value))setCotCantidad(e.target.value);}} style={inputStyle}/>
                    </div>
                    <div><button onClick={()=>agregarItem(cartCot,setCartCot,cotServicio,cotCantidad)} className="btn-AuraSpa" style={{padding:'10px 18px'}}>+ Añadir</button></div>
                  </div>
                </div>
                <div className="card-aura" style={{padding:'20px'}}>
                  <TablaCarrito cart={cartCot} onRemove={id=>setCartCot(cartCot.filter(i=>i.id!==id))}/>
                </div>
              </div>
              {/* Panel cotización */}
              <div className="card-aura" style={{padding:'25px'}}>
                <h4 style={{fontWeight:'700',marginBottom:'20px',color:'var(--aura-navy)'}}>Resumen</h4>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'0.88rem'}}>
                  <span style={{color:'var(--aura-gray)'}}>Subtotal</span><span>RD$ {fmt(cartCot.reduce((a,i)=>a+i.precioUnitario*i.cantidad,0))}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'15px',fontSize:'0.88rem'}}>
                  <span style={{color:'var(--aura-gray)'}}>ITBIS (18%)</span><span>RD$ {fmt(cartCot.reduce((a,i)=>a+i.itbis,0))}</span>
                </div>
                <div style={{background:'linear-gradient(135deg,var(--aura-navy),#2a2a72)',color:'white',padding:'16px',borderRadius:'15px',textAlign:'center',marginBottom:'16px'}}>
                  <div style={{fontSize:'0.75rem',opacity:0.8,marginBottom:'4px'}}>Total Cotizado</div>
                  <div style={{fontSize:'1.6rem',fontWeight:'800'}}>RD$ {fmt(cartCot.reduce((a,i)=>a+i.subtotal,0))}</div>
                </div>
                <button onClick={()=>{if(cartCot.length===0)return;setCotSuccess(true);setCartCot([]);setCotContador(prev=>prev+1);setTimeout(()=>setCotSuccess(false),3000);}}
                  className="btn-AuraSpa" style={{width:'100%',padding:'12px',marginBottom:'10px'}} disabled={cartCot.length===0}>
                  Generar Cotización
                </button>
                <button onClick={()=>{if(cartCot.length===0)return;setCartVenta(cartCot);setCartCot([]);setSeccion('ventas');}}
                  className="btn-outline-aura" style={{width:'100%',padding:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} disabled={cartCot.length===0}>
                  <ShoppingCart size={16}/> Convertir a Venta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CxC — botones funcionando ── */}
        {seccion==='cxc'&&(
          <div>
            <div className="card-aura" style={{padding:'25px',marginBottom:'20px'}}>
              <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'20px'}}>Filtros</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'15px',marginBottom:'15px'}}>
                <div><label style={labelStyle}>Cliente</label><input type="text" value={cxcClienteFiltro} onChange={e=>setCxcClienteFiltro(e.target.value)} placeholder="Nombre del cliente" style={inputStyle}/></div>
                <div><label style={labelStyle}>No. Factura</label><input type="text" value={cxcFacturaFiltro} onChange={e=>setCxcFacturaFiltro(e.target.value)} placeholder="FAC-001" style={inputStyle}/></div>
                <div><label style={labelStyle}>Estado</label><select value={cxcEstadoFiltro} onChange={e=>setCxcEstadoFiltro(e.target.value)} style={inputStyle}><option>Todos</option><option>Pendiente</option><option>Parcial</option><option>Saldada</option></select></div>
              </div>
              <button onClick={()=>{}} className="btn-AuraSpa" style={{padding:'10px 25px'}}>Aplicar Filtro</button>
            </div>
            <div className="card-aura" style={{padding:'25px'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
                <thead>
                  <tr style={{background:'#EDE8F5'}}>
                    {['Factura','Cliente','Total','Pagado','Saldo','Vencimiento','Mora','Estado','Acciones'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:'600',color:'var(--aura-navy)',borderBottom:'2px solid #e8e0f5'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cxcData.filter(cx=>(cxcClienteFiltro===''||cx.clienteNombre.toLowerCase().includes(cxcClienteFiltro.toLowerCase()))&&(cxcFacturaFiltro===''||cx.ventaId.toLowerCase().includes(cxcFacturaFiltro.toLowerCase()))&&(cxcEstadoFiltro==='Todos'||cx.estado===cxcEstadoFiltro)).map((c,i)=>(
                    <tr key={c.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                      <td style={{padding:'10px 14px',fontWeight:'500'}}>{c.ventaId}</td>
                      <td style={{padding:'10px 14px'}}>{c.clienteNombre}</td>
                      <td style={{padding:'10px 14px'}}>RD$ {fmt(c.montoTotal)}</td>
                      <td style={{padding:'10px 14px',color:'#22c55e',fontWeight:'600'}}>RD$ {fmt(c.montoPagado)}</td>
                      <td style={{padding:'10px 14px',color:'#ef4444',fontWeight:'600'}}>RD$ {fmt(c.saldoPendiente)}</td>
                      <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>{c.fechaVencimiento}</td>
                      <td style={{padding:'10px 14px'}}>
                        {c.diasMora>0?<span style={{color:'#ef4444',fontWeight:'600'}}>{c.diasMora}d · +RD$ {calcularMora(c).toLocaleString('es-DO')}</span>:<span style={{color:'#22c55e'}}>Al día</span>}
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{background:c.estado==='Parcial'?'#fffbeb':c.estado==='Saldada'?'#f0fdf4':'#fef2f2',
                          color:c.estado==='Parcial'?'#f59e0b':c.estado==='Saldada'?'#22c55e':'#ef4444',
                          padding:'3px 10px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:'600'}}>{c.estado}</span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        {c.saldoPendiente>0&&(
                          <button onClick={()=>setAbonoModal({id:c.id,nombre:c.clienteNombre,saldo:c.saldoPendiente})}
                            className="btn-AuraSpa" style={{padding:'5px 14px',fontSize:'0.78rem',whiteSpace:'nowrap'}}>
                            Registrar Abono
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'15px',paddingTop:'15px',borderTop:'1px solid #f0edf5',fontSize:'0.88rem'}}>
                <span>Deudores activos: <strong>{cxcData.filter(c=>c.saldoPendiente>0).length}</strong></span>
                <span>Total pendiente: <strong style={{color:'#ef4444'}}>RD$ {fmt(cxcData.reduce((a,c)=>a+c.saldoPendiente,0))}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ── CIERRE ── */}
        {seccion==='cierre'&&(
          <div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}>
            {cierreSuccess?(
              <div className="card-aura animate-fade-in" style={{width:'100%',maxWidth:'480px',padding:'50px',textAlign:'center'}}>
                <CheckCircle size={52} color="#22c55e" style={{marginBottom:'20px'}}/>
                <h3 style={{fontWeight:'700',marginBottom:'8px',color:'var(--aura-navy)'}}>Caja cerrada correctamente</h3>
                <p style={{color:'var(--aura-gray)',fontSize:'0.88rem'}}>Redirigiendo al panel...</p>
              </div>
            ):(
              <div className="card-aura animate-fade-in" style={{width:'100%',maxWidth:'560px',padding:'45px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'25px'}}>
                  <div style={{background:'#fef2f2',padding:'12px',borderRadius:'50%',color:'#ef4444'}}><LogOut size={24}/></div>
                  <div>
                    <h3 style={{fontWeight:'700',color:'var(--aura-navy)',margin:0}}>Cierre de Turno</h3>
                    <p style={{color:'#888',margin:0,fontSize:'0.82rem'}}>Turno: <strong>{turno}</strong></p>
                  </div>
                </div>

                {/* Resumen completo del turno */}
                <div style={{background:'#f8f6ff',borderRadius:'15px',padding:'20px',marginBottom:'20px'}}>
                  <h4 style={{fontWeight:'600',marginBottom:'14px',color:'var(--aura-navy)',fontSize:'0.9rem'}}>Resumen del Turno</h4>
                  {[
                    {label:'Fondo inicial:',       valor:`RD$ ${fmt(fondoCaja)}`,       color:'inherit'},
                    {label:'Total ventas:',         valor:`RD$ ${fmt(totalVentasTurno)}`, color:'#22c55e'},
                    {label:'Ventas en efectivo:',   valor:`RD$ ${fmt(totalVentasTurno*0.7)}`, color:'inherit'},
                    {label:'Ventas con tarjeta:',   valor:`RD$ ${fmt(totalVentasTurno*0.3)}`, color:'inherit'},
                    {label:'CxC generadas:',        valor:`RD$ ${fmt(cxcData.reduce((a,c)=>a+c.saldoPendiente,0))}`, color:'#f59e0b'},
                    {label:'El sistema reporta:',   valor:`RD$ ${fmt(fondoCaja+totalVentasTurno)}`, color:'var(--aura-navy)'},
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',marginBottom:i<4?'8px':'0',fontSize:'0.88rem',paddingTop:i===5?'10px':0,borderTop:i===5?'1px solid #e8e0f5':'none'}}>
                      <span style={{color:'var(--aura-gray)'}}>{r.label}</span>
                      <strong style={{color:r.color}}>{r.valor}</strong>
                    </div>
                  ))}
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Efectivo contado en gaveta (RD$) <span style={{color:'#ef4444'}}>*</span></label>
                  <input type="text" value={montoCierre} onChange={e=>validarNumero(e.target.value,setMontoCierre,setMontoCierreError)}
                    placeholder="0.00" style={{...inputStyle,border:montoCierreError?'1px solid #ef4444':'1px solid #e8e0f5'}}/>
                  {montoCierreError&&<p style={{color:'#ef4444',fontSize:'0.78rem',marginTop:'4px'}}>{montoCierreError}</p>}
                </div>

                {montoCierre&&!isNaN(Number(montoCierre))&&(
                  <div style={{background:diferenciaCierre>=0?'#f0fdf4':'#fef2f2',border:`1px solid ${diferenciaCierre>=0?'#86efac':'#fecaca'}`,borderRadius:'12px',padding:'14px 16px',marginBottom:'16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem'}}>
                      <span style={{fontWeight:'600'}}>Diferencia:</span>
                      <strong style={{color:diferenciaCierre>=0?'#22c55e':'#ef4444',fontSize:'1.1rem'}}>
                        {diferenciaCierre>=0?'+':''}RD$ {fmt(diferenciaCierre)} {diferenciaCierre>0?'(Sobrante)':diferenciaCierre<0?'(Faltante)':'(Cuadre exacto ✓)'}
                      </strong>
                    </div>
                    {Math.abs(diferenciaCierre)>100&&(
                      <p style={{color:'#888',fontSize:'0.78rem',margin:'8px 0 0'}}>
                        {diferenciaCierre<0?'⚠️ Hay faltante — revisa las transacciones antes de cerrar.':'ℹ️ Hay sobrante — verifica las transacciones.'}
                      </p>
                    )}
                  </div>
                )}

                <div style={{marginBottom:'25px'}}>
                  <label style={labelStyle}>Observación</label>
                  <input type="text" placeholder="Ej: Cierre sin novedades" style={inputStyle}/>
                </div>

                <div style={{display:'flex',gap:'12px'}}>
                  <button onClick={()=>{
                    if(!montoCierre||isNaN(Number(montoCierre))||Number(montoCierre)<0){ setMontoCierreError('Ingresa el efectivo contado.'); return; }
                    setMontoCierreError('');
                    setCierreSuccess(true);
                    setCajaAbierta(false);
                    setTimeout(()=>{ setCierreSuccess(false); navigate('/dashboard/staff'); },2000);
                  }} style={{flex:1,padding:'13px',background:'#ef4444',color:'white',border:'none',borderRadius:'30px',cursor:'pointer',fontWeight:'700',fontSize:'0.95rem'}}>
                    Confirmar Cierre
                  </button>
                  <button onClick={()=>setSeccion('ventas')} className="btn-outline-aura" style={{flex:1,padding:'13px'}}>Cancelar</button>
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
