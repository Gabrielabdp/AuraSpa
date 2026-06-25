import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Send, Mic, MicOff, Globe, Sparkles, Calendar, Clock, ChevronDown } from 'lucide-react';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
interface Mensaje {
  id: number;
  rol: 'aurora' | 'usuario';
  texto: string;
  hora: string;
}

type Idioma = 'es' | 'en';
type ModoAurora = 'cliente' | 'empleado';

// ── RESPUESTAS HARDCODEADAS ────────────────────────────────────────────────────
const RESPUESTAS: Record<string, Record<Idioma, string>> = {
  servicios: {
    es: '✨ Ofrecemos 6 categorías de servicios: **Faciales**, **Masajes**, **Depilación**, **Cejas y Pestañas**, **Uñas** y **Pelo**. ¿Te gustaría saber más sobre alguno en particular?',
    en: '✨ We offer 6 service categories: **Facials**, **Massages**, **Hair Removal**, **Eyebrows & Lashes**, **Nails** and **Hair**. Would you like to know more about any of them?',
  },
  precios: {
    es: '💰 Nuestros precios van desde RD$ 600 (Diseño de Cejas) hasta RD$ 3,500 (Tinte y Corte). Puedes ver el catálogo completo con todos los precios en nuestra sección de Servicios.',
    en: '💰 Our prices range from RD$ 600 (Eyebrow Design) to RD$ 3,500 (Color & Cut). You can see the full catalog with all prices in our Services section.',
  },
  agendar: {
    es: '📅 ¡Claro! Para agendar una cita necesito saber qué servicio te interesa. Puedes ir directamente al catálogo y seleccionar "Agendar Ahora", o dime el servicio y te guío.',
    en: '📅 Sure! To book an appointment I need to know which service you\'re interested in. You can go directly to the catalog and select "Book Now", or tell me the service and I\'ll guide you.',
  },
  horarios: {
    es: '🕐 Nuestro horario de atención es de **lunes a sábado de 9:00 AM a 7:00 PM** y **domingos de 10:00 AM a 4:00 PM**. ¿Quieres agendar una cita?',
    en: '🕐 Our business hours are **Monday to Saturday 9:00 AM to 7:00 PM** and **Sundays 10:00 AM to 4:00 PM**. Would you like to book an appointment?',
  },
  ubicacion: {
    es: '📍 Tenemos dos sucursales: **AuraSpa Piantini** (Calle 2, Piantini) y **AuraSpa Bella Vista** (Calle 2, Bella Vista). ¿En cuál te gustaría ser atendida?',
    en: '📍 We have two locations: **AuraSpa Piantini** (Calle 2, Piantini) and **AuraSpa Bella Vista** (Calle 2, Bella Vista). Which one would you prefer?',
  },
  facial: {
    es: '🌿 El **Facial Hidratante** tiene una duración de 60 minutos e incluye limpieza, exfoliación y mascarilla hidratante. Su precio es RD$ 1,800. ¿Te gustaría agendarlo?',
    en: '🌿 The **Hydrating Facial** lasts 60 minutes and includes cleansing, exfoliation and a hydrating mask. The price is RD$ 1,800. Would you like to book it?',
  },
  masaje: {
    es: '💆 El **Masaje Relajante** tiene una duración de 60 minutos con aceites esenciales. Su precio es RD$ 2,500. Ofrecemos masajes de 30, 60 y 90 minutos. ¿Te interesa?',
    en: '💆 The **Relaxing Massage** lasts 60 minutes with essential oils. The price is RD$ 2,500. We offer 30, 60 and 90 minute options. Are you interested?',
  },
  hola: {
    es: '👋 ¡Hola! Soy Aurora, tu asistente personal de AuraSpa. Puedo ayudarte a conocer nuestros servicios, precios, horarios y agendar citas. ¿En qué te puedo ayudar hoy?',
    en: '👋 Hello! I\'m Aurora, your personal AuraSpa assistant. I can help you learn about our services, prices, schedules and book appointments. How can I help you today?',
  },
  // Modo empleado
  agenda: {
    es: '📋 Hoy tienes **3 citas programadas**: \n• 10:00 AM — Gabriela Duverge (Facial Hidratante)\n• 2:00 PM — Diana Lantigua (Masaje Relajante)\n• 4:30 PM — Francia Mejía (Diseño de Cejas)',
    en: '📋 Today you have **3 scheduled appointments**: \n• 10:00 AM — Gabriela Duverge (Hydrating Facial)\n• 2:00 PM — Diana Lantigua (Relaxing Massage)\n• 4:30 PM — Francia Mejía (Eyebrow Design)',
  },
  llegada: {
    es: '🔔 **Alerta de llegada**: Tu próxima clienta, **Gabriela Duverge**, acaba de llegar a recepción para su cita de Facial Hidratante a las 10:00 AM. Su expediente indica piel mixta, sin alergias.',
    en: '🔔 **Arrival alert**: Your next client, **Gabriela Duverge**, just arrived at reception for her Hydrating Facial appointment at 10:00 AM. Her file indicates combination skin, no allergies.',
  },
  cabina: {
    es: '🏠 La **Cabina 2** está disponible ahora mismo. La Cabina 1 está ocupada hasta las 11:00 AM. ¿Quieres que reserve la Cabina 2 para tu próxima cita?',
    en: '🏠 **Cabin 2** is available right now. Cabin 1 is occupied until 11:00 AM. Would you like me to reserve Cabin 2 for your next appointment?',
  },
  default: {
    es: '🤔 No estoy segura de entender tu consulta. Puedo ayudarte con: **servicios**, **precios**, **horarios**, **ubicación** o **agendar una cita**. ¿Sobre qué te gustaría saber?',
    en: '🤔 I\'m not sure I understand your query. I can help you with: **services**, **prices**, **schedules**, **location** or **booking an appointment**. What would you like to know?',
  },
};

// ── DETECTAR INTENCIÓN ─────────────────────────────────────────────────────────
const detectarIntencion = (texto: string, modo: ModoAurora): string => {
  const t = texto.toLowerCase();
  if (t.includes('hola') || t.includes('hello') || t.includes('hi') || t.includes('buenas')) return 'hola';
  if (modo === 'empleado') {
    if (t.includes('agenda') || t.includes('citas') || t.includes('appointments') || t.includes('schedule')) return 'agenda';
    if (t.includes('llegada') || t.includes('arrival') || t.includes('cliente llegó') || t.includes('client arrived')) return 'llegada';
    if (t.includes('cabina') || t.includes('cabin') || t.includes('sala') || t.includes('room')) return 'cabina';
  }
  if (t.includes('precio') || t.includes('costo') || t.includes('cuánto') || t.includes('price') || t.includes('cost') || t.includes('how much')) return 'precios';
  if (t.includes('facial') || t.includes('piel') || t.includes('skin')) return 'facial';
  if (t.includes('masaje') || t.includes('massage') || t.includes('relajante')) return 'masaje';
  if (t.includes('servicio') || t.includes('service') || t.includes('ofrecen') || t.includes('offer')) return 'servicios';
  if (t.includes('agendar') || t.includes('cita') || t.includes('reservar') || t.includes('book') || t.includes('appointment')) return 'agendar';
  if (t.includes('horario') || t.includes('hora') || t.includes('schedule') || t.includes('hours') || t.includes('open')) return 'horarios';
  if (t.includes('ubicación') || t.includes('dirección') || t.includes('donde') || t.includes('location') || t.includes('address') || t.includes('where')) return 'ubicacion';
  return 'default';
};

// ── HORA ACTUAL ────────────────────────────────────────────────────────────────
const horaActual = () => new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const Aurora: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [activado, setActivado] = useState(false);
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [input, setInput] = useState('');
  const [escuchando, setEscuchando] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mostrando, setMostrando] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modo: ModoAurora = user?.rol === 'Empleado' || user?.rol === 'Admin' ? 'empleado' : 'cliente';

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Activar Aurora
  const activarAurora = () => {
    setActivado(true);
    setMostrando(true);
    setTimeout(() => setMostrando(false), 2000);

    const saludo: Mensaje = {
      id: Date.now(),
      rol: 'aurora',
      texto: modo === 'empleado'
        ? (idioma === 'es'
          ? `👋 Hola, **${user?.nombre}**. Soy Aurora. Puedo consultarte la agenda, alertarte de llegadas de clientes y verificar disponibilidad de cabinas. ¿En qué te ayudo?`
          : `👋 Hello, **${user?.nombre}**. I'm Aurora. I can check your schedule, alert you of client arrivals and verify cabin availability. How can I help?`)
        : (idioma === 'es'
          ? `👋 ¡Hola, **${user?.nombre || 'bienvenida'}**! Soy **Aurora**, tu asistente personal de AuraSpa. ¿En qué te puedo ayudar hoy?`
          : `👋 Hello, **${user?.nombre || 'welcome'}**! I'm **Aurora**, your personal AuraSpa assistant. How can I help you today?`),
      hora: horaActual(),
    };
    setMensajes([saludo]);
  };

  // Enviar mensaje
  const enviarMensaje = () => {
    if (!input.trim()) return;

    const msgUsuario: Mensaje = { id: Date.now(), rol: 'usuario', texto: input, hora: horaActual() };
    setMensajes(prev => [...prev, msgUsuario]);
    setInput('');

    // Detectar idioma automáticamente
    const textoLower = input.toLowerCase();
    const palabrasIngles = ['hello', 'hi', 'what', 'how', 'where', 'when', 'price', 'service', 'book', 'appointment'];
    const detectadoIngles = palabrasIngles.some(p => textoLower.includes(p));
    const idiomaDetectado: Idioma = detectadoIngles ? 'en' : 'es';
    if (detectadoIngles) setIdioma('en');

    // Simular typing
    setTimeout(() => {
      const intencion = detectarIntencion(input, modo);
      let respuesta = RESPUESTAS[intencion]?.[idiomaDetectado] || RESPUESTAS['default'][idiomaDetectado];

      // Si quiere agendar, ofrecer ir al catálogo
      const msgAurora: Mensaje = { id: Date.now() + 1, rol: 'aurora', texto: respuesta, hora: horaActual() };
      setMensajes(prev => [...prev, msgAurora]);
    }, 800);
  };

  // Simular voz
  const toggleVoz = () => {
    setEscuchando(!escuchando);
    if (!escuchando) {
      setTimeout(() => {
        setEscuchando(false);
        setInput(idioma === 'es' ? '¿Cuáles son los servicios disponibles?' : 'What services do you offer?');
      }, 2000);
    }
  };

  // Renderizar mensaje con markdown básico
  const renderMensaje = (texto: string) => {
    return texto.split('\n').map((linea, i) => (
      <span key={i}>
        {linea.split(/\*\*(.*?)\*\*/g).map((parte, j) =>
          j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte
        )}
        {i < texto.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* ── WIDGET FLOTANTE ── */}
      {!abierto && (
        <div
          onClick={() => { setAbierto(true); if (!activado) activarAurora(); }}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000,
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
          }}
        >
          {/* Pulso animado */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '-6px', borderRadius: '50%',
              background: 'rgba(107,91,147,0.25)',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B5B93, #1F2D3D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(107,91,147,0.5)',
            }}>
              <Sparkles size={26} color="white" />
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #6B5B93, #1F2D3D)',
            color: 'white', padding: '4px 14px', borderRadius: '20px',
            fontSize: '0.78rem', fontWeight: '700', letterSpacing: '1px',
            boxShadow: '0 4px 15px rgba(107,91,147,0.4)'
          }}>
            AURORA
          </div>
        </div>
      )}

      {/* ── PANEL DE CHAT ── */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          width: '380px', maxHeight: '580px',
          background: 'white', borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'slideUp 0.3s ease'
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6B5B93, #1F2D3D)',
            padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>Aurora</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }} />
                  {idioma === 'es' ? 'Asistente AuraSpa' : 'AuraSpa Assistant'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Selector de idioma */}
              <button
                onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Globe size={13} /> {idioma === 'es' ? 'ES' : 'EN'}
              </button>
              <button onClick={() => setAbierto(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                <ChevronDown size={18} />
              </button>
              <button onClick={() => { setAbierto(false); setActivado(false); setMensajes([]); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Animación de activación */}
          {mostrando && (
            <div style={{ background: '#f0ecff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--aura-lavender)' }}>
              <Sparkles size={14} />
              {idioma === 'es' ? '✨ Aurora activada — ¿En qué puedo ayudarte?' : '✨ Aurora activated — How can I help you?'}
            </div>
          )}

          {/* Sugerencias rápidas */}
          {mensajes.length <= 1 && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0edf5' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--aura-gray)', marginBottom: '8px', fontWeight: '500' }}>
                {idioma === 'es' ? 'Preguntas frecuentes:' : 'Quick questions:'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(modo === 'cliente'
                  ? (idioma === 'es'
                    ? ['¿Qué servicios ofrecen?', '¿Cuáles son los precios?', 'Quiero agendar una cita', '¿Cuál es el horario?']
                    : ['What services do you offer?', 'What are the prices?', 'I want to book', 'What are your hours?'])
                  : (idioma === 'es'
                    ? ['¿Cuál es mi agenda hoy?', '¿Hay alguna llegada?', '¿Qué cabinas están libres?']
                    : ['What\'s my schedule today?', 'Any arrivals?', 'Which cabins are free?'])
                ).map((sugerencia, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(sugerencia); setTimeout(() => inputRef.current?.focus(), 100); }}
                    style={{ background: '#f0ecff', color: 'var(--aura-lavender)', border: '1px solid #e0d5f5', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' }}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes */}
          <div ref={mensajesRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px' }}>
            {mensajes.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.rol === 'usuario' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                {msg.rol === 'aurora' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6B5B93, #1F2D3D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={13} color="white" />
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: msg.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.rol === 'usuario' ? 'linear-gradient(135deg, #6B5B93, #1F2D3D)' : '#f8f6ff',
                    color: msg.rol === 'usuario' ? 'white' : '#333',
                    fontSize: '0.85rem', lineHeight: '1.5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    {renderMensaje(msg.texto)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#bbb', marginTop: '3px', textAlign: msg.rol === 'usuario' ? 'right' : 'left', paddingLeft: msg.rol === 'aurora' ? '4px' : '0' }}>
                    {msg.hora}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón de agendar si el usuario habló de citas */}
          {mensajes.some(m => m.rol === 'aurora' && (m.texto.includes('agendar') || m.texto.includes('book'))) && modo === 'cliente' && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0edf5' }}>
              <button
                onClick={() => { setAbierto(false); navigate('/agendamiento'); }}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #6B5B93, #1F2D3D)', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Calendar size={14} /> {idioma === 'es' ? 'Ir a Agendar Cita' : 'Go to Book Appointment'}
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0edf5', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleVoz}
              style={{ background: escuchando ? '#fef2f2' : '#f0ecff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: escuchando ? '#ef4444' : 'var(--aura-lavender)', display: 'flex', flexShrink: 0 }}
            >
              {escuchando ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
              placeholder={idioma === 'es' ? 'Escribe o usa el micrófono...' : 'Type or use microphone...'}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #e8e0f5', outline: 'none', fontSize: '0.85rem', background: '#fcfcfc' }}
            />
            <button
              onClick={enviarMensaje}
              disabled={!input.trim()}
              style={{ background: input.trim() ? 'linear-gradient(135deg, #6B5B93, #1F2D3D)' : '#f0f0f0', border: 'none', padding: '10px', borderRadius: '50%', cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? 'white' : '#bbb', display: 'flex', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Animaciones CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Aurora;
