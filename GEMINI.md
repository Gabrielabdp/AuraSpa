# Proyecto AuraSpa Unificado

Este archivo contiene el contexto y las reglas para el mantenimiento del proyecto AuraSpa Unificado.

## Arquitectura del Sistema
- **Frontend:** React + TypeScript (Vite). Ubicado en `./frontend/aura-spa-ui`.
- **Backend:** .NET 8 Web API. Ubicado en `./backend/AuraSpa.Api`.
- **Base de Datos:** SQL Server LocalDB (`AuraSpaUnifiedDb`).

## Configuración de Red (Local)
- **Backend URL:** `http://localhost:5036` (HTTPS desactivado para desarrollo local).
- **Frontend URL:** `http://localhost:5173`.

## Usuarios de Prueba (Pre-seeded)
| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| Admin | `admin@auraspa.com` | `Admin123` |
| Empleado | `laura@auraspa.com` | `Empleado123` |
| Cliente | `cliente@gmail.com` | `Cliente123` |

## Módulos Implementados
1. **Catálogo Unificado:** Dividido en Servicios y Productos con filtrado dinámico.
2. **Sistema de Caja (POS):** Módulo web para apertura de caja y registro de ventas.
3. **Dashboards:** Vistas personalizadas para Clientes y Empleados post-login.
4. **Seguridad:** Autenticación basada en JWT con permisos por rol.

## Comandos Rápidos
- **Iniciar Backend:** `cd backend/AuraSpa.Api; dotnet run`
- **Iniciar Frontend:** `cd frontend/aura-spa-ui; npm run dev`
- **Actualizar DB:** `dotnet ef database update`

## Reglas de Diseño
- Colores principales: `--aura-navy (#1a1a2e)`, `--aura-lavender (#978add)`.
- Estilo: "Premium/Spa", con bordes redondeados (`30px`) y sombras suaves.
- Mantener consistencia con el diseño original de AuraSpaWeb.
