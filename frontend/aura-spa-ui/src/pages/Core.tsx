import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Shield, Users, UserCheck, Package,
  Stethoscope, Gift, FileCheck, ClipboardList, LogOut,
  Plus, Edit, Trash2, CheckCircle, X, Search, Save
} from 'lucide-react';

type Seccion = 'sucursales'|'perfiles'|'usuarios'|'empleados'|'servicios'|'inventario'|'expedientes'|'paquetes'|'consentimiento'|'auditoria';

// ── DATOS INICIALES ────────────────────────────────────────────────────────────
const INIT_SUCURSALES = [
  { id:1, nombre:'AuraSpa Piantini',    direccion:'Calle 2, Piantini',    telefono:'8091234567', activo:true  },
  { id:2, nombre:'AuraSpa Bella Vista', direccion:'Calle 2, Bella Vista', telefono:'8091234568', activo:true  },
];
const INIT_PERFILES = [
  { id:1, nombre:'Admin',        descripcion:'Acceso total al sistema'             },
  { id:2, nombre:'Cajero',       descripcion:'Ventas, caja y cotizaciones'         },
  { id:3, nombre:'Especialista', descripcion:'Citas, expedientes y galería'        },
  { id:4, nombre:'Cliente',      descripcion:'Portal web: citas, órdenes y perfil' },
];
const INIT_USUARIOS = [
  { id:1, nombre:'admin',    email:'admin@auraspa.com',    perfil:'Admin',        activo:true  },
  { id:2, nombre:'cajero',   email:'cajero@auraspa.com',   perfil:'Cajero',       activo:true  },
  { id:3, nombre:'nicole',   email:'nicole@auraspa.com',   perfil:'Especialista', activo:true  },
];
const INIT_EMPLEADOS = [
  { id:1, nombres:'Nicole',    apellidos:'Martínez', documento:'00200000001', tipoEmpleado:'Especialista', telefono:'8295550101', sucursal:'AuraSpa Piantini' },
  { id:2, nombres:'Valentina', apellidos:'Reyes',    documento:'00200000002', tipoEmpleado:'Especialista', telefono:'8295550102', sucursal:'AuraSpa Piantini' },
  { id:3, nombres:'Sofía',     apellidos:'Pérez',    documento:'00200000003', tipoEmpleado:'Cajero',       telefono:'8295550103', sucursal:'AuraSpa Bella Vista' },
];
const INIT_SERVICIOS = [
  { id:1, nombre:'Facial Hidratante',       categoria:'Facial',     precio:1800, duracion:60,  activo:true },
  { id:2, nombre:'Masaje Relajante 60min',  categoria:'Masaje',     precio:2500, duracion:60,  activo:true },
  { id:3, nombre:'Depilación Piernas',      categoria:'Depilación', precio:1200, duracion:45,  activo:true },
  { id:4, nombre:'Diseño de Cejas',         categoria:'Cejas',      precio:600,  duracion:30,  activo:true },
  { id:5, nombre:'Manicura Rusa',           categoria:'Uñas',       precio:1200, duracion:60,  activo:true },
  { id:6, nombre:'Keratina (por onza)',      categoria:'Pelo',       precio:350,  duracion:120, activo:true },
];
const INIT_INVENTARIO = [
  { id:1, nombre:'Crema Hidratante Facial', categoria:'Skincare',   stock:15, stockMinimo:5,  precio:850,  activo:true },
  { id:2, nombre:'Aceite de Masaje',        categoria:'Masajes',    stock:8,  stockMinimo:3,  precio:650,  activo:true },
  { id:3, nombre:'Cera para Depilación',    categoria:'Depilación', stock:2,  stockMinimo:5,  precio:450,  activo:true },
  { id:4, nombre:'Esmalte Semipermanente',  categoria:'Uñas',       stock:24, stockMinimo:10, precio:350,  activo:true },
];
const INIT_EXPEDIENTES = [
  { id:1, cliente:'Gabriela Duverge', alergias:'Ninguna', tipoPiel:'Mixta', medicamentos:'Ninguno', notas:'Prefiere masaje suave', activo:true },
  { id:2, cliente:'Diana Lantigua',   alergias:'Látex',   tipoPiel:'Seca',  medicamentos:'Ninguno', notas:'Piel sensible',         activo:true },
];
const INIT_PAQUETES = [
  { id:1, nombre:'Paquete Relajación Total', sesiones:5, sesionesUsadas:2, cliente:'Gabriela Duverge', vencimiento:'30/09/2026', activo:true },
  { id:2, nombre:'Paquete Facial Premium',   sesiones:3, sesionesUsadas:0, cliente:'Diana Lantigua',   vencimiento:'31/08/2026', activo:true },
];
const INIT_CONSENTIMIENTO = [
  { id:1, cliente:'Gabriela Duverge', servicio:'Facial Hidratante', fecha:'05/06/2026', estado:'Firmado'  },
  { id:2, cliente:'Diana Lantigua',   servicio:'Depilación Piernas',fecha:'01/06/2026', estado:'Firmado'  },
  { id:3, cliente:'Jorge Melo',       servicio:'Masaje Relajante',  fecha:'20/05/2026', estado:'Pendiente'},
];
const INIT_AUDITORIA = [
  { id:1, usuario:'admin',   accion:'Modificó precio de Facial Hidratante', valorAnterior:'RD$ 1,500.00', valorNuevo:'RD$ 1,800.00', fecha:'05/06/2026 09:15' },
  { id:2, usuario:'admin',   accion:'Creó nuevo empleado: Nicole Martínez',  valorAnterior:'—',            valorNuevo:'Especialista',  fecha:'04/06/2026 14:30' },
  { id:3, usuario:'cajero',  accion:'Modificó precio de Masaje Relajante',   valorAnterior:'RD$ 2,000.00', valorNuevo:'RD$ 2,500.00', fecha:'03/06/2026 11:00' },
];

// ── VALIDACIONES ───────────────────────────────────────────────────────────────
const soloLetras   = (v: string) => v.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]/g, '');
const soloNumeros  = (v: string) => v.replace(/\D/g, '').slice(0, 9);
const soloDecimal  = (v: string) => v.replace(/[^\d.]/g, '');
const soloEntero   = (v: string) => v.replace(/\D/g, '');

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
  const [guardadoOk, setGuardadoOk] = useState(false);

  const [sucursales,      setSucursales]      = useState(INIT_SUCURSALES);
  const [perfiles,        setPerfiles]        = useState(INIT_PERFILES);
  const [usuarios,        setUsuarios]        = useState(INIT_USUARIOS);
  const [empleados,       setEmpleados]       = useState(INIT_EMPLEADOS);
  const [servicios,       setServicios]       = useState(INIT_SERVICIOS);
  const [inventario,      setInventario]      = useState(INIT_INVENTARIO);
  const [expedientes,     setExpedientes]     = useState(INIT_EXPEDIENTES);
  const [paquetes,        setPaquetes]        = useState(INIT_PAQUETES);
  const [consentimientos, setConsentimientos] = useState(INIT_CONSENTIMIENTO);
  const [auditoriaLog, setAuditoriaLog] = useState(INIT_AUDITORIA);

  const registrarAuditoria = (accion: string, valorAnterior: string, valorNuevo: string) => {
    const nuevo = {
      id: Date.now(),
      usuario: user?.nombre || 'admin',
      accion,
      valorAnterior,
      valorNuevo,
      fecha: new Date().toLocaleString('es-DO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    };
    setAuditoriaLog(prev => [nuevo, ...prev]);
  };

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
      datos = { nombre:r.nombre, direccion:r.direccion, telefono:r.telefono };
    } else if (seccion==='perfiles') {
      const r = perfiles.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, descripcion:r.descripcion };
    } else if (seccion==='usuarios') {
      const r = usuarios.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, email:r.email, perfil:r.perfil };
    } else if (seccion==='empleados') {
      const r = empleados.find(x=>x.id===id)!;
      datos = { nombres:r.nombres, apellidos:r.apellidos, documento:r.documento, tipoEmpleado:r.tipoEmpleado, telefono:r.telefono, sucursal:r.sucursal };
    } else if (seccion==='servicios') {
      const r = servicios.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, categoria:r.categoria, precio:String(r.precio), duracion:String(r.duracion) };
    } else if (seccion==='inventario') {
      const r = inventario.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, categoria:r.categoria, stock:String(r.stock), stockMinimo:String(r.stockMinimo), precio:String(r.precio) };
    } else if (seccion==='expedientes') {
      const r = expedientes.find(x=>x.id===id)!;
      datos = { cliente:r.cliente, alergias:r.alergias, tipoPiel:r.tipoPiel, medicamentos:r.medicamentos, notas:r.notas };
    } else if (seccion==='paquetes') {
      const r = paquetes.find(x=>x.id===id)!;
      datos = { nombre:r.nombre, sesiones:String(r.sesiones), cliente:r.cliente, vencimiento:r.vencimiento };
    } else if (seccion==='consentimiento') {
      const r = consentimientos.find(x=>x.id===id)!;
      datos = { cliente:r.cliente, servicio:r.servicio, estado:r.estado };
    }
    setForm(datos);
    setModalOpen(true);
  };

  // Soft delete: marca activo=false en vez de borrar
  const softDelete = (id: number) => {
    if (seccion==='sucursales')  setSucursales(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='perfiles')    setPerfiles(p=>p.filter(x=>x.id!==id));
    if (seccion==='usuarios')    setUsuarios(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='empleados')   setEmpleados(p=>p.map(x=>x.id===id?{...x}:x).filter(x=>x.id!==id));
    if (seccion==='servicios')   setServicios(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='inventario')  setInventario(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='expedientes') setExpedientes(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='paquetes')    setPaquetes(p=>p.map(x=>x.id===id?{...x,activo:false}:x));
    if (seccion==='consentimiento') setConsentimientos(p=>p.filter(x=>x.id!==id));
    setConfirmDel(null);
  };

  const guardar = () => {
    const id = editId ?? Date.now();
    if (seccion==='sucursales') {
      if (editId) setSucursales(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,direccion:form.direccion||x.direccion,telefono:form.telefono||x.telefono}:x));
      else        setSucursales(p=>[...p,{id,nombre:form.nombre||'Nueva Sucursal',direccion:form.direccion||'',telefono:form.telefono||'',activo:true}]);
    } else if (seccion==='perfiles') {
      if (editId) setPerfiles(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,descripcion:form.descripcion||x.descripcion}:x));
      else        setPerfiles(p=>[...p,{id,nombre:form.nombre||'Nuevo Perfil',descripcion:form.descripcion||''}]);
    } else if (seccion==='usuarios') {
      if (editId) setUsuarios(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,email:form.email||x.email,perfil:form.perfil||x.perfil}:x));
      else        setUsuarios(p=>[...p,{id,nombre:form.nombre||'',email:form.email||'',perfil:form.perfil||'Cliente',activo:true}]);
    } else if (seccion==='empleados') {
      if (editId) setEmpleados(p=>p.map(x=>x.id===editId?{...x,...form,telefono:form.telefono||x.telefono}:x));
      else        setEmpleados(p=>[...p,{id,nombres:form.nombres||'',apellidos:form.apellidos||'',documento:form.documento||'',tipoEmpleado:form.tipoEmpleado||'Especialista',telefono:form.telefono||'',sucursal:form.sucursal||'AuraSpa Piantini'}]);
    } else if (seccion==='servicios') {
      if (editId) {
        const anterior = servicios.find(x=>x.id===editId);
        const nuevoPrecio = parseFloat(form.precio)||anterior?.precio||0;
        if (anterior && nuevoPrecio !== anterior.precio) {
          registrarAuditoria(
            `Modificó precio de ${anterior.nombre}`,
            `RD$ ${anterior.precio.toLocaleString('es-DO',{minimumFractionDigits:2})}`,
            `RD$ ${nuevoPrecio.toLocaleString('es-DO',{minimumFractionDigits:2})}`
          );
        }
        setServicios(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,categoria:form.categoria||x.categoria,precio:nuevoPrecio,duracion:parseInt(form.duracion)||x.duracion}:x));
      } else setServicios(p=>[...p,{id,nombre:form.nombre||'',categoria:form.categoria||'Facial',precio:parseFloat(form.precio)||0,duracion:parseInt(form.duracion)||60,activo:true}]);
    } else if (seccion==='inventario') {
      if (editId) {
        const anterior = inventario.find(x=>x.id===editId);
        const nuevoStock  = parseInt(form.stock)||anterior?.stock||0;
        const nuevoPrecio = parseFloat(form.precio)||anterior?.precio||0;
        if (anterior && nuevoStock !== anterior.stock) {
          registrarAuditoria(
            `Ajustó stock de ${anterior.nombre}`,
            `Stock: ${anterior.stock}`,
            `Stock: ${nuevoStock}`
          );
        }
        if (anterior && nuevoPrecio !== anterior.precio) {
          registrarAuditoria(
            `Modificó precio de ${anterior.nombre}`,
            `RD$ ${anterior.precio.toLocaleString('es-DO',{minimumFractionDigits:2})}`,
            `RD$ ${nuevoPrecio.toLocaleString('es-DO',{minimumFractionDigits:2})}`
          );
        }
        setInventario(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,categoria:form.categoria||x.categoria,stock:nuevoStock,stockMinimo:parseInt(form.stockMinimo)||x.stockMinimo,precio:nuevoPrecio}:x));
      } else setInventario(p=>[...p,{id,nombre:form.nombre||'',categoria:form.categoria||'General',stock:parseInt(form.stock)||0,stockMinimo:parseInt(form.stockMinimo)||5,precio:parseFloat(form.precio)||0,activo:true}]);
    } else if (seccion==='expedientes') {
      if (editId) setExpedientes(p=>p.map(x=>x.id===editId?{...x,alergias:form.alergias||x.alergias,tipoPiel:form.tipoPiel||x.tipoPiel,medicamentos:form.medicamentos||x.medicamentos,notas:form.notas||x.notas}:x));
      else        setExpedientes(p=>[...p,{id,cliente:form.cliente||'',alergias:form.alergias||'Ninguna',tipoPiel:form.tipoPiel||'Normal',medicamentos:form.medicamentos||'Ninguno',notas:form.notas||'',activo:true}]);
    } else if (seccion==='paquetes') {
      if (editId) setPaquetes(p=>p.map(x=>x.id===editId?{...x,nombre:form.nombre||x.nombre,sesiones:parseInt(form.sesiones)||x.sesiones,cliente:form.cliente||x.cliente,vencimiento:form.vencimiento||x.vencimiento}:x));
      else        setPaquetes(p=>[...p,{id,nombre:form.nombre||'',sesiones:parseInt(form.sesiones)||1,sesionesUsadas:0,cliente:form.cliente||'',vencimiento:form.vencimiento||'',activo:true}]);
    } else if (seccion==='consentimiento') {
      if (editId) setConsentimientos(p=>p.map(x=>x.id===editId?{...x,estado:form.estado||x.estado}:x));
      else        setConsentimientos(p=>[...p,{id,cliente:form.cliente||'',servicio:form.servicio||'',fecha:new Date().toLocaleDateString('es-DO'),estado:'Pendiente'}]);
    }
    setConfirmSave(false);
    setModalOpen(false);
    setEditId(null);
    setForm({});
    setGuardadoOk(true);
    setTimeout(()=>setGuardadoOk(false),2500);
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
    else if (seccion==='perfiles') campos = (
      <>
        <div style={{marginBottom:'14px'}}><label style={lS}>Nombre del perfil</label>
          <input value={form.nombre||''} onChange={e=>setF('nombre',soloLetras(e.target.value))} placeholder="Ej: Especialista" style={iS}/></div>
        <div style={{marginBottom:'14px'}}><label style={lS}>Descripción</label>
          <input value={form.descripcion||''} onChange={e=>setF('descripcion',e.target.value)} placeholder="Describe el rol" style={iS}/></div>
      </>
    );
    else if (seccion==='usuarios') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Usuario</label>
            <input value={form.nombre||''} onChange={e=>setF('nombre',e.target.value)} placeholder="nombre.usuario" style={iS}/></div>
          <div><label style={lS}>Email</label>
            <input type="email" value={form.email||''} onChange={e=>setF('email',e.target.value)} placeholder="usuario@auraspa.com" style={iS}/></div>
        </div>
        <div style={{marginBottom:'14px'}}><label style={lS}>Perfil</label>
          <select value={form.perfil||'Cliente'} onChange={e=>setF('perfil',e.target.value)} style={iS}>
            {['Admin','Cajero','Especialista','Cliente'].map(p=><option key={p}>{p}</option>)}
          </select></div>
        {!editId && <div style={{marginBottom:'14px'}}><label style={lS}>Contraseña temporal</label>
          <input type="password" value={form.password||''} onChange={e=>setF('password',e.target.value)} placeholder="Mín. 8 caracteres" style={iS}/></div>}
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
    else if (seccion==='servicios') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Nombre del servicio</label>
            <input value={form.nombre||''} onChange={e=>setF('nombre',e.target.value)} placeholder="Ej: Facial Hidratante" style={iS}/></div>
          <div><label style={lS}>Categoría</label>
            <select value={form.categoria||'Facial'} onChange={e=>setF('categoria',e.target.value)} style={iS}>
              {['Facial','Masaje','Depilación','Cejas','Uñas','Pelo'].map(c=><option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Precio (RD$)</label>
            <input value={form.precio||''} onChange={e=>setF('precio',soloDecimal(e.target.value))} placeholder="0.00" style={iS}/></div>
          <div><label style={lS}>Duración (minutos)</label>
            <input value={form.duracion||''} onChange={e=>setF('duracion',soloEntero(e.target.value))} placeholder="60" style={iS}/></div>
        </div>
      </>
    );
    else if (seccion==='inventario') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Nombre del producto</label>
            <input value={form.nombre||''} onChange={e=>setF('nombre',e.target.value)} placeholder="Ej: Crema Hidratante" style={iS}/></div>
          <div><label style={lS}>Categoría</label>
            <input value={form.categoria||''} onChange={e=>setF('categoria',soloLetras(e.target.value))} placeholder="Skincare" style={iS}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Stock actual</label>
            <input value={form.stock||''} onChange={e=>setF('stock',soloEntero(e.target.value))} placeholder="0" style={iS}/></div>
          <div><label style={lS}>Stock mínimo</label>
            <input value={form.stockMinimo||''} onChange={e=>setF('stockMinimo',soloEntero(e.target.value))} placeholder="5" style={iS}/></div>
          <div><label style={lS}>Precio (RD$)</label>
            <input value={form.precio||''} onChange={e=>setF('precio',soloDecimal(e.target.value))} placeholder="0.00" style={iS}/></div>
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
    else if (seccion==='paquetes') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Nombre del paquete</label>
            <input value={form.nombre||''} onChange={e=>setF('nombre',e.target.value)} placeholder="Ej: Paquete Relajación" style={iS}/></div>
          <div><label style={lS}>Número de sesiones</label>
            <input value={form.sesiones||''} onChange={e=>setF('sesiones',soloEntero(e.target.value))} placeholder="5" style={iS}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Cliente</label>
            <input value={form.cliente||''} onChange={e=>setF('cliente',soloLetras(e.target.value))} placeholder="Nombre del cliente" style={iS}/></div>
          <div><label style={lS}>Fecha de vencimiento</label>
            <input value={form.vencimiento||''} onChange={e=>setF('vencimiento',e.target.value)} placeholder="DD/MM/AAAA" style={iS}/></div>
        </div>
      </>
    );
    else if (seccion==='consentimiento') campos = (
      <>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div><label style={lS}>Cliente</label>
            <input value={form.cliente||''} onChange={e=>setF('cliente',soloLetras(e.target.value))} placeholder="Nombre del cliente" style={iS} readOnly={!!editId}/></div>
          <div><label style={lS}>Servicio</label>
            <input value={form.servicio||''} onChange={e=>setF('servicio',e.target.value)} placeholder="Servicio a realizar" style={iS} readOnly={!!editId}/></div>
        </div>
        <div style={{marginBottom:'14px'}}><label style={lS}>Estado</label>
          <select value={form.estado||'Pendiente'} onChange={e=>setF('estado',e.target.value)} style={iS}>
            {['Pendiente','Firmado','Rechazado'].map(s=><option key={s}>{s}</option>)}
          </select></div>
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

      {/* ── Toast éxito ── */}
      {guardadoOk && (
        <div style={{position:'fixed',top:'20px',right:'20px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'14px',padding:'14px 20px',zIndex:3000,display:'flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
          <CheckCircle size={18} color="#22c55e"/>
          <span style={{color:'#16a34a',fontWeight:'600',fontSize:'0.9rem'}}>Guardado correctamente.</span>
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
        {seccion !== 'auditoria' && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <h3 style={{color:'var(--aura-navy)',fontWeight:'bold',margin:0,textTransform:'capitalize'}}>{seccion}</h3>
              <p style={{color:'#888',margin:0,fontSize:'0.83rem'}}>Gestión de {seccion} del sistema</p>
            </div>
            <button onClick={abrirCrear} className="btn-AuraSpa" style={{padding:'10px 18px',display:'flex',alignItems:'center',gap:'6px',fontSize:'0.85rem'}}>
              <Plus size={15}/> Nuevo registro
            </button>
          </div>
        )}

        {/* Formulario (crear / editar) */}
        {modalOpen && seccion !== 'auditoria' && renderForm()}

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

        {/* ── PERFILES ── */}
        {seccion==='perfiles' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Descripción','Acciones']}/>
              <tbody>{filtrar(perfiles).map((p,i)=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{p.nombre}</td><td style={tdS}>{p.descripcion}</td>
                  <Btns onEdit={()=>abrirEditar(p.id)} onDelete={()=>setConfirmDel({id:p.id,nombre:p.nombre})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {seccion==='usuarios' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Usuario','Email','Perfil','Estado','Acciones']}/>
              <tbody>{filtrar(usuarios,'nombre').map((u,i)=>(
                <tr key={u.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{u.nombre}</td><td style={tdS}>{u.email}</td><td style={tdS}>{u.perfil}</td>
                  <td style={tdS}><BadgeActivo activo={u.activo}/></td>
                  <Btns onEdit={()=>abrirEditar(u.id)} onDelete={()=>setConfirmDel({id:u.id,nombre:u.nombre})}/>
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
                  <Btns onEdit={()=>abrirEditar(e.id)} onDelete={()=>setConfirmDel({id:e.id,nombre:e.nombres+' '+e.apellidos})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {seccion==='servicios' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Nombre','Categoría','Precio','Duración','Estado','Acciones']}/>
              <tbody>{filtrar(servicios).map((s,i)=>(
                <tr key={s.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{s.nombre}</td><td style={tdS}>{s.categoria}</td>
                  <td style={tdS}>RD$ {s.precio.toLocaleString()}</td><td style={tdS}>{s.duracion} min</td>
                  <td style={tdS}><BadgeActivo activo={s.activo}/></td>
                  <Btns onEdit={()=>abrirEditar(s.id)} onDelete={()=>setConfirmDel({id:s.id,nombre:s.nombre})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── INVENTARIO ── */}
        {seccion==='inventario' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Producto','Categoría','Stock','Stock Mín.','Precio','Estado','Acciones']}/>
              <tbody>{filtrar(inventario).map((item,i)=>(
                <tr key={item.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{item.nombre}</td><td style={tdS}>{item.categoria}</td>
                  <td style={tdS}><span style={{color:item.stock<=item.stockMinimo?'#ef4444':'inherit',fontWeight:item.stock<=item.stockMinimo?'700':'400'}}>{item.stock}</span></td>
                  <td style={tdS}>{item.stockMinimo}</td><td style={tdS}>RD$ {item.precio.toLocaleString()}</td>
                  <td style={tdS}><BadgeActivo activo={(item as any).activo??true}/></td>
                  <Btns onEdit={()=>abrirEditar(item.id)} onDelete={()=>setConfirmDel({id:item.id,nombre:item.nombre})}/>
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

        {/* ── PAQUETES ── */}
        {seccion==='paquetes' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Paquete','Cliente','Sesiones','Usadas','Restantes','Vencimiento','Estado','Acciones']}/>
              <tbody>{filtrar(paquetes).map((p,i)=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{p.nombre}</td><td style={tdS}>{p.cliente}</td>
                  <td style={tdS}>{p.sesiones}</td><td style={tdS}>{p.sesionesUsadas}</td>
                  <td style={tdS}><strong style={{color:'var(--aura-lavender)'}}>{p.sesiones-p.sesionesUsadas}</strong></td>
                  <td style={tdS}>{p.vencimiento}</td>
                  <td style={tdS}><BadgeActivo activo={(p as any).activo??true}/></td>
                  <Btns onEdit={()=>abrirEditar(p.id)} onDelete={()=>setConfirmDel({id:p.id,nombre:p.nombre})}/>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {/* ── CONSENTIMIENTO ── */}
        {seccion==='consentimiento' && (
          <div className="card-aura" style={{overflow:'hidden',padding:0}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <TH cols={['Cliente','Servicio','Fecha','Estado','Acciones']}/>
              <tbody>{filtrar(consentimientos,'cliente').map((c,i)=>(
                <tr key={c.id} style={{borderBottom:'1px solid #f0edf5',background:i%2===0?'white':'#faf9ff'}}>
                  <td style={tdB}>{c.cliente}</td><td style={tdS}>{c.servicio}</td><td style={tdS}>{c.fecha}</td>
                  <td style={tdS}>
                    <span style={{background:c.estado==='Firmado'?'#f0fdf4':c.estado==='Rechazado'?'#fef2f2':'#fffbeb',
                      color:c.estado==='Firmado'?'#22c55e':c.estado==='Rechazado'?'#ef4444':'#f59e0b',
                      padding:'3px 10px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:'600'}}>{c.estado}</span>
                  </td>
                  <Btns onEdit={()=>abrirEditar(c.id)} onDelete={()=>setConfirmDel({id:c.id,nombre:c.cliente})}/>
                </tr>
              ))}</tbody>
            </table>
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
