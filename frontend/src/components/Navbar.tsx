import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react';
import Aurora from './Aurora';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

return (
    <>
      <nav className="navbar-aura shadow-sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--aura-navy)', fontSize: '1.5rem', fontWeight: 'bold' }}>
            AURA <span style={{ color: 'var(--aura-lavender)' }}>Spa</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/catalog" className="nav-link-aura">Servicios</Link>
            
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--aura-navy)', fontSize: '0.9rem' }}>
                  Hola, {user?.nombre}
                </span>
                
                {(user?.perfil === 'Cliente') && (
                  <button 
                    onClick={() => navigate('/dashboard/client')} 
                    className="btn-outline-aura" 
                    style={{ padding: '5px 15px', fontSize: '0.8rem', borderRadius: '25px' }}
                  >
                    🏠 Mi Dashboard
                  </button>
                )}

                <button 
                  onClick={() => navigate('/perfil')} 
                  className="btn-outline-aura" 
                  style={{ padding: '5px 15px', fontSize: '0.8rem', borderRadius: '25px' }}
                >
                  👤 Mi Perfil
                </button>

                {user?.rol === 'Admin' && (
                  <button 
                    onClick={() => navigate('/dashboard/staff')} 
                    className="btn-outline-aura" 
                    style={{ padding: '5px 15px', fontSize: '0.8rem', borderColor: 'red', color: 'red' }}
                  >
                    ⚙️ Panel Admin
                  </button>
                )}

                <button onClick={handleLogout} className="btn-outline-aura" style={{ padding: '5px 15px', fontSize: '0.8rem', borderColor: '#666', color: '#666' }}>
                  Cerrar Sesion
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" className="nav-link-aura" style={{ border: 'none' }}>Entrar</Link>
                <Link to="/login" className="btn-AuraSpa" style={{ padding: '8px 25px', fontSize: '0.9rem' }}>Unirse</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <Aurora />
    </>
  );
};
export default Navbar; 
