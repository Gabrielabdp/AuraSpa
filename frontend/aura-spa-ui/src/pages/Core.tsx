import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Shield, Users, UserCheck, Package,
  Stethoscope, Gift, FileCheck, ClipboardList, LogOut,
  Plus, Edit, Trash2, CheckCircle, X
} from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type Seccion = 'sucursales' | 'perfiles' | 'usuarios' | 'empleados' | 'servicios' | 'inventario' | 'expedientes' | 'paquetes' | 'consentimiento' | 'auditoria';

// ── DATOS HARDCODEADOS ─────────────────────────────────────────────────────────
const DATA_SUCURSALES = [
  { id: 1, nombre: 'AuraSpa Piantini', direccion: 'Calle 2, Piantini', telefono: '809-123-4567', activo: true },
  { id: 2, nombre: 'AuraSpa Bella Vista', direccion: 'Calle 2, Bella Vista', telefono: '809-123-4568', activo: true },
];

const DATA_PERFILES = [
  { id: 1, nombre: 'Admin', descripcion: 'Acceso total al sistema' },
  { id: 2, nombre: 'Recepcionista', descripcion: 'Recibe a los clientes y gestiona citas' },
  { id: 3, nombre: 'Especialista', descripcion: 'Realiza los servicios estéticos' },
  { id: 4, nombre: 'Cliente', descripcion: 'Clientes de AuraSpa' },
];

const DATA_USUARIOS = [
  { id: 1, nombre: 'admin', email: 'admin@auraspa.com', perfil: 'Admin', activo: true },
  { id: 2, nombre: 'gduverge', email: 'gduverge@auraspa.com', perfil: 'Especialista', activo: true },
  { id: 3, nombre: 'dlantigua', email: 'dlantigua@auraspa.com', perfil: 'Recepcionista', activo: true },
];

const DATA_EMPLEADOS = [
  { id: 1, nombres: 'Laura', apellidos: 'De la Cruz', documento: '001-0000000-1', especialidad: 'Administrador', telefono: '809-555-0001', sucursal: 'AuraSpa Piantini' },
  { id: 2, nombres: 'María', apellidos: 'Rodríguez', documento: '402-0000000-2', especialidad: 'Nail Artist', telefono: '809-555-0002', sucursal: 'AuraSpa Bella Vista' },
  { id: 3, nombres: 'Nicole', apellidos: 'Martínez', documento: '402-0000000-3', especialidad: 'Faciales', telefono: '809-555-0003', sucursal: 'AuraSpa Piantini' },
];

const DATA_SERVICIOS = [
  { id: 1, nombre: 'Facial Hidratante', categoria: 'Facial', precio: 1800, duracion: 60, activo: true },
  { id: 2, nombre: 'Masaje Relajante', categoria: 'Masaje', precio: 2500, duracion: 60, activo: true },
  { id: 3, nombre: 'Depilación Piernas', categoria: 'Depilación', precio: 1200, duracion: 45, activo: true },
  { id: 4, nombre: 'Diseño de Cejas', categoria: 'Cejas', precio: 600, duracion: 30, activo: true },
  { id: 5, nombre: 'Manicura Semipermanente', categoria: 'Uñas', precio: 900, duracion: 50, activo: true },
  { id: 6, nombre: 'Tinte y Corte', categoria: 'Pelo', precio: 3500, duracion: 120, activo: true },
];

const DATA_INVENTARIO = [
  { id: 1, nombre: 'Crema Hidratante Facial', categoria: 'Skincare', stock: 15, stockMinimo: 5, precio: 850 },
  { id: 2, nombre: 'Aceite de Masaje Relajante', categoria: 'Masajes', stock: 8, stockMinimo: 3, precio: 650 },
  { id: 3, nombre: 'Cera para Depilación', categoria: 'Depilación', stock: 2, stockMinimo: 5, precio: 450 },
  { id: 4, nombre: 'Esmalte Semipermanente', categoria: 'Uñas', stock: 24, stockMinimo: 10, precio: 350 },
];

const DATA_EXPEDIENTES = [
  { id: 1, cliente: 'Gabriela Duverge', alergias: 'Ninguna', tipoPiel: 'Mixta', ultimaVisita: '05/06/2026' },
  { id: 2, cliente: 'Diana Lantigua', alergias: 'Látex', tipoPiel: 'Seca', ultimaVisita: '01/06/2026' },
];

const DATA_PAQUETES = [
  { id: 1, nombre: 'Paquete Relajación Total', sesiones: 5, sesionesUsadas: 2, cliente: 'Gabriela Duverge', vencimiento: '30/09/2026' },
  { id: 2, nombre: 'Paquete Facial Premium', sesiones: 3, sesionesUsadas: 0, cliente: 'Diana Lantigua', vencimiento: '31/08/2026' },
];

const DATA_CONSENTIMIENTO = [
  { id: 1, cliente: 'Gabriela Duverge', servicio: 'Facial Hidratante', fecha: '05/06/2026', estado: 'Firmado' },
  { id: 2, cliente: 'Diana Lantigua', servicio: 'Depilación Piernas', fecha: '01/06/2026', estado: 'Firmado' },
  { id: 3, cliente: 'Jorge Melo', servicio: 'Masaje Relajante', fecha: '20/05/2026', estado: 'Pendiente' },
];

const DATA_AUDITORIA = [
  { id: 1, usuario: 'admin', accion: 'Modificó precio de Facial Hidratante', valorAnterior: 'RD$ 1,500.00', valorNuevo: 'RD$ 1,800.00', fecha: '05/06/2026 09:15' },
  { id: 2, usuario: 'admin', accion: 'Creó nuevo empleado: Nicole Martínez', valorAnterior: '—', valorNuevo: 'Especialista Faciales', fecha: '04/06/2026 14:30' },
  { id: 3, usuario: 'gduverge', accion: 'Modificó precio de Masaje Relajante', valorAnterior: 'RD$ 2,000.00', valorNuevo: 'RD$ 2,500.00', fecha: '03/06/2026 11:00' },
];

// ── ESTILOS ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 15px', borderRadius: '15px', border: '1px solid #e8e0f5', outline: 'none', background: '#fcfcfc', fontSize: '0.88rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--aura-gray)', fontWeight: '500' };

// ── COMPONENTES REUTILIZABLES (fuera del componente principal) ─────────────────
const BadgeActivo: React.FC<{ activo: boolean }> = ({ activo }) => (
  <span style={{ background: activo ? '#f0fdf4' : '#fef2f2', color: activo ? '#22c55e' : '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
    {activo ? 'Activo' : 'Inactivo'}
  </span>
);

const TableHeader: React.FC<{ cols: string[] }> = ({ cols }) => (
  <thead>
    <tr style={{ background: '#EDE8F5' }}>
      {cols.map(h => (
        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--aura-navy)', borderBottom: '2px solid #e8e0f5', fontSize: '0.85rem' }}>{h}</th>
      ))}
    </tr>
  </thead>
);

const AccionBtn: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <td style={{ padding: '10px 14px' }}>
    <div style={{ display: 'flex', gap: '6px' }}>
      <button onClick={onEdit} style={{ background: '#f0ecff', border: 'none', cursor: 'pointer', color: 'var(--aura-lavender)', padding: '5px 10px', borderRadius: '8px' }}>
        <Edit size={14} />
      </button>
      <button onClick={onDelete} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '5px 10px', borderRadius: '8px' }}>
        <Trash2 size={14} />
      </button>
    </div>
  </td>
);

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const Core: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<Seccion>('sucursales');
  const [_search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const tabs = [
    { id: 'sucursales',    label: 'Sucursales',    icono: <Building2 size={15} /> },
    { id: 'perfiles',      label: 'Perfiles',      icono: <Shield size={15} /> },
    { id: 'usuarios',      label: 'Usuarios',      icono: <Users size={15} /> },
    { id: 'empleados',     label: 'Empleados',     icono: <UserCheck size={15} /> },
    { id: 'servicios',     label: 'Servicios',     icono: <ClipboardList size={15} /> },
    { id: 'inventario',    label: 'Inventario',    icono: <Package size={15} /> },
    { id: 'expedientes',   label: 'Expedientes',   icono: <Stethoscope size={15} /> },
    { id: 'paquetes',      label: 'Paquetes',      icono: <Gift size={15} /> },
    { id: 'consentimiento',label: 'Consentimiento',icono: <FileCheck size={15} /> },
    { id: 'auditoria',     label: 'Auditoría',     icono: <ClipboardList size={15} /> },
  ];

  const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '0.85rem', color: 'var(--aura-gray)' };
  const tdBold: React.CSSProperties = { ...tdStyle, fontWeight: '600', color: 'var(--aura-navy)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0edf5', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>
            AuraSpa <span style={{ color: 'var(--aura-lavender)' }}>Core</span>
          </h2>
          <span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
            Panel Administrativo
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--aura-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
              {user?.nombre?.[0] || 'A'}
            </div>
            <span style={{ fontWeight: '500', color: 'var(--aura-navy)', fontSize: '0.88rem' }}>{user?.nombre}</span>
          </div>
          <button onClick={() => navigate('/dashboard/staff')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aura-gray)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0edf5', padding: '0 40px', display: 'flex', gap: '2px', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => { setSeccion(tab.id as Seccion); setSearch(''); setModalOpen(false); }}
            style={{ padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: seccion === tab.id ? 'var(--aura-lavender)' : 'var(--aura-gray)', fontWeight: seccion === tab.id ? '700' : '400', fontSize: '0.82rem', whiteSpace: 'nowrap', borderBottom: seccion === tab.id ? '2px solid var(--aura-lavender)' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
            {tab.icono} {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ padding: '30px 40px' }}>

        {/* ── SUCURSALES ── */}
        {seccion === 'sucursales' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Sucursales</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Gestión de sucursales del sistema</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nueva Sucursal
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nueva Sucursal</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aura-gray)' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombre</label><input type="text" placeholder="Nombre de la sucursal" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Teléfono</label><input type="text" placeholder="809-000-0000" style={inputStyle} /></div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Dirección</label>
                  <input type="text" placeholder="Dirección completa" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Sucursal</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Nombre', 'Dirección', 'Teléfono', 'Estado', 'Acciones']} />
                <tbody>
                  {DATA_SUCURSALES.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{s.id}</td>
                      <td style={tdBold}>{s.nombre}</td>
                      <td style={tdStyle}>{s.direccion}</td>
                      <td style={tdStyle}>{s.telefono}</td>
                      <td style={tdStyle}><BadgeActivo activo={s.activo} /></td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PERFILES ── */}
        {seccion === 'perfiles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Perfiles y Roles</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Define los roles de acceso al sistema</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Perfil
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Perfil</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ marginBottom: '15px' }}><label style={labelStyle}>Nombre</label><input type="text" placeholder="Nombre del perfil" style={inputStyle} /></div>
                <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Descripción</label><input type="text" placeholder="Descripción del perfil" style={inputStyle} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Perfil</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Nombre', 'Descripción', 'Acciones']} />
                <tbody>
                  {DATA_PERFILES.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{p.id}</td>
                      <td style={tdBold}>{p.nombre}</td>
                      <td style={tdStyle}>{p.descripcion}</td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {seccion === 'usuarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Usuarios</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Gestión de cuentas de usuario del sistema</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Usuario
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Usuario</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombre de Usuario</label><input type="text" placeholder="nombre.usuario" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Email</label><input type="email" placeholder="correo@auraspa.com" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Contraseña temporal</label><input type="password" placeholder="Mínimo 8 caracteres" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Perfil</label>
                    <select style={inputStyle}>
                      {DATA_PERFILES.map(p => <option key={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Usuario</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Usuario', 'Email', 'Perfil', 'Estado', 'Acciones']} />
                <tbody>
                  {DATA_USUARIOS.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{u.id}</td>
                      <td style={tdBold}>{u.nombre}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}><span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{u.perfil}</span></td>
                      <td style={tdStyle}><BadgeActivo activo={u.activo} /></td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EMPLEADOS ── */}
        {seccion === 'empleados' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Empleados</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Registro del personal del spa</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Empleado
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Empleado</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombres</label><input type="text" placeholder="Nombres" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Apellidos</label><input type="text" placeholder="Apellidos" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Documento</label><input type="text" placeholder="000-0000000-0" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Teléfono</label><input type="text" placeholder="809-000-0000" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Especialidad</label>
                    <select style={inputStyle}>
                      <option>Faciales</option><option>Masajes</option><option>Depilación</option>
                      <option>Cejas y Pestañas</option><option>Uñas</option><option>Pelo</option><option>Administrador</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Sucursal</label>
                  <select style={inputStyle}>
                    {DATA_SUCURSALES.map(s => <option key={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Empleado</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Nombres', 'Apellidos', 'Documento', 'Especialidad', 'Teléfono', 'Sucursal', 'Acciones']} />
                <tbody>
                  {DATA_EMPLEADOS.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{e.id}</td>
                      <td style={tdBold}>{e.nombres}</td>
                      <td style={tdStyle}>{e.apellidos}</td>
                      <td style={tdStyle}>{e.documento}</td>
                      <td style={tdStyle}><span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{e.especialidad}</span></td>
                      <td style={tdStyle}>{e.telefono}</td>
                      <td style={tdStyle}>{e.sucursal}</td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SERVICIOS ── */}
        {seccion === 'servicios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Catálogo de Servicios</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Gestión de servicios con duración estimada</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Servicio
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Servicio</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombre</label><input type="text" placeholder="Nombre del servicio" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Categoría</label>
                    <select style={inputStyle}>
                      <option>Facial</option><option>Masaje</option><option>Depilación</option>
                      <option>Cejas y Pestañas</option><option>Uñas</option><option>Pelo</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Precio (RD$)</label><input type="text" placeholder="0.00" style={inputStyle} /></div>
                  {/* INC-K05: duración estimada obligatoria */}
                  <div><label style={labelStyle}>Duración (minutos) *</label><input type="text" placeholder="Ej: 60" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Servicio</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Nombre', 'Categoría', 'Precio', 'Duración', 'Estado', 'Acciones']} />
                <tbody>
                  {DATA_SERVICIOS.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{s.id}</td>
                      <td style={tdBold}>{s.nombre}</td>
                      <td style={tdStyle}><span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{s.categoria}</span></td>
                      <td style={tdStyle}>RD$ {s.precio.toLocaleString('es-DO')}</td>
                      <td style={tdStyle}>{s.duracion} min</td>
                      <td style={tdStyle}><BadgeActivo activo={s.activo} /></td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── INVENTARIO ── */}
        {seccion === 'inventario' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Inventario</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Control de stock de productos</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Producto
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Producto</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombre</label><input type="text" placeholder="Nombre del producto" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Categoría</label><input type="text" placeholder="Ej: Skincare" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Stock inicial</label><input type="text" placeholder="0" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Stock mínimo</label><input type="text" placeholder="0" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Precio (RD$)</label><input type="text" placeholder="0.00" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Producto</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Nombre', 'Categoría', 'Stock', 'Stock Mínimo', 'Precio', 'Estado', 'Acciones']} />
                <tbody>
                  {DATA_INVENTARIO.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{item.id}</td>
                      <td style={tdBold}>{item.nombre}</td>
                      <td style={tdStyle}>{item.categoria}</td>
                      {/* INC-K01: stock real que se descuenta al vender */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '700', color: item.stock <= item.stockMinimo ? '#ef4444' : 'var(--aura-navy)' }}>{item.stock}</span>
                      </td>
                      <td style={tdStyle}>{item.stockMinimo}</td>
                      <td style={tdStyle}>RD$ {item.precio.toLocaleString('es-DO')}</td>
                      <td style={tdStyle}>
                        <span style={{ background: item.stock <= item.stockMinimo ? '#fef2f2' : '#f0fdf4', color: item.stock <= item.stockMinimo ? '#ef4444' : '#22c55e', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                          {item.stock <= item.stockMinimo ? '⚠ Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXPEDIENTES ── */}
        {seccion === 'expedientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Expedientes Clínicos</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Historial médico básico de clientes — INC-K06</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Expediente
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Expediente Clínico</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Cliente</label>
                    <select style={inputStyle}><option>Gabriela Duverge</option><option>Diana Lantigua</option><option>Jorge Melo</option></select>
                  </div>
                  <div><label style={labelStyle}>Tipo de Piel</label>
                    <select style={inputStyle}><option>Normal</option><option>Seca</option><option>Mixta</option><option>Grasa</option><option>Sensible</option></select>
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Alergias conocidas</label>
                  <input type="text" placeholder="Ej: Látex, fragancias, etc." style={inputStyle} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Observaciones adicionales</label>
                  <textarea placeholder="Condiciones médicas relevantes..." rows={3} style={{ ...inputStyle, resize: 'none' as const }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Expediente</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Cliente', 'Alergias', 'Tipo de Piel', 'Última Visita', 'Acciones']} />
                <tbody>
                  {DATA_EXPEDIENTES.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{e.id}</td>
                      <td style={tdBold}>{e.cliente}</td>
                      <td style={tdStyle}><span style={{ background: e.alergias === 'Ninguna' ? '#f0fdf4' : '#fef2f2', color: e.alergias === 'Ninguna' ? '#22c55e' : '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{e.alergias}</span></td>
                      <td style={tdStyle}>{e.tipoPiel}</td>
                      <td style={tdStyle}>{e.ultimaVisita}</td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAQUETES ── */}
        {seccion === 'paquetes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Paquetes y Sesiones</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Control de paquetes adquiridos y saldo de sesiones — INC-K08</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Paquete
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Nuevo Paquete</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Nombre del Paquete</label><input type="text" placeholder="Ej: Paquete Relajación Total" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Cliente</label>
                    <select style={inputStyle}><option>Gabriela Duverge</option><option>Diana Lantigua</option><option>Jorge Melo</option></select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div><label style={labelStyle}>Total de Sesiones</label><input type="text" placeholder="Ej: 5" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Fecha de Vencimiento</label><input type="date" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Guardar Paquete</button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Paquete', 'Cliente', 'Sesiones', 'Usadas', 'Restantes', 'Vencimiento', 'Acciones']} />
                <tbody>
                  {DATA_PAQUETES.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{p.id}</td>
                      <td style={tdBold}>{p.nombre}</td>
                      <td style={tdStyle}>{p.cliente}</td>
                      <td style={tdStyle}>{p.sesiones}</td>
                      <td style={tdStyle}>{p.sesionesUsadas}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '700', color: 'var(--aura-lavender)' }}>{p.sesiones - p.sesionesUsadas}</span>
                      </td>
                      <td style={tdStyle}>{p.vencimiento}</td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONSENTIMIENTO ── */}
        {seccion === 'consentimiento' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div><h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Consentimientos Informados</h3>
                <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Registro de aceptación de procedimientos — INC-K09</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="btn-AuraSpa" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Nuevo Consentimiento
              </button>
            </div>
            {modalOpen && (
              <div className="card-aura" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid var(--aura-lavender)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: 0 }}>Registrar Consentimiento</h4>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div><label style={labelStyle}>Cliente</label>
                    <select style={inputStyle}><option>Gabriela Duverge</option><option>Diana Lantigua</option><option>Jorge Melo</option></select>
                  </div>
                  <div><label style={labelStyle}>Servicio</label>
                    <select style={inputStyle}><option>Facial Hidratante</option><option>Masaje Relajante</option><option>Depilación Piernas</option></select>
                  </div>
                </div>
                <div style={{ background: '#f8f6ff', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--aura-navy)', fontWeight: '600', marginBottom: '8px' }}>Texto del Consentimiento:</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--aura-gray)', margin: 0 }}>
                    Yo, el/la cliente, declaro haber sido informado/a sobre el procedimiento a realizar, sus riesgos y beneficios. Acepto someterme al tratamiento de forma voluntaria y confirmo haber informado sobre mis condiciones de salud relevantes.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-AuraSpa" style={{ padding: '10px 25px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Confirmar Aceptación
                  </button>
                  <button onClick={() => setModalOpen(false)} className="btn-outline-aura" style={{ padding: '10px 25px' }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Cliente', 'Servicio', 'Fecha', 'Estado', 'Acciones']} />
                <tbody>
                  {DATA_CONSENTIMIENTO.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{c.id}</td>
                      <td style={tdBold}>{c.cliente}</td>
                      <td style={tdStyle}>{c.servicio}</td>
                      <td style={tdStyle}>{c.fecha}</td>
                      <td style={tdStyle}>
                        <span style={{ background: c.estado === 'Firmado' ? '#f0fdf4' : '#fffbeb', color: c.estado === 'Firmado' ? '#22c55e' : '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                          {c.estado}
                        </span>
                      </td>
                      <AccionBtn onEdit={() => {}} onDelete={() => {}} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDITORÍA ── */}
        {seccion === 'auditoria' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Auditoría de Cambios</h3>
              <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.85rem' }}>Registro de modificaciones en precios y configuraciones críticas — INC-K10</p>
            </div>
            <div className="card-aura" style={{ padding: '25px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div><label style={labelStyle}>Usuario</label>
                  <select style={inputStyle}><option>Todos</option><option>admin</option><option>gduverge</option></select>
                </div>
                <div><label style={labelStyle}>Fecha Desde</label><input type="date" style={inputStyle} /></div>
                <div><label style={labelStyle}>Fecha Hasta</label><input type="date" style={inputStyle} /></div>
              </div>
              <button className="btn-AuraSpa" style={{ padding: '10px 25px' }}>Filtrar</button>
            </div>
            <div className="card-aura" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['ID', 'Usuario', 'Acción', 'Valor Anterior', 'Valor Nuevo', 'Fecha y Hora']} />
                <tbody>
                  {DATA_AUDITORIA.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f0edf5', background: i % 2 === 0 ? 'white' : '#faf9ff' }}>
                      <td style={tdStyle}>{a.id}</td>
                      <td style={tdStyle}><span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{a.usuario}</span></td>
                      <td style={tdBold}>{a.accion}</td>
                      <td style={tdStyle}><span style={{ color: '#ef4444' }}>{a.valorAnterior}</span></td>
                      <td style={tdStyle}><span style={{ color: '#22c55e' }}>{a.valorNuevo}</span></td>
                      <td style={tdStyle}>{a.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Core;
