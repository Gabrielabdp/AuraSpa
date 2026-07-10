import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ShoppingCart, Sparkles, Package, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

interface CatalogItem {
  id: number; nombre: string; descripcion: string; precio: number;
  tipo: string; imagenUrl: string; stock?: number;
  duracionMinutos?: number; categoria?: string;
}

const normalizeText = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const Catalog: React.FC = () => {
  const [carritoCount, setCarritoCount] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('aura_carrito')||'[]').reduce((a:number,p:any)=>a+p.cantidad,0); } catch { return 0; }
  });
  const [toast, setToast] = useState<string | null>(null);

  const agregarAlCarrito = (item: any) => {
    const carrito = JSON.parse(localStorage.getItem('aura_carrito')||'[]');
    const existe = carrito.find((p:any)=>p.id===item.id);
    if (existe) {
      existe.cantidad += 1;
    } else {
      carrito.push({ id:item.id, nombre:item.nombre, precio:item.precio, cantidad:1, imagenUrl:item.imagenUrl });
    }
    localStorage.setItem('aura_carrito', JSON.stringify(carrito));
    setCarritoCount(carrito.reduce((a:number,p:any)=>a+p.cantidad,0));
    setToast(`🛍️ ${item.nombre} agregado al carrito`);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [searchParams] = useSearchParams();
  const [items,      setItems]      = useState<CatalogItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Todos']);
  const [filter,     setFilter]     = useState<'Servicio'|'Producto'>(
    searchParams.get('tipo') === 'Producto' ? 'Producto' : 'Servicio'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria,  setCategoria]  = useState('Todos');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const esCliente = !user || user.perfil === 'Cliente';

  useEffect(() => {
    setLoading(true); setError('');
    Promise.all([
      apiClient.get('/api/catalog/services'),
      apiClient.get('/api/catalog/products'),
      apiClient.get('/api/catalog/categorias'),
    ]).then(([servRes, prodRes, catRes]) => {
      const servicios: CatalogItem[] = servRes.data.map((s: any) => ({
        id: s.idItem, nombre: s.nombre, descripcion: s.descripcion ?? '',
        precio: s.precioBase ?? 0, tipo: 'Servicio', imagenUrl: s.imagenUrl ?? '',
        duracionMinutos: s.duracionMinutos, categoria: s.categoria?.nombre ?? '',
      }));
      const productos: CatalogItem[] = prodRes.data.map((p: any) => ({
        id: p.idItem, nombre: p.nombre, descripcion: p.descripcion ?? '',
        precio: p.precioBase ?? 0, tipo: 'Producto', imagenUrl: p.imagenUrl ?? '',
        stock: p.stockActual, categoria: 'Producto',
      }));
      setItems([...servicios, ...productos]);
      setCategorias(['Todos', ...catRes.data.map((c: any) => c.nombre)]);
    }).catch(() => {
      setError('No se pudo cargar el catálogo. Verifica que el servidor esté activo.');
    }).finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item =>
    item.tipo === filter &&
    normalizeText(item.nombre).includes(normalizeText(searchTerm)) &&
    (categoria === 'Todos' || item.categoria === categoria)
  );

  const handleAccion = (item: CatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!esCliente) return;
    if (item.tipo === 'Producto') {
      agregarAlCarrito(item);
    } else {
      navigate(`/agendamiento?itemId=${item.id}&categoria=${item.categoria}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '40px 6%', minHeight: '100vh', background: 'var(--aura-beige)' }}>

      {/* Header */}
      <div className="card-aura" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', padding: '25px 30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Experiencias Aura</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            {user ? <>Bienvenido/a, <strong>{user.nombre}</strong> — Sucursal Principal</> : 'Encuentra el tratamiento ideal en Sucursal Principal.'}
          </p>
        </div>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input type="text" placeholder="Buscar servicios o productos..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none', background: 'white' }} />
        </div>
      </div>

      {/* Tabs Servicios / Productos */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
        {(['Servicio', 'Producto'] as const).map(t => (
          <button key={t} onClick={() => { setFilter(t); setCategoria('Todos'); }}
            style={{
              padding: '10px 30px', borderRadius: '30px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.95rem',
              background: filter === t ? 'var(--aura-lavender)' : 'white',
              color: filter === t ? 'white' : 'var(--aura-gray)',
              boxShadow: filter === t ? '0 4px 15px rgba(151,138,221,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s'
            }}>
            {t === 'Servicio'
              ? <><Sparkles size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Servicios</>
              : <><Package size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Productos</>}
          </button>
        ))}
      </div>

      {/* Filtro categorías */}
      {filter === 'Servicio' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoria(cat)}
              style={{
                padding: '7px 18px', borderRadius: '30px', border: '1px solid',
                borderColor: categoria === cat ? 'var(--aura-lavender)' : '#ddd',
                background: categoria === cat ? 'var(--aura-lavender)' : 'white',
                color: categoria === cat ? 'white' : 'var(--aura-gray)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: categoria === cat ? '600' : '400',
                transition: 'all 0.2s'
              }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando catálogo...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '40px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
          {filteredItems.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>
              No se encontraron resultados.
            </p>
          ) : filteredItems.map(item => (
            <div key={item.id}
              style={{ borderRadius: '20px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', cursor: esCliente ? 'pointer' : 'default', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}
              onClick={esCliente ? (e) => handleAccion(item, e) : undefined}
              onMouseEnter={e => { if (esCliente) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(151,138,221,0.25)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
            >
              {/* Imagen con overlays */}
              <div style={{ position: 'relative', height: '200px', background: '#f0ecff' }}>
                {item.imagenUrl ? (
                  <img src={item.imagenUrl} alt={item.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0ecff, #e8e0f5)' }}>
                    {filter === 'Servicio' ? <Sparkles size={40} color="var(--aura-lavender)" /> : <Package size={40} color="var(--aura-lavender)" />}
                  </div>
                )}

                {/* Badge categoría - esquina superior izquierda */}
                {item.categoria && (
                  <span style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: 'var(--aura-lavender)', color: 'white',
                    padding: '4px 12px', borderRadius: '30px',
                    fontSize: '0.72rem', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {item.tipo === 'Producto' ? 'Producto' : item.categoria}
                  </span>
                )}

                {/* Precio - esquina superior derecha */}
                <span style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(255,255,255,0.95)', color: 'var(--aura-navy)',
                  padding: '4px 12px', borderRadius: '30px',
                  fontSize: '0.85rem', fontWeight: '800',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}>
                  RD$ {item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Contenido */}
              <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', color: 'var(--aura-navy)', margin: '0 0 6px', fontSize: '1rem', fontFamily: "'Segoe UI', sans-serif" }}>
                  {item.nombre}
                </h4>

                {item.descripcion && (
                  <p style={{ color: '#777', fontSize: '0.82rem', margin: '0 0 12px', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.descripcion}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', marginTop: 'auto' }}>
                  {item.stock !== undefined && (
                    <span style={{ color: item.stock > 0 ? '#22c55e' : '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>
                      {item.stock > 0 ? `Stock: ${item.stock}` : 'Sin stock'}
                    </span>
                  )}
                </div>

                {esCliente ? (
                  <button
                    className="btn-AuraSpa"
                    onClick={(e) => handleAccion(item, e)}
                    style={{ width: '100%', padding: '11px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
                  >
                    {item.tipo === 'Servicio'
                      ? <><span>📅</span> Agendar cita</>
                      : <><ShoppingCart size={15} /> Reservar</>}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', background: '#f5f5f5', borderRadius: '30px', color: '#999', fontSize: '0.82rem' }}>
                    <Lock size={13} /> {user ? 'Solo clientes pueden reservar' : 'Inicia sesión para reservar'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && createPortal(
        <div className="toast-aura" style={{
          position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999,
          background: 'var(--aura-navy)', color: 'white',
          borderRadius: '15px', padding: '18px 28px',
          borderLeft: '5px solid var(--aura-lavender)',
          boxShadow: '0 14px 36px rgba(0,0,0,0.35)', fontSize: '1.05rem', fontWeight: '700'
        }}>
          {toast}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Catalog;
