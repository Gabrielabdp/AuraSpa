import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import CitasEspecialista from './pages/CitasEspecialista';

const PrivateRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.rol || '')) return <Navigate to="/" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/catalog" element={<><Navbar /><Catalog /></>} />
          <Route path="/producto-apartado" element={<ProductoApartado />} />
          <Route path="/dashboard/client" element={<><Navbar /><DashboardClient /></>} />
          <Route path="/dashboard/staff" element={<><Navbar /><DashboardStaff /></>} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/core" element={<Core />} />
          <Route path="/registro" element={<><Navbar /><Registro /></>} />
          <Route path="/verificacion-2fa" element={<Verificacion2FA />} />
          <Route path="/agendamiento" element={<><Navbar /><Agendamiento /></>} />
          <Route path="/cita-confirmada" element={<CitaConfirmada />} />
          <Route path="/notificaciones" element={<><Navbar /><Notificaciones /></>} />
          <Route path="/beneficios" element={<><Navbar /><Beneficios /></>} />
          <Route path="/perfil" element={<><Navbar /><Perfil /></>} />
          <Route path="/mis-citas" element={<><Navbar /><MisCitas /></>} />
          <Route path="/clientes" element={<><Navbar /><Clientes /></>} />
          <Route path="/gestion-citas" element={<><Navbar /><GestionCitas /></>} />
          <Route path="/citas-especialista" element={<CitasEspecialista />} />
          <Route path="/reportes" element={<><Navbar /><Reportes /></>} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;