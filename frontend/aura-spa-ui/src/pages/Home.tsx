import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="viewport-fix">
      {/* Hero Section */}
      <section className="hero-main animate-fade-in">
        <div style={{ padding: '0 10%' }}>
          <h1 className="display-1 mb-4">Aura Spa ✨</h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.9 }}>
            Liderando la industria del cuidado personal mediante la convergencia de la salud biológica y la seguridad digital.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/catalog')} className="btn-AuraSpa">Explorar Servicios</button>
            <button className="btn-outline-aura" style={{ color: 'white', borderColor: 'white' }}>Ubicación</button>
          </div>
        </div>
      </section>

      {/* Trayectoria & Visión */}
      <section className="section-full" style={{ background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '50px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--aura-lavender)', letterSpacing: '2px' }}>Trayectoria & Visión</span>
            <h2 className="display-4" style={{ marginTop: '10px', marginBottom: '30px' }}>Innovación en Bienestar</h2>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '20px' }}>
              Aura Spa se fundó bajo la premisa de que la belleza no debe comprometer la integridad. Somos pioneros en la implementación de protocolos de bioseguridad de grado clínico aplicados a la estética ungular.
            </p>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px' }}>
              Nuestra infraestructura tecnológica permite una gestión transparente de citas y una protección de datos del más alto nivel, asegurando que cada cliente disfrute de una experiencia segura.
            </p>
            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '15px', borderLeft: '5px solid var(--aura-lavender)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '1.2rem', color: '#555' }}>
                "Nuestra excelencia se mide en la salud de nuestros usuarios y la precisión de nuestra tecnología avanzada."
              </p>
            </div>
          </div>
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', gap: '20px' }}>
            <img src="https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=800" className="img-grid-custom" style={{ marginTop: '40px' }} alt="Spa" />
            <img src="https://images.pexels.com/photos/6663462/pexels-photo-6663462.jpeg?auto=compress&cs=tinysrgb&w=800" className="img-grid-custom" alt="Spa 2" />
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="section-full" style={{ background: '#f8f9fa' }}>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div className="card-aura" style={{ flex: '1', padding: '40px', borderBottom: '5px solid var(--aura-lavender)' }}>
            <h3 className="display-6 mb-3">Nuestra Misión</h3>
            <p style={{ color: '#666' }}>Proveer soluciones de cuidado personal de alta gama, integrando herramientas digitales avanzadas para una gestión eficiente y protocolos sanitarios que garantizan la salud total del cliente mediante la innovación continua.</p>
          </div>
          <div className="card-aura" style={{ flex: '1', padding: '40px', borderBottom: '5px solid var(--aura-navy)' }}>
            <h3 className="display-6 mb-3">Nuestra Visión</h3>
            <p style={{ color: '#666' }}>Consolidarnos como el referente regional de Spas inteligentes, reconocidos por nuestra capacidad de innovar en procesos estéticos y nuestra ética profesional inquebrantable basada en la ciberseguridad.</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="section-full" style={{ background: 'white', textAlign: 'center' }}>
        <h2 className="display-4 mb-5">Valores Corporativos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          <div className="contact-info-card">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛡️</div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Seguridad Total</h4>
            <p style={{ color: '#666' }}>Priorizamos el resguardo de la información digital y la protección biológica de cada cliente mediante auditorías constantes.</p>
          </div>
          <div className="contact-info-card">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💎</div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Excelencia Operativa</h4>
            <p style={{ color: '#666' }}>Cada procedimiento es ejecutado con estándares de precisión técnica y materiales de calidad premium.</p>
          </div>
          <div className="contact-info-card">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🌱</div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Responsabilidad Ética</h4>
            <p style={{ color: '#666' }}>Comprometidos con el desarrollo sostenible y el uso exclusivo de productos certificados Cruelty-Free.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-main">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '50px' }}>
          <div>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Aura Spa ✨</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Protegiendo tu aura, asegurando tu bienestar mediante protocolos de alta ingeniería y servicios estéticos de clase mundial.</p>
          </div>
          <div>
            <h5 style={{ color: 'white', marginBottom: '20px' }}>Explorar</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="#" className="footer-link">Inicio</a>
              <a href="/catalog" className="footer-link">Catálogo</a>
              <a href="#" className="footer-link">Quiénes Somos</a>
            </div>
          </div>
          <div>
            <h5 style={{ color: 'white', marginBottom: '20px' }}>Horarios</h5>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Lunes - Viernes: 9:00 - 20:00</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Sábados: 10:00 - 18:00</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, color: '#ffc107' }}>Domingos: Cerrado</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h5 style={{ color: 'white', marginBottom: '20px' }}>Síguenos</h5>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', fontSize: '1.5rem' }}>
              <span>📸</span> <span>📘</span> <span>🐦</span>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '20px' }}>© 2026 Aura Spa Corporation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
