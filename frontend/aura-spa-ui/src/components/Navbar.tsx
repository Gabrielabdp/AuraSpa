import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Sparkles, Bell } from 'lucide-react';
import apiClient from '../services/apiClient';
import Aurora from './Aurora';
// cart count


const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) { setNoLeidas(0); return; }
    apiClient.get(`/api/dashboard/notificaciones/${user.id}`).then(res => {
      setNoLeidas(res.data.filter((n: any) => !n.leida).length);
    }).catch(() => {});
    // Se re-consulta en cada cambio de ruta (ej. al volver de /notificaciones tras marcar como leídas)
  }, [isAuthenticated, user?.id, location.pathname]);

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
            {isAuthenticated ? (
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontWeight:'bold', color:'var(--aura-navy)', fontSize:'0.9rem' }}>
                  Hola, {user?.nombre}
                </span>

                {/* Notificaciones — todos los usuarios autenticados */}
                <button
                  onClick={() => navigate('/notificaciones')}
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', height:'31px', boxSizing:'border-box' }}
                >
                  <Bell size={14} />
                  {noLeidas > 0 && (
                    <span style={{
                      position:'absolute', top:'-6px', right:'-6px', background:'#ef4444', color:'white',
                      borderRadius:'50%', minWidth:'18px', height:'18px', padding:'0 4px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.65rem', fontWeight:'700', lineHeight:1
                    }}>
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  )}
                </button>

                {/* Servicios — visible para todos pero Catalog maneja quién puede reservar */}
                <Link
                  to="/catalog"
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', height:'31px', boxSizing:'border-box' }}
                >
                  <Sparkles size={14} /> Servicios
                </Link>

                {/* Carrito — solo clientes */}
                {esCliente && (
                  <button
                    onClick={() => navigate('/carrito')}
                    className="btn-outline-aura"
                    style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', height:'31px', boxSizing:'border-box' }}
                  >
                    <ShoppingCart size={14} /> Carrito
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
                <Link
                  to="/catalog"
                  className="btn-outline-aura"
                  style={{ padding:'5px 15px', fontSize:'0.8rem', borderRadius:'25px', textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', height:'31px', boxSizing:'border-box' }}
                >
                  <Sparkles size={14} /> Servicios
                </Link>
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
