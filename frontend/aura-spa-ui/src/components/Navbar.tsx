import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Aurora from './Aurora';
// cart count


const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const esCliente      = user?.perfil === 'Cliente';
  const esAdmin        = user?.perfil === 'Admin';
  const esCajero       = user?.perfil === 'Cajero';
  const esEspecialista = user?.perfil === 'Especialista';
  const esStaff        = esAdmin || esCajero || esEspecialista;

  const dashboardRuta = esStaff ? '/dashboard/staff' : '/dashboard/client';

  return (
    <>
      <nav className="navbar-aura shadow-sm">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
          <Link to="/" style={{ textDecoration:'none', color:'var(--aura-navy)', fontSize:'1.5rem', fontWeight:'bold' }}>
            AURA <span style={{ color:'var(--aura-lavender)' }}>Spa</span>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
            {/* Servicios — visible para todos pero Catalog maneja quién puede reservar */}
            <Link to="/catalog" className="nav-link-aura">Servicios</Link>

            {isAuthenticated ? (
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontWeight:'bold', color:'var(--aura-navy)', fontSize:'0.9rem' }}>
                  Hola, {user?.nombre}
                </span>

                {/* Carrito — solo clientes */}
                {esCliente && (
                  <button onClick={() => navigate('/carrito')}
                    style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', border:'1px solid var(--aura-lavender)', color:'var(--aura-lavender)', background:'white', cursor:'pointer', position:'relative' }}>
                    Carrito
                  </button>
                )}

                {/* Mi Dashboard — todos los usuarios autenticados */}
                <button
                  onClick={() => navigate(dashboardRuta)}
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px' }}
                >
                  🏠 Mi Panel
                </button>

                {/* POS — solo Admin y Cajero */}
                {(esAdmin || esCajero) && (
                  <button
                    onClick={() => navigate('/caja')}
                    className="btn-outline-aura"
                    style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', borderColor:'#17a2b8', color:'#17a2b8' }}
                  >
                    🖥️ POS
                  </button>
                )}

                {/* Gestión citas — Admin, Cajero y Especialista */}
                {esStaff && (
                  <button
                    onClick={() => navigate('/gestion-citas')}
                    className="btn-outline-aura"
                    style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', borderColor:'#f59e0b', color:'#f59e0b' }}
                  >
                    📅 Citas
                  </button>
                )}

                {/* Perfil */}
                <button
                  onClick={() => navigate('/perfil')}
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px' }}
                >
                  👤 Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', borderColor:'#666', color:'#666' }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <Link to="/login" className="nav-link-aura">Entrar</Link>
                <Link to="/registro" className="btn-AuraSpa" style={{ padding:'8px 25px', fontSize:'0.9rem' }}>Unirse</Link>
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
