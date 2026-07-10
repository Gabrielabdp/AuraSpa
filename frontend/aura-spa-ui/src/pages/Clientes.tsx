import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User, Phone, Mail, FileText, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

interface Cliente {
  idCliente: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  numeroDocumento?: string;
  fechaRegistro?: string;
}

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalAgregar, setModalAgregar] = useState(false);

  // Formulario nuevo cliente — INC-W25
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/auth/clientes');
      setClientes(res.data);
    } catch {
      setError('No se pudo cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError('');
    try {
      // INC-W25: registro manual de cliente por parte del staff
      await apiClient.post('/api/auth/register', {
        nombre, apellido, email, telefono,
        password: 'AuraSpa2026!', // contraseña temporal
        nombrePerfil: 'Cliente',
      });
      setModalAgregar(false);
      setNombre(''); setApellido(''); setEmail(''); setTelefono('');
      fetchClientes(); // Recargar la lista
      fetchClientes();
    } catch (err: any) {
      const msg = err.response?.data;
      setFormError(typeof msg === 'string' ? msg : 'Error al registrar el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    `${c.nombres} ${c.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.email?.toLowerCase().includes(search.toLowerCase())) ||
    (c.numeroDocumento?.includes(search))
  );

  const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', background: '#fcfcfc', fontSize: '0.9rem' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 8%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Clientes</h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Gestión de la base de datos de clientes</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-AuraSpa" onClick={() => setModalAgregar(true)} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Nuevo Cliente
          </button>
          <button onClick={() => navigate('/dashboard/staff')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>← Volver</button>
        </div>
      </div>

      <div className="card-aura" style={{ padding: '20px 25px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Search size={18} color="var(--aura-gray)" />
        <input type="text" placeholder="Buscar por nombre, correo o cédula..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', background: 'transparent' }} />
        <span style={{ color: 'var(--aura-gray)', fontSize: '0.82rem' }}>{clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} style={{ color: 'var(--aura-lavender)' }} /></div>}
      {error && (
        <div style={{ padding: '20px', background: '#fff9e6', borderRadius: '15px', color: '#855', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clientesFiltrados.length === 0 ? (
            <div className="card-aura" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--aura-gray)' }}>No se encontraron clientes.</p>
            </div>
          ) : clientesFiltrados.map(c => (
            <div key={c.idCliente} className="card-aura" style={{ padding: '20px 25px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--aura-lavender-light)', padding: '14px', borderRadius: '50%', color: 'var(--aura-navy)', flexShrink: 0 }}>
                <User size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', margin: '0 0 4px', color: 'var(--aura-navy)', fontSize: '0.95rem' }}>{c.nombres} {c.apellidos}</h4>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.82rem' }}><Mail size={13} />{c.email}</span>
                  {c.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.82rem' }}><Phone size={13} />{c.telefono}</span>}
                  {c.numeroDocumento && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.82rem' }}><FileText size={13} />{c.numeroDocumento}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar Cliente */}
      {modalAgregar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card-aura" style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: '30px' }}>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Registrar nuevo cliente</h3>
            {formError && <p style={{ color: '#c62828', background: '#ffebee', padding: '10px 15px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px' }}>{formError}</p>}
            <form onSubmit={handleAgregar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.85rem' }}>Nombre</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.85rem' }}>Apellido</label>
                  <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.85rem' }}>Teléfono</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required style={inputStyle} placeholder="809-555-0000" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.85rem' }}>Correo electrónico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
              </div>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '20px' }}>Se asignará una contraseña temporal: <strong>AuraSpa2026!</strong> — El cliente debe cambiarla en su primer acceso.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-AuraSpa" style={{ flex: 1, padding: '12px' }} disabled={guardando}>
                  {guardando ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : 'Registrar'}
                </button>
                <button type="button" onClick={() => setModalAgregar(false)} className="btn-outline-aura" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
