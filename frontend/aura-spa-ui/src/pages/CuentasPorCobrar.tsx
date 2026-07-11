import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import apiClient from '../services/apiClient';

interface CxcApi { id:number; ventaId:string; clienteNombre:string; montoTotal:number; montoPagado:number; saldoPendiente:number; fechaVencimiento:string; estado:string; }

const fmt = (n:number) => n.toLocaleString('es-DO',{minimumFractionDigits:2});
const formatFecha = (iso:string) => new Date(iso).toLocaleDateString('es-DO');
const inputStyle:React.CSSProperties = { width:'100%', padding:'10px 15px', borderRadius:'15px', border:'1px solid #e8e0f5', outline:'none', background:'#fcfcfc', fontSize:'0.88rem', boxSizing:'border-box' };
const labelStyle:React.CSSProperties = { display:'block', marginBottom:'6px', fontSize:'0.82rem', color:'var(--aura-gray)', fontWeight:'500' };

const CuentasPorCobrar: React.FC = () => {
  const navigate = useNavigate();

  const [cxcClienteFiltro, setCxcClienteFiltro] = useState('');
  const [cxcFacturaFiltro, setCxcFacturaFiltro] = useState('');
  const [cxcEstadoFiltro, setCxcEstadoFiltro] = useState('Todos');
  const [abonoModal, setAbonoModal] = useState<{id:number;nombre:string;saldo:number}|null>(null);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [cxcData, setCxcData] = useState<CxcApi[]>([]);

  const cargarCxc = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/caja/cxc');
      setCxcData(res.data);
    } catch { setCxcData([]); }
  }, []);

  useEffect(() => { cargarCxc(); }, [cargarCxc]);

  const calcularDiasMora = (fechaVencimiento:string) => {
    const dias = Math.floor((Date.now()-new Date(fechaVencimiento).getTime())/(1000*60*60*24));
    return dias > 0 ? dias : 0;
  };

  const calcularMora = (cxc: CxcApi) => {
    const dias = calcularDiasMora(cxc.fechaVencimiento);
    return dias > 0 ? Math.round(cxc.saldoPendiente * 0.03 * dias) : 0; // 3% mensual
  };

  const registrarAbono = async () => {
    if(!abonoModal||!abonoMonto) return;
    const monto = parseFloat(abonoMonto);
    if(isNaN(monto)||monto<=0||monto>abonoModal.saldo) return;
    try {
      await apiClient.post(`/api/caja/cxc/${abonoModal.id}/abono`, { monto });
      await cargarCxc();
    } catch {}
    setAbonoModal(null); setAbonoMonto('');
  };

  const cxcFiltrados = cxcData.filter(cx =>
    (cxcClienteFiltro===''||cx.clienteNombre.toLowerCase().includes(cxcClienteFiltro.toLowerCase())) &&
    (cxcFacturaFiltro===''||cx.ventaId.toLowerCase().includes(cxcFacturaFiltro.toLowerCase())) &&
    (cxcEstadoFiltro==='Todos'||cx.estado===cxcEstadoFiltro)
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--aura-beige)', padding:'40px 8%' }}>
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

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'30px', flexWrap:'wrap', gap:'15px' }}>
        <div>
          <h2 style={{ color:'var(--aura-navy)', fontWeight:'bold', margin:0, display:'flex', alignItems:'center', gap:'12px' }}>
            <CreditCard size={28} color="#ef4444" /> Cuentas por Cobrar
          </h2>
          <p style={{ color:'var(--aura-gray)', margin:0, fontSize:'0.9rem' }}>Gestiona los pagos pendientes y abonos de clientes.</p>
        </div>
        <button onClick={() => navigate('/dashboard/staff')} className="btn-outline-aura" style={{ padding:'10px 20px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'6px' }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <div className="card-aura" style={{padding:'25px',marginBottom:'20px'}}>
        <h4 style={{fontWeight:'700',color:'var(--aura-navy)',marginBottom:'20px'}}>Filtros</h4>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'15px',marginBottom:'15px'}}>
          <div><label style={labelStyle}>Cliente</label><input type="text" value={cxcClienteFiltro} onChange={e=>setCxcClienteFiltro(e.target.value)} placeholder="Nombre del cliente" style={inputStyle}/></div>
          <div><label style={labelStyle}>No. Factura</label><input type="text" value={cxcFacturaFiltro} onChange={e=>setCxcFacturaFiltro(e.target.value)} placeholder="FAC-001" style={inputStyle}/></div>
          <div><label style={labelStyle}>Estado</label><select value={cxcEstadoFiltro} onChange={e=>setCxcEstadoFiltro(e.target.value)} style={inputStyle}><option>Todos</option><option>Pendiente</option><option>Parcial</option><option>Saldada</option></select></div>
        </div>
      </div>

      <div className="card-aura" style={{padding:'25px'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
            <thead>
              <tr style={{background:'#EDE8F5'}}>
                {['Factura','Cliente','Total','Pagado','Saldo','Vencimiento','Mora','Estado','Acciones'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:'600',color:'var(--aura-navy)',borderBottom:'2px solid #e8e0f5'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cxcFiltrados.length===0?(
                <tr><td colSpan={9} style={{padding:'30px',textAlign:'center',color:'#bbb',fontSize:'0.88rem'}}>Sin cuentas por cobrar pendientes</td></tr>
              ):cxcFiltrados.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={{padding:'10px 14px',fontWeight:'500'}}>{c.ventaId}</td>
                  <td style={{padding:'10px 14px'}}>{c.clienteNombre}</td>
                  <td style={{padding:'10px 14px'}}>RD$ {fmt(c.montoTotal)}</td>
                  <td style={{padding:'10px 14px',color:'#22c55e',fontWeight:'600'}}>RD$ {fmt(c.montoPagado)}</td>
                  <td style={{padding:'10px 14px',color:'#ef4444',fontWeight:'600'}}>RD$ {fmt(c.saldoPendiente)}</td>
                  <td style={{padding:'10px 14px',color:'var(--aura-gray)'}}>{formatFecha(c.fechaVencimiento)}</td>
                  <td style={{padding:'10px 14px'}}>
                    {calcularDiasMora(c.fechaVencimiento)>0?<span style={{color:'#ef4444',fontWeight:'600'}}>{calcularDiasMora(c.fechaVencimiento)}d · +RD$ {calcularMora(c).toLocaleString('es-DO')}</span>:<span style={{color:'#22c55e'}}>Al día</span>}
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
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'15px',paddingTop:'15px',borderTop:'1px solid #f0edf5',fontSize:'0.88rem'}}>
          <span>Deudores activos: <strong>{cxcData.filter(c=>c.saldoPendiente>0).length}</strong></span>
          <span>Total pendiente: <strong style={{color:'#ef4444'}}>RD$ {fmt(cxcData.reduce((a,c)=>a+c.saldoPendiente,0))}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default CuentasPorCobrar;
