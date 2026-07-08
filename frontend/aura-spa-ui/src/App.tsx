import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import DashboardClient from './pages/DashboardClient';
import DashboardStaff from './pages/DashboardStaff';
import Caja from './pages/Caja';
import Registro from './pages/Registro';
import Verificacion2FA from './pages/Verificacion2FA';
import Agendamiento from './pages/Agendamiento';
import CitaConfirmada from './pages/CitaConfirmada';
import Notificaciones from './pages/Notificaciones';
import Beneficios from './pages/Beneficios';
import Perfil from './pages/Perfil';
import MisCitas from './pages/MisCitas';
import RecuperarContrasena from './pages/RecuperarContrasena';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Core from './pages/Core';
import ProductoApartado from './pages/ProductoApartado';
import GestionCitas from './pages/GestionCitas';
import CarritoProductos from './pages/CarritoProductos';
import CitasEspecialista from './pages/CitasEspecialista';

// ── Pantalla de acceso denegado ──────────────────────────────
const AccesoDenegado: React.FC<{ mensaje?: string }> = ({ mensaje }) => {
  const navigate = useNavigate();
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh', background:'var(--aura-beige)' }}>
      <div className="card-aura animate-fade-in" style={{ maxWidth:'420px', width:'100%', padding:'50px', textAlign:'center', borderRadius:'28px' }}>
        <div style={{ fontSize:'3rem', marginBottom:'16px' }}>🚫</div>
        <h3 style={{ color:'var(--aura-navy)', fontWeight:'bold', marginBottom:'12px' }}>Acceso restringido</h3>
        <p style={{ color:'#888', fontSize:'0.9rem', marginBottom:'28px' }}>
          {mensaje || 'No tienes permisos para acceder a esta sección.'}
        </p>
        <button className="btn-AuraSpa" onClick={() => navigate(-1)} style={{ padding:'12px 30px' }}>← Volver</button>
      </div>
    </div>
  );
};

// ── Ruta protegida con roles ──────────────────────────────────
const PrivateRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  denyRoles?: string[];
  denyMessage?: string;
}> = ({ children, roles, denyRoles, denyMessage }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (denyRoles && denyRoles.includes(user?.perfil || ''))
    return <AccesoDenegado mensaje={denyMessage} />;
  if (roles && !roles.includes(user?.perfil || ''))
    return <AccesoDenegado />;
  return <>{children}</>;
};

// ── App ───────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Públicas */}
          <Route path="/login"               element={<Login />} />
          <Route path="/registro"            element={<><Navbar /><Registro /></>} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/verificacion-2fa"    element={<Verificacion2FA />} />
          <Route path="/"                    element={<><Navbar /><Home /></>} />
          <Route path="/catalog"             element={<><Navbar /><Catalog /></>} />
          <Route path="/beneficios"          element={<><Navbar /><Beneficios /></>} />

          {/* Solo Cliente — staff no puede reservar ni comprar */}
          <Route path="/agendamiento" element={
            <PrivateRoute roles={['Cliente']}
              denyRoles={['Admin','Cajero','Especialista']}
              denyMessage="Los administradores y staff no pueden reservar citas desde el portal de clientes.">
              <><Navbar /><Agendamiento /></>
            </PrivateRoute>
          } />
          <Route path="/producto-apartado" element={
            <PrivateRoute roles={['Cliente']}
              denyRoles={['Admin','Cajero','Especialista']}
              denyMessage="Los administradores y staff no pueden realizar compras desde el portal de clientes.">
              <ProductoApartado />
            </PrivateRoute>
          } />
          <Route path="/cita-confirmada" element={
            <PrivateRoute roles={['Cliente']}><CitaConfirmada /></PrivateRoute>
          } />
          <Route path="/carrito" element={
            <PrivateRoute roles={['Cliente']}><><Navbar /><CarritoProductos /></></PrivateRoute>
          } />
          <Route path="/mis-citas" element={
            <PrivateRoute roles={['Cliente']}><><Navbar /><MisCitas /></></PrivateRoute>
          } />
          <Route path="/dashboard/client" element={
            <PrivateRoute roles={['Cliente']}><><Navbar /><DashboardClient /></></PrivateRoute>
          } />

          {/* Staff */}
          <Route path="/dashboard/staff" element={
            <PrivateRoute roles={['Admin','Cajero','Especialista']}><><Navbar /><DashboardStaff /></></PrivateRoute>
          } />

          {/* Caja — Admin y Cajero; Especialista ve mensaje */}
          <Route path="/caja" element={
            <PrivateRoute roles={['Admin','Cajero']}
              denyRoles={['Especialista']}
              denyMessage="El módulo de Caja es exclusivo para Cajeros y Administradores. Como Especialista, tu área es la gestión de citas.">
              <Caja />
            </PrivateRoute>
          } />

          {/* Gestión de citas — todos los staff */}
          <Route path="/gestion-citas" element={
            <PrivateRoute roles={['Admin','Cajero','Especialista']}><><Navbar /><GestionCitas /></></PrivateRoute>
          } />
          <Route path="/citas-especialista" element={
            <PrivateRoute roles={['Admin','Especialista']}><CitasEspecialista /></PrivateRoute>
          } />

          {/* Reportes — solo Cajero */}
          <Route path="/reportes" element={
            <PrivateRoute roles={['Admin','Cajero']}
              // Admin puede ver reportes
              >
              <><Navbar /><Reportes /></>
            </PrivateRoute>
          } />

          {/* Clientes — Admin y Cajero */}
          <Route path="/clientes" element={
            <PrivateRoute roles={['Admin','Cajero']}><><Navbar /><Clientes /></></PrivateRoute>
          } />

          {/* Core — solo Admin */}
          <Route path="/core" element={
            <PrivateRoute roles={['Admin']}><Core /></PrivateRoute>
          } />

          {/* Cualquier autenticado */}
          <Route path="/perfil" element={
            <PrivateRoute><><Navbar /><Perfil /></></PrivateRoute>
          } />
          <Route path="/notificaciones" element={
            <PrivateRoute><><Navbar /><Notificaciones /></></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
