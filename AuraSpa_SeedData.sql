-- ============================================================
--  AuraSpa — Datos de Prueba Completos
--  Ejecutar DESPUÉS de AuraSpa_Upgrade_v2_to_v3.sql
--  y AuraSpa_StoredProcedures_v2.sql
-- ============================================================
USE AuraSpaDB;
GO

-- ============================================================
--  EMPLEADOS
-- ============================================================
INSERT INTO Empleado (id_tipo_doc, numero_documento, nombres, apellidos, email_empresarial, telefono, tipo_empleado, id_sucursal, fecha_ingreso) VALUES
(1,'00100000001','Nicole',   'Martínez', 'nicole@auraspa.com',   '809-555-0101','Especialista',1,'2024-01-15'),
(1,'00100000002','Valentina','Reyes',    'valentina@auraspa.com','809-555-0102','Especialista',1,'2024-03-01'),
(1,'00100000003','Camila',   'Santos',   'camila@auraspa.com',   '809-555-0103','Especialista',1,'2024-06-01'),
(1,'00100000004','Sofía',    'Pérez',    'sofia@auraspa.com',    '809-555-0104','Cajero',       1,'2023-11-01'),
(1,'00100000005','Andrea',   'García',   'andrea@auraspa.com',   '809-555-0105','Admin',        1,'2023-08-01');
GO

-- Especialidades de cada empleada
-- Nicole: Masajes y Faciales | Valentina: Uñas y Cejas | Camila: Pelo y Depilación
INSERT INTO EmpleadoCategoria (id_empleado, id_categoria, nivel) VALUES
(1, 3, 'Senior'),  -- Nicole → Masajes
(1, 2, 'Senior'),  -- Nicole → Faciales
(2, 1, 'Senior'),  -- Valentina → Uñas
(2, 5, 'Intermedio'), -- Valentina → Cejas/Pestañas
(3, 6, 'Senior'),  -- Camila → Pelo
(3, 4, 'Intermedio'); -- Camila → Depilación
GO

-- ============================================================
--  USUARIOS (Perfiles del sistema)
-- ============================================================
-- Contraseña de todos: Admin123!
-- Hash BCrypt generado para "Admin123!"
DECLARE @hash VARCHAR(256) = '$2a$11$rBnqUwT6QhJ.k2Xm9pVlOuAF5sYdNzK3wP8vE1cHjI4oGbLtMxRqS';

-- Admin
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_empleado, verificado)
VALUES ('admin@auraspa.com','admin',@hash,'Andrea','García',1,5,1);

-- Cajero
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_empleado, verificado)
VALUES ('cajero@auraspa.com','cajero',@hash,'Sofía','Pérez',2,4,1);

-- Especialistas
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_empleado, verificado)
VALUES ('nicole@auraspa.com','nicole',@hash,'Nicole','Martínez',3,1,1);
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_empleado, verificado)
VALUES ('valentina@auraspa.com','valentina',@hash,'Valentina','Reyes',3,2,1);
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_empleado, verificado)
VALUES ('camila@auraspa.com','camila',@hash,'Camila','Santos',3,3,1);
GO

-- ============================================================
--  CLIENTES
-- ============================================================
INSERT INTO Cliente (id_tipo_doc, numero_documento, nombres, apellidos, email, telefono, fecha_nacimiento, genero) VALUES
(1,'00200000001','Gabriela', 'Duverge',  'gabriela@email.com',  '829-555-0201','1995-03-15','F'),
(1,'00200000002','Diana',    'Ferreras', 'diana.f@email.com',   '829-555-0202','1993-07-22','F'),
(1,'00200000003','Diana',    'Lantigua', 'diana.l@email.com',   '829-555-0203','1994-11-08','F'),
(1,'00200000004','María',    'González', 'maria.g@email.com',   '829-555-0204','1990-05-30','F'),
(1,'00200000005','Laura',    'Ramírez',  'laura.r@email.com',   '829-555-0205','1988-09-12','F'),
(1,'00200000006','Patricia', 'Castro',   'patricia.c@email.com','829-555-0206','1985-01-25','F'),
(1,'00200000007','Ana',      'Jiménez',  'ana.j@email.com',     '829-555-0207','1997-06-18','F'),
(1,'00200000008','Carmen',   'Torres',   'carmen.t@email.com',  '829-555-0208','1992-12-03','F');
GO

-- Usuarios clientes
DECLARE @hash2 VARCHAR(256) = '$2a$11$rBnqUwT6QhJ.k2Xm9pVlOuAF5sYdNzK3wP8vE1cHjI4oGbLtMxRqS';
INSERT INTO Usuario (email, nombre_usuario, contrasena_hash, nombre, apellido, id_perfil, id_cliente, verificado) VALUES
('gabriela@email.com','gabriela',@hash2,'Gabriela','Duverge',4,1,1),
('diana.f@email.com', 'diana_f', @hash2,'Diana',   'Ferreras',4,2,1),
('diana.l@email.com', 'diana_l', @hash2,'Diana',   'Lantigua',4,3,1),
('maria.g@email.com', 'maria_g', @hash2,'María',   'González',4,4,1),
('laura.r@email.com', 'laura_r', @hash2,'Laura',   'Ramírez', 4,5,1);
GO

-- Expedientes clínicos
INSERT INTO ExpedienteClinico (id_cliente, tipo_piel, alergias, condiciones_medicas, notas_especialista) VALUES
(1,'Mixta','Ninguna conocida','Ninguna','Prefiere presión media en masajes. Le gusta la lavanda.'),
(2,'Seca','Polen','Ninguna','Piel sensible. Usar productos hipoalergénicos.'),
(3,'Grasa','Níquel (metales)','Ninguna','Cuidado con herramientas metálicas en cejas.'),
(4,'Normal','Ninguna','Diabetes tipo 2','Consultar antes de cualquier tratamiento térmico.'),
(5,'Mixta','Ninguna','Ninguna','Cliente VIP. Siempre agenda con Nicole.');
GO

-- ============================================================
--  CATÁLOGO DE SERVICIOS (itbis_aplica=0: exentos Art.344)
-- ============================================================
INSERT INTO ItemCatalogo (nombre, descripcion, precio_base, tipo, id_categoria, duracion_minutos, itbis_aplica) VALUES
-- Uñas (cat 1)
('Manicura Rusa',          'Limpieza de cutícula y esmaltado de larga duración.',     1200.00,'Servicio',1,60,0),
('Pedicura Spa',           'Exfoliación, masaje y esmaltado premium para pies.',      1500.00,'Servicio',1,75,0),
('Uñas Acrílicas Full',    'Juego completo de uñas acrílicas con forma y diseño.',    2500.00,'Servicio',1,120,0),
('Nail Art (por diseño)',   'Diseño artístico en una o varias uñas.',                  800.00,'Servicio',1,30,0),
-- Faciales (cat 2)
('Limpieza Facial Profunda','Extracción de puntos negros y purificación total.',       1800.00,'Servicio',2,60,0),
('Facial Hidratante',       'Mascarilla y sérum de ácido hialurónico.',               2200.00,'Servicio',2,75,0),
('Facial Anti-edad',        'Radiofrecuencia y colágeno para firmeza.',                3500.00,'Servicio',2,90,0),
('Facial para Acné',        'Tratamiento purificante con luz azul.',                  2000.00,'Servicio',2,60,0),
-- Masajes (cat 3)
('Masaje Relajante 60min',  'Técnica sueca para alivio del estrés.',                  2500.00,'Servicio',3,60,0),
('Masaje Relajante 90min',  'Versión extendida con mayor cobertura corporal.',        3500.00,'Servicio',3,90,0),
('Masaje Descontracturante','Trabajo profundo en nudos musculares.',                   3000.00,'Servicio',3,60,0),
('Masaje con Piedras',      'Piedras volcánicas calientes para relajación profunda.', 4000.00,'Servicio',3,90,0),
('Drenaje Linfático',       'Estimula el sistema linfático y reduce retención.',      3200.00,'Servicio',3,75,0),
-- Depilación (cat 4)
('Depilación Axilas',       'Cera caliente para resultado duradero.',                   600.00,'Servicio',4,20,0),
('Depilación Piernas Completas','Cera fría para zona completa.',                      1800.00,'Servicio',4,45,0),
('Depilación Bikini',       'Zona bikini con cera especializada.',                     900.00,'Servicio',4,30,0),
('Depilación Facial',       'Labio, mentón o patillas con hilo o cera.',               500.00,'Servicio',4,20,0),
-- Cejas/Pestañas (cat 5)
('Diseño de Cejas',         'Perfilado y diseño personalizado con hilo y pinzas.',      800.00,'Servicio',5,30,0),
('Tinte de Cejas',          'Color semipermanente para mayor definición.',              700.00,'Servicio',5,20,0),
('Extensiones de Pestañas','Volumen natural o dramático con fibras de seda.',          3500.00,'Servicio',5,120,0),
('Lifting de Pestañas',     'Rizados permanente sin extensiones.',                    2500.00,'Servicio',5,60,0),
-- Pelo (cat 6)
('Corte Femenino',          'Corte personalizado con secado y peinado incluido.',      1500.00,'Servicio',6,60,0),
('Tinte Full',              'Color completo con aplicación profesional.',              3500.00,'Servicio',6,120,0),
('Mechas Californianas',    'Decoloración en balayage para efecto natural.',           5000.00,'Servicio',6,180,0),
('Keratina Brasileña',      'Alisado semipermanente de 3 a 6 meses.',                 6000.00,'Servicio',6,180,0),
('Hidratación Profunda',    'Mascarilla y tratamiento reparador de puntas.',           1200.00,'Servicio',6,45,0);
GO

-- Productos (itbis_aplica=1: sí aplica ITBIS)
INSERT INTO ItemCatalogo (nombre, descripcion, precio_base, tipo, id_categoria, itbis_aplica) VALUES
('Esmalte Semipermanente Aura','Esmalte de larga duración 21 días. Variedad de colores.',  850.00,'Producto',1,1),
('Aceite de Cutícula Lavanda', 'Hidratación profunda con aroma relajante.',                450.00,'Producto',1,1),
('Sérum Vitamina C',           'Iluminador facial con vitamina C estabilizada.',          1200.00,'Producto',2,1),
('Mascarilla Arcilla Verde',   'Purificante para piel grasa y mixta.',                     650.00,'Producto',2,1),
('Aceite de Masaje Almendras', 'Aceite suave multiusos para masajes profesionales.',       980.00,'Producto',3,1),
('Cera Depilatoria Premium',   'Cera de bajo punto de fusión para pieles sensibles.',      750.00,'Producto',4,1),
('Fijador de Cejas',           'Gel transparente de larga duración.',                      420.00,'Producto',5,1),
('Shampoo Reparador Aura',     'Shampoo sin sulfatos para cabello tratado.',               890.00,'Producto',6,1);
GO

-- Disponibilidad en sucursal 1
INSERT INTO ItemCatalogoSucursal (id_item, id_sucursal, stock, stock_minimo, disponible)
SELECT id_item, 1,
    CASE WHEN tipo='Producto' THEN 30 ELSE NULL END,
    CASE WHEN tipo='Producto' THEN 5 ELSE 0 END,
    1
FROM ItemCatalogo;
GO

-- ============================================================
--  PAQUETES
-- ============================================================
INSERT INTO Paquete (nombre, descripcion, precio_total, total_sesiones, vigencia_dias, id_item) VALUES
('Paquete Relax 5 Masajes',   '5 masajes relajantes de 60 min con 15% de descuento.',11500.00,5,90, 9),
('Paquete Facial Anti-edad x4','4 sesiones de facial anti-edad con seguimiento.',    12000.00,4,60,7),
('Paquete Uñas Mensual',      'Manicura y pedicura spa cada 2 semanas. 4 visitas.',  9500.00, 4,30, 1),
('Paquete Novia Completo',    'Diseño cejas, manicura, pedicura y facial el día del evento.',14000.00,4,30,NULL);
GO

-- ============================================================
--  CUPONES
-- ============================================================
INSERT INTO Cupon (codigo, tipo_descuento, valor, fecha_inicio, fecha_expiracion, usos_maximos, solo_primer_uso, activo) VALUES
('BIENVENIDA15','PORCENTAJE',15,'2026-01-01','2026-12-31',NULL,1,1),
('VERANO2026',  'PORCENTAJE',10,'2026-06-01','2026-08-31',100,0,1),
('RD500OFF',    'MONTO',     500,'2026-06-01','2026-07-31', 50,0,1),
('CUMPLE20',    'PORCENTAJE',20,'2026-01-01','2026-12-31',NULL,0,1),
('REFERIDO',    'MONTO',     300,'2026-01-01','2026-12-31',NULL,0,1);
GO

-- ============================================================
--  CITAS DE PRUEBA
-- ============================================================
-- Sesión de caja primero
INSERT INTO SesionCaja (id_usuario, id_sucursal, monto_inicial, notas_apertura, estado)
VALUES (2, 1, 5000.00, 'Apertura turno matutino', 'Abierta');
GO

-- Citas pasadas (completadas)
INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,notas,tipo_masaje)
VALUES (1,1,9,3,1,'2026-06-01 10:00:00',60,2500.00,'Completada','Cliente muy satisfecha','Relajante');

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,tipo_facial,tipo_piel)
VALUES (2,1,5,2,1,'2026-06-02 11:00:00',60,1800.00,'Completada','Limpieza Facial','Profunda','Grasa');

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,tipo_unias)
VALUES (3,2,1,1,1,'2026-06-03 14:00:00',60,1200.00,'Completada','Manicura rusa completa','Acrílicas cortas');

-- Citas próximas (pendientes)
DECLARE @manana DATETIME = DATEADD(DAY,1,CAST(GETDATE() AS DATE));
DECLARE @pasado DATETIME = DATEADD(DAY,2,CAST(GETDATE() AS DATE));
DECLARE @tresD  DATETIME = DATEADD(DAY,3,CAST(GETDATE() AS DATE));

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,tipo_masaje,duracion_masaje_min)
VALUES (1,1,10,3,1,DATEADD(HOUR,10,@manana),90,3500.00,'Confirmada','Masaje piedras','Piedras calientes',90);

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,tipo_facial,tipo_piel)
VALUES (2,1,7,2,1,DATEADD(HOUR,11,@manana),90,3500.00,'Pendiente','Facial anti-edad','Anti-edad','Seca');

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,subservicio_cejas)
VALUES (4,2,18,5,1,DATEADD(HOUR,15,@manana),30,800.00,'Pendiente',NULL,'Diseño de cejas');

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,tipo_servicio_pelo,largo_cabello)
VALUES (5,3,23,5,1,DATEADD(HOUR,10,@pasado),60,1500.00,'Pendiente',NULL,'Corte femenino','Largo');

INSERT INTO Cita (id_cliente,id_empleado,id_item,id_cabina,id_sucursal,fecha_hora,duracion_minutos,precio_acordado,estado,zona_depilacion,metodo_depilacion)
VALUES (3,3,15,4,1,DATEADD(HOUR,14,@pasado),45,1800.00,'Pendiente',NULL,'Piernas completas','Cera fría');
GO

-- ============================================================
--  VENTAS DE PRUEBA
-- ============================================================
-- Venta 1: contado
INSERT INTO Venta (numero_factura,id_cliente,id_usuario,id_sesion_caja,id_metodo_pago,fecha,subtotal,itbis,descuento,total,condicion_pago,tipo_venta,estado)
VALUES ('FAC-20260601-00001',1,2,1,1,'2026-06-01 10:45:00',2500.00,0.00,0.00,2500.00,'Contado','POS','Completada');
INSERT INTO VentaDetalle (id_venta,id_item,id_empleado,cantidad,precio_unitario,descuento_linea,subtotal) VALUES (1,9,1,1,2500.00,0,2500.00);

-- Venta 2: con producto (ITBIS aplica)
INSERT INTO Venta (numero_factura,id_cliente,id_usuario,id_sesion_caja,id_metodo_pago,fecha,subtotal,itbis,descuento,total,condicion_pago,tipo_venta,estado)
VALUES ('FAC-20260602-00001',2,2,1,1,'2026-06-02 12:00:00',2800.00,144.00,0.00,2944.00,'Contado','POS','Completada');
INSERT INTO VentaDetalle (id_venta,id_item,id_empleado,cantidad,precio_unitario,descuento_linea,subtotal) VALUES (2,5,1,1,1800.00,0,1800.00);
INSERT INTO VentaDetalle (id_venta,id_item,id_empleado,cantidad,precio_unitario,descuento_linea,subtotal) VALUES (2,28,NULL,1,1000.00,0,1000.00);

-- Venta 3: crédito
INSERT INTO Venta (numero_factura,id_cliente,id_usuario,id_sesion_caja,id_metodo_pago,fecha,subtotal,itbis,descuento,total,condicion_pago,tipo_venta,estado)
VALUES ('FAC-20260603-00001',3,2,1,6,'2026-06-03 15:00:00',1200.00,0.00,0.00,1200.00,'Credito','POS','Credito');
INSERT INTO VentaDetalle (id_venta,id_item,id_empleado,cantidad,precio_unitario,descuento_linea,subtotal) VALUES (3,1,2,1,1200.00,0,1200.00);
INSERT INTO CuentaPorCobrar (id_venta,id_cliente,monto_original,monto_abonado,fecha_vencimiento,estado)
VALUES (3,3,1200.00,0.00,DATEADD(DAY,30,GETDATE()),'Pendiente');
GO

-- Reseñas de las ventas completadas
INSERT INTO Resena (id_cliente,id_cita,calificacion,comentario,visible) VALUES
(1,1,5,'¡Excelente masaje! Nicole tiene manos mágicas. Salí completamente relajada. Volvería cada semana.',1),
(2,2,5,'El facial fue increíble. Mi piel quedó brillante y suave. 100% recomendado.',1),
(3,3,4,'Muy buena manicura. El trabajo con las acrílicas quedó perfecto.',1);
GO

-- ============================================================
--  PROVEEDORES DE PRUEBA
-- ============================================================
INSERT INTO Proveedor (nombre, rnc, contacto, telefono, email, direccion) VALUES
('Belleza Pro RD',   '101000001','Juan Méndez',   '809-444-0101','ventas@bellezapro.com.do',  'Av. 27 de Febrero #45, Santo Domingo'),
('Cosméticos Elite', '101000002','Rosa Almonte',  '809-444-0102','pedidos@cosmeticoselite.do', 'C/ El Conde #12, Santo Domingo'),
('SpaSupplies DR',   '101000003','Carlos Vargas', '809-444-0103','info@spasupplies.com.do',    'Av. Abraham Lincoln, Piantini');
GO

-- Orden de compra de prueba
INSERT INTO OrdenCompra (numero_orden,id_proveedor,id_sucursal,id_usuario,fecha_esperada,subtotal,itbis,total,estado,notas)
VALUES ('OC-20260610-0001',1,1,1,'2026-06-20',4500.00,810.00,5310.00,'Pendiente','Reposición mensual de productos');
GO

-- Obtener el id_item de los productos para el detalle
DECLARE @idEsmalte BIGINT     = (SELECT id_item FROM ItemCatalogo WHERE nombre = 'Esmalte Semipermanente Aura');
DECLARE @idAceite  BIGINT     = (SELECT id_item FROM ItemCatalogo WHERE nombre = 'Aceite de Cutícula Lavanda');
DECLARE @idSerum   BIGINT     = (SELECT id_item FROM ItemCatalogo WHERE nombre = 'Sérum Vitamina C');
DECLARE @idOrden   BIGINT     = (SELECT id_orden_compra FROM OrdenCompra WHERE numero_orden = 'OC-20260610-0001');

INSERT INTO OrdenCompraDetalle (id_orden_compra,id_item,cantidad_pedida,cantidad_recibida,precio_unitario,subtotal) VALUES
(@idOrden, @idEsmalte, 20, 0, 700.00, 14000.00),
(@idOrden, @idAceite,  15, 0, 380.00,  5700.00),
(@idOrden, @idSerum,   10, 0, 950.00,  9500.00);
GO

-- ============================================================
--  SECUENCIAS NCF (para poder emitir comprobantes)
-- ============================================================
INSERT INTO SecuenciaNCF (id_sucursal, id_tipo_ncf, prefijo, numero_actual, numero_hasta, fecha_vencimiento, activa)
VALUES
(1, (SELECT id_tipo_ncf FROM TipoNCF WHERE codigo='B02'), 'B02', 0, 1000, '2027-12-31', 1),
(1, (SELECT id_tipo_ncf FROM TipoNCF WHERE codigo='B01'), 'B01', 0, 500,  '2027-12-31', 1),
(1, (SELECT id_tipo_ncf FROM TipoNCF WHERE codigo='E32'), 'E32', 0, 1000, '2027-12-31', 1);
GO

-- ============================================================
--  NOTIFICACIONES DE PRUEBA
-- ============================================================
DECLARE @idUserGabriela BIGINT = (SELECT id_usuario FROM Usuario WHERE nombre_usuario = 'gabriela');
DECLARE @idUserDianaF   BIGINT = (SELECT id_usuario FROM Usuario WHERE nombre_usuario = 'diana_f');
DECLARE @idUserCajero   BIGINT = (SELECT id_usuario FROM Usuario WHERE nombre_usuario = 'cajero');

INSERT INTO Notificacion (id_usuario,id_cita,tipo,titulo,mensaje,canal,leida) VALUES
(@idUserGabriela,4,'Cita',   'Cita confirmada ✓','Tu masaje de piedras volcánicas está confirmado para mañana a las 10:00 AM con Nicole.','Sistema',0),
(@idUserGabriela,NULL,'Sistema','Bienvenida a AuraSpa 💜','Gracias por registrarte. Explora nuestro catálogo y agenda tu primera cita.','Sistema',1),
(@idUserDianaF,  5,'Cita',   'Cita pendiente de aprobación','Tu facial anti-edad está en proceso de confirmación. Te avisaremos pronto.','Sistema',0),
(@idUserCajero,  NULL,'CxC', 'Cuenta por cobrar vence pronto','Diana Lantigua tiene un balance de RD$1,200 pendiente. Vence en 30 días.','Sistema',0);
GO

-- ============================================================
--  VERIFICACIÓN FINAL
-- ============================================================
PRINT '';
PRINT '============================================================';
PRINT ' RESUMEN DE DATOS INSERTADOS';
PRINT '------------------------------------------------------------';
SELECT 'Empleados'   AS tabla, COUNT(*) AS registros FROM Empleado    UNION ALL
SELECT 'Usuarios',   COUNT(*) FROM Usuario     UNION ALL
SELECT 'Clientes',   COUNT(*) FROM Cliente     UNION ALL
SELECT 'Servicios',  COUNT(*) FROM ItemCatalogo WHERE tipo='Servicio' UNION ALL
SELECT 'Productos',  COUNT(*) FROM ItemCatalogo WHERE tipo='Producto' UNION ALL
SELECT 'Paquetes',   COUNT(*) FROM Paquete     UNION ALL
SELECT 'Cupones',    COUNT(*) FROM Cupon       UNION ALL
SELECT 'Citas',      COUNT(*) FROM Cita        UNION ALL
SELECT 'Ventas',     COUNT(*) FROM Venta       UNION ALL
SELECT 'Proveedores',COUNT(*) FROM Proveedor   UNION ALL
SELECT 'SecuenciasNCF',COUNT(*) FROM SecuenciaNCF;
PRINT '============================================================';
PRINT '';
PRINT ' CREDENCIALES DE ACCESO (contraseña: Admin123!)';
PRINT '  admin@auraspa.com      → Perfil: Admin';
PRINT '  cajero@auraspa.com     → Perfil: Cajero';
PRINT '  nicole@auraspa.com     → Perfil: Especialista';
PRINT '  valentina@auraspa.com  → Perfil: Especialista';
PRINT '  gabriela@email.com     → Perfil: Cliente';
PRINT '  diana.f@email.com      → Perfil: Cliente';
PRINT '============================================================';
GO
