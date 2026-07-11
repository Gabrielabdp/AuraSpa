import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
  Building2, Shield, Users, UserCheck, Package,
  Stethoscope, Gift, FileCheck, ClipboardList, LogOut,
  Plus, Edit, Trash2, CheckCircle, XCircle, X, Search, Save, Clock
} from 'lucide-react';

type Seccion = 'sucursales'|'perfiles'|'usuarios'|'empleados'|'servicios'|'inventario'|'expedientes'|'paquetes'|'consentimiento'|'auditoria';

// Secciones con create/edit real contra el backend
const SECCIONES_CON_CREAR = ['sucursales', 'empleados', 'expedientes'];
// Secciones aún no implementadas — solo muestran un aviso
const SECCIONES_PROXIMAMENTE: Seccion[] = ['paquetes', 'consentimiento'];

const ID_SUCURSAL_DEFAULT = 1; // AuraSpa Principal — única sucursal activa

// ── DATOS INICIALES (secciones fuera de alcance: siguen locales) ───────────────
const INIT_EXPEDIENTES = [
  { id:1, cliente:'Gabriela Duverge', alergias:'Ninguna', tipoPiel:'Mixta', medicamentos:'Ninguno', notas:'Prefiere masaje suave', activo:true },
  { id:2, cliente:'Diana Lantigua',   alergias:'Látex',   tipoPiel:'Seca',  medicamentos:'Ninguno', notas:'Piel sensible',         activo:true },
];
const INIT_AUDITORIA = [
  { id:1, usuario:'admin',   accion:'Modificó precio de Facial Hidratante', valorAnterior:'RD$ 1,500.00', valorNuevo:'RD$ 1,800.00', fecha:'05/06/2026 09:15' },
  { id:2, usuario:'admin',   accion:'Creó nuevo empleado: Nicole Martínez',  valorAnterior:'—',            valorNuevo:'Especialista',  fecha:'04/06/2026 14:30' },
  { id:3, usuario:'cajero',  accion:'Modificó precio de Masaje Relajante',   valorAnterior:'RD$ 2,000.00', valorNuevo:'RD$ 2,500.00', fecha:'03/06/2026 11:00' },
];

// ── VALIDACIONES ───────────────────────────────────────────────────────────────
const soloLetras   = (v: string) => v.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]/g, '');
const soloNumeros  = (v: string) => v.replace(/\D/g, '').slice(0, 9);

// ── ESTILOS ────────────────────────────────────────────────────────────────────
const iS: React.CSSProperties = { width:'100%', padding:'10px 15px', borderRadius:'12px', border:'1px solid #e0d8f5', outline:'none', background:'#fcfcfc', fontSize:'0.88rem', boxSizing:'border-box' };
const lS: React.CSSProperties = { display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'var(--aura-gray)', fontWeight:'600' };
const tdS: React.CSSProperties = { padding:'10px 14px', fontSize:'0.85rem', color:'var(--aura-gray)' };
const tdB: React.CSSProperties = { ...tdS, fontWeight:'600', color:'var(--aura-navy)' };

// ── SUBCOMPONENTES ─────────────────────────────────────────────────────────────
const TH: React.FC<{cols:string[]}> = ({cols}) => (
  <thead>
    <tr style={{background:'#EDE8F5'}}>
      {cols.map(h => <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:'600',color:'var(--aura-navy)',borderBottom:'2px solid #e8e0f5',fontSize:'0.82rem',whiteSpace:'nowrap'}}>{h}</th>)}
    </tr>
  </thead>
);

const BadgeActivo: React.FC<{activo:boolean}> = ({activo}) => (
  <span style={{background:activo?'#f0fdf4':'#fef2f2',color:activo?'#22c55e':'#ef4444',padding:'3px 10px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:'600'}}>
    {activo ? 'Activo' : 'Inactivo'}
  </span>
);

const Btns: React.FC<{onEdit:()=>void;onDelete:()=>void}> = ({onEdit,onDelete}) => (
  <td style={{padding:'10px 14px'}}>
    <div style={{display:'flex',gap:'6px'}}>
      <button onClick={onEdit}   title="Editar"   style={{background:'#f0ecff',border:'none',cursor:'pointer',color:'var(--aura-lavender)',padding:'5px 10px',borderRadius:'8px'}}><Edit   size={13}/></button>
      <button onClick={onDelete} title="Eliminar" style={{background:'#fef2f2',border:'none',cursor:'pointer',color:'#ef4444',          padding:'5px 10px',borderRadius:'8px'}}><Trash2 size={13}/></button>
    </div>
  </td>
);

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
const Core: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seccion, setSeccion]       = useState<Seccion>('sucursales');
  const [busqueda, setBusqueda]     = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editId, setEditId]         = useState<number|null>(null);
  const [confirmDel, setConfirmDel] = useState<{id:number;nombre:string}|null>(null);
  const [confirmSave, setConfirmSave]= useState(false);
  const [guardadoOk, setGuardadoOk] = useState<string|null>(null);
  const [errorToast, setErrorToast] = useState<string|null>(null);
  const [cargando, setCargando]     = useState(false);

  const [sucursales,      setSucursales]      = useState<any[]>([]);
  const [perfiles,        setPerfiles]        = useState<any[]>([]);
  const [usuarios,        setUsuarios]        = useState<any[]>([]);
  const [empleados,       setEmpleados]       = useState<any[]>([]);
  const [servicios,       setServicios]       = useState<any[]>([]);
  const [inventario,      setInventario]      = useState<any[]>([]);
  const [expedientes,     setExpedientes]     = useState(INIT_EXPEDIENTES);
  const [auditoriaLog] = useState(INIT_AUDITORIA);

  const mostrarToast = (msg: string, esError = false) => {
    if (esError) { setErrorToast(msg); setTimeout(() => setErrorToast(null), 3000); }
    else         { setGuardadoOk(msg); setTimeout(() => setGuardadoOk(null), 3000); }
  };

  const cargarSucursales = useCallback(async () => {
    try { const r = await apiClient.get('/api/core/sucursales'); setSucursales(r.data); } catch { setSucursales([]); }
  }, []);
  const cargarPerfiles = useCallback(async () => {
    try { const r = await apiClient.get('/api/core/perfiles'); setPerfiles(r.data); } catch { setPerfiles([]); }
  }, []);
  const cargarUsuarios = useCallback(async () => {
    try { const r = await apiClient.get('/api/core/usuarios'); setUsuarios(r.data); } catch { setUsuarios([]); }
  }, []);
  const cargarEmpleados = useCallback(async () => {
    try { const r = await apiClient.get('/api/core/empleados'); setEmpleados(r.data); } catch { setEmpleados([]); }
  }, []);
  const cargarServicios = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/catalog/services');
      setServicios(r.data.map((s:any) => ({
        id: s.idItem, nombre: s.nombre, categoria: s.categoria?.nombre ?? '',
        precio: s.precioBase, duracion: s.duracionMinutos ?? 0, activo: s.activo
      })));
    } catch { setServicios([]); }
  }, []);
  const cargarInventario = useCallback(async () => {
    try {
      const idSuc = sucursales[0]?.id ?? ID_SUCURSAL_DEFAULT;
      const r = await apiClient.get(`/api/inventario/stock/${idSuc}`);
      setInventario(r.data.map((i:any) => ({
        id: i.idItem, nombre: i.nombre, categoria: i.categoria,
        stock: i.stock ?? 0, stockMinimo: i.stockMinimo, activo: i.disponible
      })));
    } catch { setInventario([]); }
  }, [sucursales]);

  // Sucursales se cargan siempre al montar — las necesita el formulario de Empleados
  useEffect(() => { cargarSucursales(); }, [cargarSucursales]);

  useEffect(() => {
    const cargarSeccion = async () => {
      if (seccion==='sucursales') { setCargando(true); await cargarSucursales(); }
      else if (seccion==='perfiles')   { setCargando(true); await cargarPerfiles(); }
      else if (seccion==='usuarios')   { setCargando(true); await cargarUsuarios(); }
      else if (seccion==='empleados')  { setCargando(true); await cargarEmpleados(); }
      else if (seccion==='servicios')  { setCargando(true); await cargarServicios(); }
      else if (seccion==='inventario') { setCargando(true); await cargarInventario(); }
      else return;
      setCargando(false);
    };
    cargarSeccion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion]);

  // Formulario dinámico — estado controlado
  const [form, setForm] = useState<Record<string,string>>({});
  const setF = (k:string, v:string) => setForm(prev => ({...prev, [k]:v}));

  const abrirCrear = () => {
    setEditId(null);
    setForm({});
    setModalOpen(true);
  };

  const abrirEditar = (id: number) => {
    setEditId(id);
    // Pre-cargar datos del registro seleccionado
    let datos: Record<string,string> = {};
    if (seccion==='sucursales') {
      const r = sucursales.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, direccion:r.direccion, telefono:r.telefono||'' };
    } else if (seccion==='empleados') {
      const r = empleados.find(x=>x.id===id)!;
      datos = { nombres:r.nombres, apellidos:r.apellidos, documento:r.documento, tipoEmpleado:r.tipoEmpleado, telefono:r.telefono||'', sucursal:r.sucursal };
    } else if (seccion==='expedientes') {
      const r = expedientes.find(x=>x.id===id)!;
      datos = { cliente:r.cliente, alergias:r.alergias, tipoPiel:r.tipoPiel, medicamentos:r.medicamentos, notas:r.notas };
    }
    setForm(datos);
    setModalOpen(true);
  };

  // Soft delete: solo Sucursales tiene endpoint real; Expedientes sigue local (fuera de alcance)
  const softDelete = async (id: number) => {
    if (seccion==='sucursales') {
      try {
        await apiClient.delete(`/api/core/sucursales/${id}`);
        await cargarSucursales();
        mostrarToast('Sucursal desactivada correctamente.');
      } catch {
        mostrarToast('No se pudo desactivar la sucursal.', true);
      }
    } else if (seccion==='expedientes') {
      setExpedientes(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    }
    setConfirmDel(null);
  };

  const toggleUsuario = async (id: number) => {
    try {
      await apiClient.put(`/api/core/usuarios/${id}/toggle`);
      await cargarUsuarios();
      mostrarToast('Estado del usuario actualizado correctamente.');
    } catch {
      mostrarToast('No se pudo actualizar el usuario.', true);
    }
  };

  const guardar = async () => {
    try {
      if (seccion==='sucursales') {
        const payload = { nombre: form.nombre||'', direccion: form.direccion||'', telefono: form.telefono||null };
        if (editId) await apiClient.put(`/api/core/sucursales/${editId}`, payload);
        else        await apiClient.post('/api/core/sucursales', payload);
        await cargarSucursales();
        mostrarToast(editId ? 'Sucursal actualizada correctamente.' : 'Sucursal creada correctamente.');
      } else if (seccion==='empleados') {
        const idSucursal = sucursales.find(s=>s.nombre===form.sucursal)?.id ?? sucursales[0]?.id ?? ID_SUCURSAL_DEFAULT;
        const payload = {
          nombres: form.nombres||'', apellidos: form.apellidos||'', numeroDocumento: form.documento||'',
          tipoEmpleado: form.tipoEmpleado||'Especialista', telefono: form.telefono||null, idSucursal
        };
        if (editId) await apiClient.put(`/api/core/empleados/${editId}`, payload);
        else        await apiClient.post('/api/core/empleados', payload);
        await cargarEmpleados();
        mostrarToast(editId ? 'Empleado actualizado correctamente.' : 'Empleado creado correctamente.');
      } else if (seccion==='expedientes') {
        // Fuera de alcance del backend — sigue en memoria local
        const id = editId ?? Date.now();
        if (editId) setExpedientes(p=>p.map(x=>x.id===editId?{...x,alergias:form.alergias||x.alergias,tipoPiel:form.tipoPiel||x.tipoPiel,medicamentos:form.medicamentos||x.medicamentos,notas:form.notas||x.notas}:x));
        else        setExpedientes(p=>[...p,{id,cliente:form.cliente||'',alergias:form.alergias||'Ninguna',tipoPiel:form.tipoPiel||'Normal',medicamentos:form.medicamentos||'Ninguno',notas:form.notas||'',activo:true}]);
        mostrarToast('Guardado correctamente.');
      }
    } catch (err: any) {
      const msg = err.response?.data;
      mostrarToast(typeof msg === 'string' ? msg : 'No se pudo guardar. Intenta de nuevo.', true);
    } finally {
      setConfirmSave(false);
      setModalOpen(false);
      setEditId(null);
      setForm({});
    }
  };

  const tabs = [
    {id:'sucursales',    label:'Sucursales',    icon:<Building2 size={14}/>},
    {id:'perfiles',      label:'Perfiles',      icon:<Shield size={14}/>},
    {id:'usuarios',      label:'Usuarios',      icon:<Users size={14}/>},
    {id:'empleados',     label:'Empleados',     icon:<UserCheck size={14}/>},
    {id:'servicios',     label:'Servicios',     icon:<ClipboardList size={14}/>},
    {id:'inventario',    label:'Inventario',    icon:<Package size={14}/>},
    {id:'expedientes',   label:'Expedientes',   icon:<Stethoscope size={14}/>},
    {id:'paquetes',      label:'Paquetes',      icon:<Gift size={14}/>},
    {id:'consentimiento',label:'Consentimiento',icon:<FileCheck size={14}/>},
    {id:'auditoria',     label:'Auditoría',     icon:<ClipboardList size={14}/>},
  ];

  // ── FORMULARIOS POR SECCIÓN ────────────────────────────────────────────────
  const renderForm = () => {
    const titulo = editId ? 'Editar' : 'Nuevo';
    let campos = null;

    if (seccion==='sucursales') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Nombre de la sucursal</label>
            <input value={form.nombre||''} onChange={e=>setF('nombre',soloLetras(e.target.value))} placeholder="Ej: AuraSpa Piantini" style={iS}/></div>
          <div><label style={lS}>Teléfono (9 dígitos)</label>
            <input value={form.telefono||''} onChange={e=>setF('telefono',soloNumeros(e.target.value))} placeholder="8091234567" maxLength={9} style={iS}/></div>
        </div>
        <div style={{marginBottom:'14px'}}><label style={lS}>Dirección</label>
          <input value={form.direccion||''} onChange={e=>setF('direccion',e.target.value)} placeholder="Dirección completa" style={iS}/></div>
      </>
    );
    else if (seccion==='empleados') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Nombres</label>
            <input value={form.nombres||''} onChange={e=>setF('nombres',soloLetras(e.target.value))} placeholder="Nombres" style={iS}/></div>
          <div><label style={lS}>Apellidos</label>
            <input value={form.apellidos||''} onChange={e=>setF('apellidos',soloLetras(e.target.value))} placeholder="Apellidos" style={iS}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Cédula / Documento</label>
            <input value={form.documento||''} onChange={e=>setF('documento',soloNumeros(e.target.value))} placeholder="00000000000" maxLength={11} style={iS}/></div>
          <div><label style={lS}>Teléfono (9 dígitos)</label>
            <input value={form.telefono||''} onChange={e=>setF('telefono',soloNumeros(e.target.value))} placeholder="8091234567" maxLength={9} style={iS}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Tipo de empleado</label>
            <select value={form.tipoEmpleado||'Especialista'} onChange={e=>setF('tipoEmpleado',e.target.value)} style={iS}>
              {['Especialista','Cajero','Admin'].map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={lS}>Sucursal</label>
            <select value={form.sucursal||'AuraSpa Piantini'} onChange={e=>setF('sucursal',e.target.value)} style={iS}>
              {sucursales.map(s=><option key={s.id}>{s.nombre}</option>)}
            </select></div>
        </div>
      </>
    );
    else if (seccion==='expedientes') campos = (
      <>
        <div style={{marginBottom:'14px'}}><label style={lS}>Cliente</label>
          <input value={form.cliente||''} onChange={e=>setF('cliente',soloLetras(e.target.value))} placeholder="Nombre del cliente" style={iS} readOnly={!!editId}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Tipo de piel</label>
            <select value={form.tipoPiel||'Normal'} onChange={e=>setF('tipoPiel',e.target.value)} style={iS}>
              {['Normal','Mixta','Seca','Grasa','Sensible'].map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={lS}>Alergias</label>
            <input value={form.alergias||''} onChange={e=>setF('alergias',e.target.value)} placeholder="Ej: Látex, Ninguna" style={iS}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Medicamentos</label>
            <input value={form.medicamentos||''} onChange={e=>setF('medicamentos',e.target.value)} placeholder="Ej: Ninguno" style={iS}/></div>
          <div><label style={lS}>Notas del especialista</label>
            <input value={form.notas||''} onChange={e=>setF('notas',e.target.value)} placeholder="Observaciones" style={iS}/></div>
        </div>
      </>
    );
    return (
      <div className="card-aura" style={{padding:'25px',marginBottom:'20px',borderLeft:'4px solid var(--aura-lavender)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <h4 style={{fontWeight:'700',color:'var(--aura-navy)',margin:0}}>
            {titulo} {seccion.charAt(0).toUpperCase()+seccion.slice(1,-1===seccion.indexOf('es')?0:-1)}
          </h4>
          <button onClick={()=>{setModalOpen(false);setForm({});setEditId(null);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--aura-gray)'}}><X size={18}/></button>
        </div>
        {campos}
        <div style={{display:'flex',gap:'10px',marginTop:'5px'}}>
          <button onClick={()=>setConfirmSave(true)} className="btn-AuraSpa" style={{padding:'10px 25px',display:'flex',alignItems:'center',gap:'7px'}}>
            <Save size={15}/> {editId ? 'Guardar cambios' : 'Crear registro'}
          </button>
          <button onClick={()=>{setModalOpen(false);setForm({});setEditId(null);}} className="btn-outline-aura" style={{padding:'10px 25px'}}>Cancelar</button>
        </div>
      </div>
    );
  };

  const filtrar = (arr: any[], campo='nombre') =>
    arr.filter(x => (x[campo]||'').toLowerCase().includes(busqueda.toLowerCase()) ||
                    JSON.stringify(x).toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div style={{minHeight:'100vh',background:'var(--aura-beige)'}}>

      {/* ── Modal eliminar ── */}
      {confirmDel && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
          <div className="card-aura" style={{maxWidth:'380px',width:'90%',padding:'40px',borderRadius:'24px',textAlign:'center'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>⚠️</div>
            <h4 style={{color:'var(--aura-navy)',fontWeight:'bold',marginBottom:'8px'}}>¿Eliminar registro?</h4>
            <p style={{color:'#888',fontSize:'0.88rem',marginBottom:'24px'}}>
              <strong>{confirmDel.nombre}</strong> será desactivado del sistema (soft delete).
            </p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={()=>softDelete(confirmDel.id)} style={{padding:'10px 25px',background:'#ef4444',color:'white',border:'none',borderRadius:'30px',cursor:'pointer',fontWeight:'700'}}>Sí, eliminar</button>
              <button onClick={()=>setConfirmDel(null)} className="btn-outline-aura" style={{padding:'10px 25px'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar guardar ── */}
      {confirmSave && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
          <div className="card-aura" style={{maxWidth:'360px',width:'90%',padding:'40px',borderRadius:'24px',textAlign:'center'}}>
            <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>💾</div>
            <h4 style={{color:'var(--aura-navy)',fontWeight:'bold',marginBottom:'8px'}}>¿Confirmar cambios?</h4>
            <p style={{color:'#888',fontSize:'0.88rem',marginBottom:'24px'}}>Esta acción {editId?'actualizará':'creará'} el registro en el sistema.</p>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={guardar} className="btn-AuraSpa" style={{padding:'10px 25px'}}>Sí, guardar</button>
              <button onClick={()=>setConfirmSave(false)} className="btn-outline-aura" style={{padding:'10px 25px'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast éxito / error ── */}
      {guardadoOk && (
        <div style={{position:'fixed',top:'20px',right:'20px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'14px',padding:'14px 20px',zIndex:3000,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
          <CheckCircle size={18} color="#22c55e"/>
          <span style={{color:'#16a34a',fontWeight:'600',fontSize:'0.9rem'}}>{guardadoOk}</span>
        </div>
      )}
      {errorToast && (
        <div style={{position:'fixed',top:'20px',right:'20px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'14px',padding:'14px 20px',zIndex:3000,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
          <XCircle size={18} color="#ef4444"/>
          <span style={{color:'#b91c1c',fontWeight:'600',fontSize:'0.9rem'}}>{errorToast}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{background:'white',borderBottom:'1px solid #f0edf5',padding:'15px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <h2 style={{color:'var(--aura-navy)',fontWeight:'bold',margin:0,fontSize:'1.2rem'}}>AuraSpa <span style={{color:'var(--aura-lavender)'}}>Core</span></h2>
          <span style={{background:'#f0ecff',color:'var(--aura-lavender)',padding:'3px 12px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:'600'}}>Panel Administrativo</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'15px'}}>
          <div style={{position:'relative'}}>
            <Search size={15} style={{position:'absolute',left:'11px',top:'10px',color:'#999'}}/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..."
              style={{padding:'8px 12px 8px 32px',borderRadius:'30px',border:'1px solid #e0d8f5',outline:'none',fontSize:'0.85rem',width:'200px'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--aura-navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:'700'}}>{user?.nombre?.[0]||'A'}</div>
            <span style={{fontSize:'0.85rem',fontWeight:'500',color:'var(--aura-navy)'}}>{user?.nombre}</span>
          </div>
          <button onClick={()=>navigate('/dashboard/staff')} style={{background:'none',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',gap:'4px',fontSize:'0.82rem'}}>
            <LogOut size={14}/> Salir
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{background:'white',borderBottom:'1px solid #f0edf5',padding:'0 40px',display:'flex',overflowX:'auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>{setSeccion(t.id as Seccion);setBusqueda('');setModalOpen(false);setEditId(null);setForm({});}}
            style={{padding:'12px 14px',border:'none',background:'none',cursor:'pointer',fontSize:'0.8rem',whiteSpace:'nowrap',
              display:'flex',alignItems:'center',gap:'5px',
              color:seccion===t.id?'var(--aura-lavender)':'var(--aura-gray)',
              fontWeight:seccion===t.id?'700':'400',
              borderBottom:seccion===t.id?'2px solid var(--aura-lavender)':'2px solid transparent'}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div style={{padding:'28px 40px'}}>

        {/* Encabezado de sección + botón agregar */}
        {seccion !== 'auditoria' && !SECCIONES_PROXIMAMENTE.includes(seccion) && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',margin:0,textTransform:'capitalize'}}>{seccion}</h3>
              <p style={{color:'#888',margin:0,fontSize:'0.83rem'}}>Gestión de {seccion} del sistema</p>
            </div>
            {SECCIONES_CON_CREAR.includes(seccion) && (
              <button onClick={abrirCrear} className="btn-AuraSpa" style={{padding:'10px 18px',display:'flex',alignItems:'center',gap:'6px',fontSize:'0.85rem'}}>
                <Plus size={15}/> Nuevo registro
              </button>
            )}
          </div>
        )}

        {cargando && <p style={{textAlign:'center',color:'var(--aura-gray)',padding:'40px'}}>Cargando...</p>}

        {/* Formulario (crear / editar) */}
        {modalOpen && SECCIONES_CON_CREAR.includes(seccion) && renderForm()}

        {/* ── SUCURSALES ── */}
        {seccion==='sucursales' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Dirección','Teléfono','Estado','Acciones']}/>
              <tbody>{filtrar(sucursales).map((s,i)=>(
                <tr key={s.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{s.nombre}</td><td style={tdS}>{s.direccion}</td>
                  <td style={tdS}>{s.telefono}</td><td style={tdS}><BadgeActivo activo={s.activo}/></td>
                  <Btns onEdit={()=>abrirEditar(s.id)} onDelete={()=>setConfirmDel({id:s.id,nombre:s.nombre})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── PERFILES (solo lectura) ── */}
        {seccion==='perfiles' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Descripción']}/>
              <tbody>{filtrar(perfiles).map((p,i)=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{p.nombre}</td><td style={tdS}>{p.descripcion}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── USUARIOS (activar/desactivar) ── */}
        {seccion==='usuarios' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Email','Perfil','Estado','Acciones']}/>
              <tbody>{filtrar(usuarios,'nombre').map((u,i)=>(
                <tr key={u.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{u.nombre} {u.apellido}</td><td style={tdS}>{u.email}</td><td style={tdS}>{u.perfil}</td>
                  <td style={tdS}><BadgeActivo activo={u.activo}/></td>
                  <td style={{padding:'10px 14px'}}>
                    <button onClick={()=>toggleUsuario(u.id)}
                      style={{background:u.activo?'#fef2f2':'#f0fdf4',border:'none',cursor:'pointer',color:u.activo?'#ef4444':'#22c55e',padding:'6px 14px',borderRadius:'20px',fontSize:'0.78rem',fontWeight:'600'}}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── EMPLEADOS ── */}
        {seccion==='empleados' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Documento','Tipo','Teléfono','Sucursal','Acciones']}/>
              <tbody>{filtrar(empleados,'nombres').map((e,i)=>(
                <tr key={e.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{e.nombres} {e.apellidos}</td><td style={tdS}>{e.documento}</td>
                  <td style={tdS}>{e.tipoEmpleado}</td><td style={tdS}>{e.telefono}</td><td style={tdS}>{e.sucursal}</td>
                  <td style={{padding:'10px 14px'}}>
                    <button onClick={()=>abrirEditar(e.id)} title="Editar" style={{background:'#f0ecff',border:'none',cursor:'pointer',color:'var(--aura-lavender)',padding:'5px 10px',borderRadius:'8px'}}><Edit size={13}/></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── SERVICIOS (solo lectura) ── */}
        {seccion==='servicios' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Categoría','Precio','Duración','Estado']}/>
              <tbody>{filtrar(servicios).map((s,i)=>(
                <tr key={s.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{s.nombre}</td><td style={tdS}>{s.categoria}</td>
                  <td style={tdS}>RD$ {s.precio.toLocaleString()}</td><td style={tdS}>{s.duracion} min</td>
                  <td style={tdS}><BadgeActivo activo={s.activo}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── INVENTARIO (solo lectura) ── */}
        {seccion==='inventario' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Producto','Categoría','Stock','Stock Mín.']}/>
              <tbody>{filtrar(inventario).map((item,i)=>(
                <tr key={item.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{item.nombre}</td><td style={tdS}>{item.categoria}</td>
                  <td style={tdS}><span style={{color:item.stock<=item.stockMinimo?'#ef4444':'inherit',fontWeight:item.stock<=item.stockMinimo?'700':'400'}}>{item.stock}</span></td>
                  <td style={tdS}>{item.stockMinimo}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── EXPEDIENTES ── */}
        {seccion==='expedientes' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Cliente','Tipo Piel','Alergias','Medicamentos','Notas','Estado','Acciones']}/>
              <tbody>{filtrar(expedientes,'cliente').map((e,i)=>(
                <tr key={e.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{e.cliente}</td><td style={tdS}>{e.tipoPiel}</td>
                  <td style={tdS}>{e.alergias}</td><td style={tdS}>{e.medicamentos}</td><td style={tdS}>{e.notas}</td>
                  <td style={tdS}><BadgeActivo activo={(e as any).activo??true}/></td>
                  <Btns onEdit={()=>abrirEditar(e.id)} onDelete={()=>setConfirmDel({id:e.id,nombre:e.cliente})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── PAQUETES Y CONSENTIMIENTO — próximamente ── */}
        {(seccion==='paquetes' || seccion==='consentimiento') && (
          <div className="card-aura" style={{padding:'60px',textAlign:'center'}}>
            <Clock size={40} color="#ccc" style={{marginBottom:'16px'}}/>
            <p style={{color:'var(--aura-gray)',fontWeight:'600',margin:0}}>Esta funcionalidad estará disponible próximamente.</p>
          </div>
        )}

        {/* ── AUDITORÍA (solo lectura) ── */}
        {seccion==='auditoria' && (
          <div>
            <div style={{marginBottom:'18px'}}>
              <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',margin:0}}>Auditoría del Sistema</h3>
              <p style={{color:'#888',margin:0,fontSize:'0.83rem'}}>Registro de cambios realizados — solo lectura</p>
            </div>
            <div className="card-aura" style={{overflow:'hidden',padding:0}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <TH cols={['Usuario','Acción','Valor Anterior','Valor Nuevo','Fecha']}/>
                <tbody>{auditoriaLog.map((a,i)=>(
                  <tr key={a.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                    <td style={tdB}>{a.usuario}</td><td style={tdS}>{a.accion}</td>
                    <td style={tdS}>{a.valorAnterior}</td><td style={tdS}>{a.valorNuevo}</td>
                    <td style={tdS}>{a.fecha}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Core;
