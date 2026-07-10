import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Gift, Award, CheckCircle, Copy, Check, ShoppingBag, UserPlus } from 'lucide-react';
import apiClient from '../services/apiClient';

interface EstadoLealtad {
  puntos: number;
  codigoReferido: string | null;
  nivelActual: 'Bronce' | 'Plata' | 'Oro';
  proximoNivel: 'Plata' | 'Oro' | null;
  puntosParaProximoNivel: number | null;
}

const Beneficios: React.FC = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoLealtad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    apiClient.get('/api/lealtad/estado')
      .then(res => setEstado(res.data))
      .catch(() => setError('No se pudo cargar tu información de lealtad.'))
      .finally(() => setLoading(false));
  }, []);

  const copiarCodigo = () => {
    if (!estado?.codigoReferido) return;
    navigator.clipboard.writeText(estado.codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const niveles = [
    {
      nombre: 'Bronce',
      puntos: '0 - 499 pts',
      color: '#CD7F32',
      bg: '#FDF5EC',
      beneficios: ['5% descuento en servicios', 'Acceso al catálogo completo', 'Notificaciones de ofertas']
    },
    {
      nombre: 'Plata',
      puntos: '500 - 999 pts',
      color: '#A8A9AD',
      bg: '#F5F5F5',
      beneficios: ['10% descuento en servicios', 'Reserva prioritaria', 'Producto de bienvenida', 'Acceso a promociones exclusivas']
    },
    {
      nombre: 'Oro',
      puntos: '1000+ pts',
      color: '#FFD700',
      bg: '#FFFDF0',
      beneficios: ['15% descuento en servicios', 'Servicio de cortesía mensual', 'Acceso VIP a nuevos tratamientos', 'Consulta personalizada gratuita', 'Envío gratis en productos']
    },
  ];

  const formasGanar = [
    { icono: <CheckCircle size={20} />, texto: 'Completa una cita', puntos: '+1 pt por cada RD$10' },
    { icono: <ShoppingBag size={20} />, texto: 'Compra en caja o reserva productos', puntos: '+1 pt por cada RD$10' },
    { icono: <Star size={20} />, texto: 'Deja una reseña', puntos: '+25 pts' },
    { icono: <Gift size={20} />, texto: 'Refiere un amigo', puntos: '+150 pts' },
    { icono: <UserPlus size={20} />, texto: 'Regístrate en AuraSpa', puntos: '+50 pts' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 10%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: 0 }}>
            Programa de Lealtad Aura
          </h2>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>
            Acumula puntos y disfruta beneficios exclusivos
          </p>
        </div>
        <button onClick={() => navigate('/dashboard/client')} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
          ← Volver
        </button>
      </div>

      {error && (
        <p style={{ textAlign: 'center', color: '#c62828', padding: '20px', background: '#ffebee', borderRadius: '20px', marginBottom: '30px' }}>{error}</p>
      )}

      {/* Puntos actuales */}
      <div className="card-aura" style={{ padding: '35px 40px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderBottom: '6px solid var(--aura-lavender)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'var(--aura-lavender)', color: 'white', padding: '18px', borderRadius: '50%' }}>
            <Heart size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Tu nivel actual</p>
            <h3 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', margin: '4px 0 0' }}>
              {loading ? 'Cargando...' : `Nivel ${estado?.nivelActual ?? 'Bronce'}`}
            </h3>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Puntos acumulados</p>
          <h2 style={{ color: 'var(--aura-lavender)', fontWeight: 'bold', margin: '4px 0 0', fontSize: '2.5rem' }}>
            {loading ? '—' : (estado?.puntos ?? 0)}
          </h2>
        </div>
        <div style={{ textAlign: 'center' }}>
          {estado?.proximoNivel ? (
            <>
              <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Próximo nivel</p>
              <h3 style={{ color: '#A8A9AD', fontWeight: 'bold', margin: '4px 0 0' }}>Nivel {estado.proximoNivel}</h3>
              <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.78rem' }}>
                Te faltan {estado.puntosParaProximoNivel} pts
              </p>
            </>
          ) : !loading && (
            <>
              <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.9rem' }}>Nivel máximo</p>
              <h3 style={{ color: '#FFD700', fontWeight: 'bold', margin: '4px 0 0' }}>¡Nivel Oro! 🎉</h3>
            </>
          )}
        </div>
      </div>

      {/* Código de referido */}
      {estado?.codigoReferido && (
        <div className="card-aura" style={{ padding: '25px 35px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <p style={{ color: 'var(--aura-navy)', fontWeight: '700', margin: '0 0 4px', fontSize: '0.95rem' }}>Tu código de referido</p>
            <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.82rem' }}>Compártelo con un amigo y gana +150 pts cuando se registre</p>
          </div>
          <button onClick={copiarCodigo} className="btn-outline-aura" style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {estado.codigoReferido}
            {copiado ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {/* Cómo ganar puntos */}
      <div className="card-aura" style={{ padding: '30px 35px', marginBottom: '30px' }}>
        <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>
          ¿Cómo ganar puntos?
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {formasGanar.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#f8f6ff', borderRadius: '15px' }}>
              <div style={{ color: 'var(--aura-lavender)', flexShrink: 0 }}>
                {item.icono}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--aura-navy)' }}>{item.texto}</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--aura-lavender)', fontWeight: '700' }}>{item.puntos}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Niveles */}
      <h4 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '20px' }}>Niveles y beneficios</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {niveles.map((nivel, i) => (
          <div key={i} className="card-aura" style={{
            padding: '30px', borderTop: `4px solid ${nivel.color}`,
            boxShadow: estado?.nivelActual === nivel.nombre ? `0 0 0 2px ${nivel.color}` : undefined
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Award size={28} color={nivel.color} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 'bold', color: 'var(--aura-navy)' }}>Nivel {nivel.nombre}</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--aura-gray)' }}>{nivel.puntos}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nivel.beneficios.map((b, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color={nivel.color} />
                  <span style={{ fontSize: '0.87rem', color: '#555' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Beneficios;
