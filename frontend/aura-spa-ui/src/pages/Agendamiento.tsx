import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

type CategoriaServicio = 'Facial' | 'Masaje' | 'Depilación' | 'Cejas y Pestañas' | 'Uñas' | 'Pelo' | '';

const CATEGORIAS = [
  { id: 'Facial',           emoji: '✨', desc: 'Limpieza y tratamientos' },
  { id: 'Masaje',           emoji: '💆', desc: 'Relajante y terapéutico' },
  { id: 'Depilación',       emoji: '🌿', desc: 'Cera y hilo' },
  { id: 'Cejas y Pestañas', emoji: '👁️', desc: 'Diseño y extensiones' },
  { id: 'Uñas',             emoji: '💅', desc: 'Manicura y nail art' },
  { id: 'Pelo',             emoji: '✂️', desc: 'Corte, tinte y más' },
];

interface Especialista { idEmpleado: number; nombreCompleto: string; }
interface Servicio { id: number; nombre: string; categoria?: string; }
interface Sucursal { idSucursal: number; nombre: string; }

const Agendamiento: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mapearCategoria = (cat: string): CategoriaServicio => {
    const mapa: Record<string, CategoriaServicio> = {
      'Faciales': 'Facial',
      'Masajes': 'Masaje',
      'Cejas/Pestañas': 'Cejas y Pestañas',
      'Facial': 'Facial',
      'Masaje': 'Masaje',
      'Cejas y Pestañas': 'Cejas y Pestañas',
      'Uñas': 'Uñas',
      'Depilación': 'Depilación',
      'Pelo': 'Pelo',
    };
    return mapa[cat] ?? '';
  };

  const [categoria, setCategoria] = useState<CategoriaServicio>(
    mapearCategoria(searchParams.get('categoria') ?? '')
  );
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [idEspecialista, setIdEspecialista] = useState('');
  const [idServicio, setIdServicio] = useState(searchParams.get('itemId') ?? '');
  const [idSucursal, setIdSucursal] = useState('');

  const [tipoFacial, setTipoFacial] = useState('');
  const [tipoPiel, setTipoPiel] = useState('');
  const [duracionMasaje, setDuracionMasaje] = useState('');
  const [tipoMasaje, setTipoMasaje] = useState('');
  const [zonaDepilacion, setZonaDepilacion] = useState('');
  const [metodoDepilacion, setMetodoDepilacion] = useState('');
  const [subservicioCejas, setSubservicioCejas] = useState('');
  const [tieneExtensiones, setTieneExtensiones] = useState('');
  const [tipoUnias, setTipoUnias] = useState('');
  const [necesitaRemocion, setNecesitaRemocion] = useState('');
  const [tipoServicioPelo, setTipoServicioPelo] = useState('');
  const [largoCabello, setLargoCabello] = useState('');

  // Preselección automática según el servicio elegido en el catálogo
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (!itemId) return;

    const mapaServicio: Record<string, Partial<{
      tipoFacial: string; tipoPiel: string;
      tipoMasaje: string; duracionMasaje: string;
      zonaDepilacion: string; metodoDepilacion: string;
      subservicioCejas: string;
      tipoUnias: string;
      tipoServicioPelo: string;
    }>> = {
      '5':  { tipoFacial: 'Limpieza' },
      '6':  { tipoFacial: 'Hidratación' },
      '7':  { tipoFacial: 'Anti-edad' },
      '8':  { tipoFacial: 'Acné' },
      '9':  { tipoMasaje: 'Relajante', duracionMasaje: '60' },
      '10': { tipoMasaje: 'Relajante', duracionMasaje: '90' },
      '11': { tipoMasaje: 'Descontracturante' },
      '12': { tipoMasaje: 'Piedras calientes' },
      '13': { tipoMasaje: 'Drenaje linfático' },
      '14': { zonaDepilacion: 'Axilas' },
      '15': { zonaDepilacion: 'Piernas completas' },
      '16': { zonaDepilacion: 'Bikini' },
      '17': { zonaDepilacion: 'Facial' },
      '18': { subservicioCejas: 'Diseño' },
      '19': { subservicioCejas: 'Tinte cejas' },
      '20': { subservicioCejas: 'Extensiones' },
      '21': { subservicioCejas: 'Lifting' },
      '1':  { tipoUnias: 'Manicura' },
      '2':  { tipoUnias: 'Pedicura' },
      '3':  { tipoUnias: 'Acrílicas' },
      '4':  { tipoUnias: 'Nail Art' },
      '22': { tipoServicioPelo: 'Corte' },
      '23': { tipoServicioPelo: 'Tinte' },
      '24': { tipoServicioPelo: 'Mechas' },
      '25': { tipoServicioPelo: 'Keratina' },
      '26': { tipoServicioPelo: 'Hidratación' },
    };

    const preset = mapaServicio[itemId];
    if (!preset) return;
    if (preset.tipoFacial) setTipoFacial(preset.tipoFacial);
    if (preset.tipoPiel) setTipoPiel(preset.tipoPiel);
    if (preset.tipoMasaje) setTipoMasaje(preset.tipoMasaje);
    if (preset.duracionMasaje) setDuracionMasaje(preset.duracionMasaje);
    if (preset.zonaDepilacion) setZonaDepilacion(preset.zonaDepilacion);
    if (preset.metodoDepilacion) setMetodoDepilacion(preset.metodoDepilacion);
    if (preset.subservicioCejas) setSubservicioCejas(preset.subservicioCejas);
    if (preset.tipoUnias) setTipoUnias(preset.tipoUnias);
    if (preset.tipoServicioPelo) setTipoServicioPelo(preset.tipoServicioPelo);
  }, []);

  useEffect(() => {
    if (categoria) {
      apiClient.get('/api/catalog/services').then(res => {
        const filtered = res.data
          .filter((s: any) => (s.categoria?.nombre ?? '').toLowerCase().includes(categoria.toLowerCase()))
          .map((s: any) => ({ id: s.idItem, nombre: s.nombre, categoria: s.categoria?.nombre }));
        setServicios(filtered);
        if (!idServicio && filtered.length > 0) setIdServicio(String(filtered[0].id));
      }).catch(() => {});
    }
  }, [categoria]);

  useEffect(() => {
    if (!categoria) return;
    apiClient.get('/api/catalog/empleados/0').then(res => {
      setEspecialistas(res.data);
    }).catch(() => {});
  }, [categoria]);

  useEffect(() => {
    setSucursales([{ idSucursal: 1, nombre: 'AuraSpa Piantini — Sucursal Principal' }]);
    setIdSucursal('1');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria) { setError('Selecciona una categoría de servicio.'); return; }
    if (!fecha || !hora) { setError('Selecciona fecha y hora.'); return; }

    setLoading(true);
    setError('');

    const fechaHora = `${fecha}T${hora}:00`;

    try {
      await apiClient.post('/api/citas', {
        idItem: parseInt(idServicio) || 1,
        idSucursal: parseInt(idSucursal) || 1,
        idEmpleado: idEspecialista ? parseInt(idEspecialista) : null,
        fechaHora,
        tipoFacial: tipoFacial || null,
        tipoPiel: tipoPiel || null,
        tipoMasaje: tipoMasaje || null,
        duracionMasajeMin: duracionMasaje ? parseInt(duracionMasaje) : null,
        zonaDepilacion: zonaDepilacion || null,
        metodoDepilacion: metodoDepilacion || null,
        subservicioCejas: subservicioCejas || null,
        tieneTrabajoAnterior: tieneExtensiones === 'Si' ? true : tieneExtensiones === 'No' ? false : null,
        tipoUnias: tipoUnias || null,
        incluyeRemocion: necesitaRemocion === 'Si' ? true : necesitaRemocion === 'No' ? false : null,
        tipoServicioPelo: tipoServicioPelo || null,
        largoCabello: largoCabello || null,
      });

      navigate('/cita-confirmada', {
        state: {
          servicio: servicios.find(s => String(s.id) === idServicio)?.nombre ?? categoria,
          fecha: new Date(`${fecha}T${hora}`).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
          hora: new Date(`${fecha}T${hora}`).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
          especialista: especialistas.find(e => String(e.idEmpleado) === idEspecialista)?.nombreCompleto ?? 'Sin preferencia',
          referencia: `AURA-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
          fechaSolicitud: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
        }
      });
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'No se pudo crear la cita. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '15px',
    border: '1px solid #ddd', outline: 'none', background: '#fcfcfc', fontSize: '0.9rem'
  };
  const labelStyle = {
    display: 'block', marginBottom: '8px',
    color: 'var(--aura-gray)', fontWeight: '500' as const, fontSize: '0.9rem'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '50px', borderRadius: '30px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Agendar Cita</h2>
        <p style={{ textAlign: 'center', color: 'var(--aura-gray)', fontSize: '0.9rem', marginBottom: '35px' }}>
          Selecciona el servicio y completa los detalles
        </p>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <p style={{ color: 'var(--aura-gray)', fontWeight: '500', fontSize: '0.9rem', marginBottom: '14px' }}>¿Qué servicio deseas?</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' }}>
          {CATEGORIAS.map(cat => (
            <div key={cat.id} onClick={() => { setCategoria(cat.id as CategoriaServicio); setIdServicio(''); }}
              style={{
                padding: '18px 10px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                border: categoria === cat.id ? '2px solid var(--aura-lavender)' : '2px solid #eee',
                background: categoria === cat.id ? '#f0ecff' : 'white',
                boxShadow: categoria === cat.id ? '0 4px 15px rgba(151,138,221,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{cat.emoji}</div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: categoria === cat.id ? 'var(--aura-lavender-dark)' : 'var(--aura-navy)', marginBottom: '3px' }}>{cat.id}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--aura-gray)' }}>{cat.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {categoria === 'Facial' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>✨ Detalles del Facial</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tipo de facial</label>
                <select value={tipoFacial} onChange={(e) => setTipoFacial(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Limpieza</option><option>Hidratación</option><option>Anti-edad</option><option>Acné</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de piel</label>
                <select value={tipoPiel} onChange={(e) => setTipoPiel(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Normal</option><option>Seca</option><option>Mixta</option><option>Grasa</option><option>Sensible</option>
                </select>
              </div>
            </div>
          )}

          {categoria === 'Masaje' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>💆 Detalles del Masaje</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tipo de masaje</label>
                <select value={tipoMasaje} onChange={(e) => setTipoMasaje(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Relajante</option><option>Descontracturante</option><option>Piedras calientes</option><option>Drenaje linfático</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duración</label>
                <select value={duracionMasaje} onChange={(e) => setDuracionMasaje(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option value="30">30 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option>
                </select>
              </div>
            </div>
          )}

          {categoria === 'Depilación' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>🌿 Detalles de la Depilación</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Zona del cuerpo</label>
                <select value={zonaDepilacion} onChange={(e) => setZonaDepilacion(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Piernas completas</option><option>Media pierna</option><option>Axilas</option><option>Bikini</option><option>Facial</option><option>Brazos</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Método</label>
                <select value={metodoDepilacion} onChange={(e) => setMetodoDepilacion(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Cera caliente</option><option>Cera fría</option><option>Hilo</option>
                </select>
              </div>
            </div>
          )}

          {categoria === 'Cejas y Pestañas' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>👁️ Detalles de Cejas y Pestañas</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Subservicio</label>
                <select value={subservicioCejas} onChange={(e) => setSubservicioCejas(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option value="Diseño">Diseño de cejas</option><option value="Tinte cejas">Tinte de cejas</option>
                  <option value="Extensiones">Extensiones de pestañas</option><option value="Lifting">Lifting de pestañas</option>
                  <option value="Tinte pestañas">Tinte de pestañas</option>
                </select>
              </div>
              {subservicioCejas === 'Extensiones' && (
                <div>
                  <label style={labelStyle}>¿Tienes extensiones puestas actualmente?</label>
                  <select value={tieneExtensiones} onChange={(e) => setTieneExtensiones(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Selecciona...</option>
                    <option value="Si">Sí, necesito remoción previa</option><option value="No">No, es primera vez</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {categoria === 'Uñas' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>💅 Detalles del Servicio de Uñas</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tipo de servicio</label>
                <select value={tipoUnias} onChange={(e) => setTipoUnias(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Manicura</option><option>Pedicura</option><option value="Acrílicas">Uñas acrílicas</option>
                  <option value="Semipermanente">Esmalte semipermanente</option><option>Nail Art</option><option>Remoción</option>
                </select>
              </div>
              {(tipoUnias === 'Acrílicas' || tipoUnias === 'Semipermanente') && (
                <div>
                  <label style={labelStyle}>¿Necesitas remoción de uñas anteriores?</label>
                  <select value={necesitaRemocion} onChange={(e) => setNecesitaRemocion(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Selecciona...</option>
                    <option value="Si">Sí, incluir remoción</option><option value="No">No, mis uñas están limpias</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {categoria === 'Pelo' && (
            <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>✂️ Detalles del Servicio de Pelo</p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tipo de servicio</label>
                <select value={tipoServicioPelo} onChange={(e) => setTipoServicioPelo(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Corte</option><option>Tinte</option><option>Mechas</option><option>Keratina</option><option>Hidratación</option><option>Peinado</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Largo del cabello</label>
                <select value={largoCabello} onChange={(e) => setLargoCabello(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  <option>Corto</option><option>Medio</option><option>Largo</option><option>Extralargo</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Sucursal</label>
            <select value={idSucursal} onChange={(e) => setIdSucursal(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
              {sucursales.map(s => <option key={s.idSucursal} value={String(s.idSucursal)}>{s.nombre}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Especialista</label>
            <select value={idEspecialista} onChange={(e) => setIdEspecialista(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Sin preferencia</option>
              {especialistas.map(e => <option key={e.idEmpleado} value={String(e.idEmpleado)}>{e.nombreCompleto}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              min={new Date().toISOString().split('T')[0]} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={labelStyle}>Hora</label>
            <select value={hora} onChange={(e) => setHora(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecciona una hora...</option>
              {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(h => (
                <option key={h} value={h}>{h} {parseInt(h) < 12 ? 'AM' : 'PM'}</option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--aura-gray)', textAlign: 'center', marginBottom: '20px' }}>
            ⏰ Las cancelaciones deben realizarse con al menos <strong>72 horas</strong> de anticipación.
          </p>

          <button type="submit" className="btn-AuraSpa" style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }} disabled={!categoria || loading}>
            {loading ? <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /> : 'Confirmar Cita'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--aura-gray)', fontSize: '0.85rem' }}>
          <span onClick={() => navigate(-1)} style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', cursor: 'pointer' }}>← Volver al catálogo</span>
        </p>
      </div>
    </div>
  );
};

export default Agendamiento;
