# AuraSpa — Sistema de Gestión
Equipo 5 · IDS325L-01 · INTEC · 2026

---

## PASO 1 — Base de datos en SSMS

Ejecuta los scripts en este orden:

1. `AuraSpa_SSMS_v2.sql`         → Crea la base de datos desde cero
2. `AuraSpa_Upgrade_v2_to_v3.sql`→ Agrega inventario y comprobantes fiscales
3. `AuraSpa_StoredProcedures_v2.sql` → Crea los stored procedures
4. `AuraSpa_SeedData.sql`        → Inserta los datos de prueba

> Si ya ejecutaste el v2 antes, empieza desde el paso 2.

---

## PASO 2 — Backend (.NET)

```bash
cd backend/AuraSpa.Api
dotnet restore
dotnet run
```

El API queda disponible en: http://localhost:5036
Swagger UI: http://localhost:5036/swagger

---

## PASO 3 — Frontend (React)

```bash
cd frontend/aura-spa-ui
npm install
npm run dev
```

La app queda disponible en: http://localhost:5173

---

## CREDENCIALES DE PRUEBA
(contraseña de todos: Admin123!)

| Email                    | Perfil       |
|--------------------------|--------------|
| admin@auraspa.com        | Admin        |
| cajero@auraspa.com       | Cajero       |
| nicole@auraspa.com       | Especialista |
| valentina@auraspa.com    | Especialista |
| gabriela@email.com       | Cliente      |
| diana.f@email.com        | Cliente      |

---

## ESTRUCTURA DEL PROYECTO

```
AuraSpa_Unificado/
├── backend/
│   └── AuraSpa.Api/          ← Core API (.NET 10)
│       ├── Controllers/      ← Auth, Caja, Catalogo, Citas, Dashboard,
│       │                        ComprobanteFiscal, Inventario
│       ├── Models/           ← 19 modelos EF Core
│       ├── Data/             ← DbContext + DbSeeder
│       └── appsettings.json  ← Connection string SSMS
├── frontend/
│   └── aura-spa-ui/          ← React + Vite
│       └── src/
│           ├── pages/        ← Home, Login, Catalog, POS,
│           │                    DashboardClient, DashboardStaff
│           ├── components/   ← Navbar
│           └── context/      ← AuthContext
├── AuraSpa_SSMS_v2.sql              ← Schema completo
├── AuraSpa_Upgrade_v2_to_v3.sql     ← Upgrade: inventario + NCF
├── AuraSpa_StoredProcedures_v2.sql  ← 20 stored procedures
└── AuraSpa_SeedData.sql             ← Datos de prueba
```
