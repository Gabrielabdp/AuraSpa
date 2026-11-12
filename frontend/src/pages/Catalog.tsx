import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Sparkles, Package, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

interface CatalogItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipo: string;
  imagenUrl: string;
  stock?: number;
  duracionMinutos?: number;
  categoria?: string;
}

const Catalog: React.FC = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Todos']);
  const [filter, setFilter] = useState<'Servicio' | 'Producto'>('Servicio');
  const [searchTerm, setSearchText] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [serviciosRes, productosRes, categoriasRes] = await Promise.all([
          apiClient.get('/api/catalog/services'),
          apiClient.get('/api/catalog/products'),
          apiClient.get('/api/catalog/categorias'),
        ]);

        const servicios: CatalogItem[] = serviciosRes.data.map((s: any) => ({
          id: s.idItem,
          nombre: s.nombre,
          descripcion: s.descripcion ?? '',
          precio: s.precioBase ?? 0,
          tipo: 'Servicio',
          imagenUrl: s.imagenUrl ?? '',
          duracionMinutos: s.duracionMinutos,
          categoria: s.categoria?.nombre ?? '',
        }));

        const productos: CatalogItem[] = productosRes.data.map((p: any) => ({
          id: p.idItem,
          nombre: p.nombre,
          descripcion: p.descripcion ?? '',
          precio: p.precioBase ?? 0,
          tipo: 'Producto',
          imagenUrl: p.imagenUrl ?? '',
          stock: p.stockActual,
          categoria: 'Producto',
        }));

        setItems([...servicios, ...productos]);

        const cats = ['Todos', ...categoriasRes.data.map((c: any) => c.nombre)];
        setCategorias(cats);
      } catch {
        setError('No se pudo cargar el catálogo. Verifica que el servidor esté activo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchTipo = item.tipo === filter;
    const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoria === 'Todos' || item.categoria === categoria;
    return matchTipo && matchSearch && matchCategoria;
  });

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 6%' }}>
      {/* Header */}
      <div className="card-aura" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', padding: '30px', borderRadius: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>Experiencias Aura</h2>
          {/* INC-W04: sucursal real del usuario desde el token */}
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Bienvenida, <strong>{user?.nombre}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', flexGrow: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#999' }} />
            <input
              type="text"
              placeholder="Buscar uñas, masajes, faciales..."
              value={searchTerm}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Servicio / Producto */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        {(['Servicio', 'Producto'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setFilter(t); setCategoria('Todos'); }}
            style={{
              padding: '12px 35px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'all 0.3s',
              background: filter === t ? 'var(--aura-navy)' : 'white',
              color: filter === t ? 'white' : 'var(--aura-gray)',
              boxShadow: filter === t ? '0 4px 15px rgba(31,45,61,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {t === 'Servicio' ? <><Sparkles size={16} style={{ marginRight: 6 }} />Servicios</> : <><Package size={16} style={{ marginRight: 6 }} />Productos</>}
          </button>
        ))}
      </div>

      {/* Filtro por categoría (solo servicios) */}
      {filter === 'Servicio' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoria(cat)} style={{
              padding: '8px 18px', borderRadius: '30px', border: '1px solid',
              borderColor: categoria === cat ? 'var(--aura-lavender)' : '#ddd',
              background: categoria === cat ? 'var(--aura-lavender)' : 'white',
              color: categoria === cat ? 'white' : 'var(--aura-gray)',
              fontWeight: categoria === cat ? '600' : '400',
              cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
            }}>{cat}</button>
          ))}
        </div>
      )}

      {/* Estado de carga/error */}
      {loading && <p style={{ textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>Cargando catálogo...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828', padding: '40px', background: '#ffebee', borderRadius: '20px' }}>{error}</p>}

      {/* INC-W05: grid de ítems con descripción */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {filteredItems.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--aura-gray)', padding: '60px' }}>
              No se encontraron {filter === 'Servicio' ? 'servicios' : 'productos'} con ese filtro.
            </p>
          ) : filteredItems.map(item => (
            <div key={item.id} className="card-aura" style={{ borderRadius: '25px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => item.tipo === 'Producto'
  ? navigate('/producto-apartado', { state: { producto: item.nombre, precio: item.precio } })
  : navigate(`/agendamiento?itemId=${item.id}&categoria=${item.categoria}`)
}
            >
              {item.imagenUrl && (
                <img src={item.imagenUrl} alt={item.nombre} style={{ width: '100%', height: '180px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                 <h4 style={{ fontWeight: 'bold', color: 'var(--aura-navy)', margin: 0, flex: 1, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>{item.nombre}</h4>
                  {item.categoria && item.tipo === 'Servicio' && (
                    <span style={{ background: '#f0ecff', color: 'var(--aura-lavender)', padding: '2px 10px', borderRadius: '30px', fontSize: '0.72rem', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {item.categoria}
                    </span>
                  )}
                </div>
                {/* INC-W05: descripción visible */}
                {item.descripcion && <p style={{ color: '#666', fontSize: '0.83rem', margin: '0 0 12px', lineHeight: '1.4' }}>{item.descripcion}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--aura-navy)', fontSize: '1.1rem' }}>RD$ {item.precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  {item.duracionMinutos && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.8rem' }}>
                      <Clock size={13} />{item.duracionMinutos} min
                    </span>
                  )}
                  {item.stock !== undefined && (
                    <span style={{ color: item.stock > 0 ? '#22c55e' : '#ef4444', fontSize: '0.8rem', fontWeight: '500' }}>
                      {item.stock > 0 ? `Stock: ${item.stock}` : 'Sin stock'}
                    </span>
                  )}
                </div>
                <button className="btn-AuraSpa" onClick={(e) => { e.stopPropagation(); item.tipo === 'Producto' ? navigate('/producto-apartado', { state: { producto: item.nombre, precio: item.precio } }) : navigate(`/agendamiento?itemId=${item.id}&categoria=${item.categoria}`); }} style={{ width: '100%', marginTop: '15px', padding: '10px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {item.tipo === 'Servicio' ? 'Agendar cita' : <><ShoppingCart size={15} />Reservar</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;
