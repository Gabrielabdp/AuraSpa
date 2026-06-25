-- ============================================================
--  AuraSpa — Upgrade v2 → v3
--  Solo agrega lo que NO existe: Inventario + Comprobante Fiscal
--  Ejecutar sobre una AuraSpaDB que ya tiene el schema v2
--  SQL Server · SSMS · DESKTOP-RH3N4KE\SQLEXPRESS
-- ============================================================

USE AuraSpaDB;
GO

-- ============================================================
--  1. Columna rnc_sucursal en Sucursal (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Sucursal') AND name = 'rnc_sucursal')
BEGIN
    ALTER TABLE Sucursal ADD rnc_sucursal VARCHAR(11) NULL;
    PRINT '✓ Sucursal.rnc_sucursal agregada';
END
ELSE PRINT '- Sucursal.rnc_sucursal ya existe';
GO

-- ============================================================
--  2. Columna stock_minimo en ItemCatalogoSucursal (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ItemCatalogoSucursal') AND name = 'stock_minimo')
BEGIN
    ALTER TABLE ItemCatalogoSucursal ADD stock_minimo INT NOT NULL DEFAULT 5;
    PRINT '✓ ItemCatalogoSucursal.stock_minimo agregada';
END
ELSE PRINT '- ItemCatalogoSucursal.stock_minimo ya existe';
GO

-- ============================================================
--  3. Corrección itbis_aplica: servicios exentos Art.344 Ley 11-92
-- ============================================================
UPDATE ItemCatalogo SET itbis_aplica = 0 WHERE tipo = 'Servicio';
UPDATE ItemCatalogo SET itbis_aplica = 1 WHERE tipo = 'Producto';
PRINT '✓ itbis_aplica corregido (0=Servicios exentos, 1=Productos)';
GO

-- ============================================================
--  4. Permisos de inventario y fiscal (si no existen)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Permiso WHERE codigo = 'inventario.ver')
    INSERT INTO Permiso (codigo, nombre, modulo) VALUES ('inventario.ver','Ver inventario','inventario');
IF NOT EXISTS (SELECT 1 FROM Permiso WHERE codigo = 'inventario.editar')
    INSERT INTO Permiso (codigo, nombre, modulo) VALUES ('inventario.editar','Editar inventario','inventario');
IF NOT EXISTS (SELECT 1 FROM Permiso WHERE codigo = 'comprobantes.emitir')
    INSERT INTO Permiso (codigo, nombre, modulo) VALUES ('comprobantes.emitir','Emitir comprobantes fiscales','fiscal');
IF NOT EXISTS (SELECT 1 FROM Permiso WHERE codigo = 'comprobantes.anular')
    INSERT INTO Permiso (codigo, nombre, modulo) VALUES ('comprobantes.anular','Anular comprobantes fiscales','fiscal');
PRINT '✓ Permisos de inventario y fiscal verificados';
GO

-- ============================================================
--  5. COMPROBANTE FISCAL
-- ============================================================

-- TipoNCF
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TipoNCF')
BEGIN
    CREATE TABLE TipoNCF (
        id_tipo_ncf  BIGINT       NOT NULL IDENTITY(1,1),
        codigo       VARCHAR(3)   NOT NULL,
        nombre       VARCHAR(80)  NOT NULL,
        descripcion  VARCHAR(200) NULL,
        requiere_rnc BIT          NOT NULL DEFAULT 0,
        activo       BIT          NOT NULL DEFAULT 1,
        CONSTRAINT pk_tiponcf     PRIMARY KEY (id_tipo_ncf),
        CONSTRAINT uq_tiponcf_cod UNIQUE (codigo)
    );
    PRINT '✓ TipoNCF creada';
END
ELSE PRINT '- TipoNCF ya existe';
GO

-- SecuenciaNCF
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecuenciaNCF')
BEGIN
    CREATE TABLE SecuenciaNCF (
        id_secuencia      BIGINT      NOT NULL IDENTITY(1,1),
        id_sucursal       BIGINT      NOT NULL,
        id_tipo_ncf       BIGINT      NOT NULL,
        prefijo           VARCHAR(3)  NOT NULL,
        numero_actual     BIGINT      NOT NULL DEFAULT 0,
        numero_hasta      BIGINT      NOT NULL,
        fecha_vencimiento DATE        NOT NULL,
        activa            BIT         NOT NULL DEFAULT 1,
        CONSTRAINT pk_secuenciancf        PRIMARY KEY (id_secuencia),
        CONSTRAINT uq_secuencia_suc_tipo  UNIQUE (id_sucursal, id_tipo_ncf),
        CONSTRAINT fk_secuencia_sucursal  FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal) ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_secuencia_tiponcf   FOREIGN KEY (id_tipo_ncf) REFERENCES TipoNCF(id_tipo_ncf)  ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    PRINT '✓ SecuenciaNCF creada';
END
ELSE PRINT '- SecuenciaNCF ya existe';
GO

-- ComprobanteFiscal
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ComprobanteFiscal')
BEGIN
    CREATE TABLE ComprobanteFiscal (
        id_comprobante      BIGINT         NOT NULL IDENTITY(1,1),
        id_venta            BIGINT         NOT NULL,
        id_sucursal         BIGINT         NOT NULL,
        id_tipo_ncf         BIGINT         NOT NULL,
        numero_comprobante  VARCHAR(19)    NOT NULL,
        rnc_cedula_receptor VARCHAR(11)    NULL,
        nombre_receptor     VARCHAR(150)   NULL,
        subtotal            DECIMAL(18,2)  NOT NULL,
        itbis               DECIMAL(18,2)  NOT NULL DEFAULT 0,
        total               DECIMAL(18,2)  NOT NULL,
        fecha_emision       DATETIME       NOT NULL DEFAULT GETDATE(),
        estado              VARCHAR(15)    NOT NULL DEFAULT 'Emitido',
        codigo_seguridad    VARCHAR(50)    NULL,
        fecha_certificacion DATETIME       NULL,
        xml_enviado         NVARCHAR(MAX)  NULL,
        xml_respuesta       NVARCHAR(MAX)  NULL,
        CONSTRAINT pk_comprobante         PRIMARY KEY (id_comprobante),
        CONSTRAINT uq_comprobante_numero  UNIQUE (numero_comprobante),
        CONSTRAINT chk_comprobante_estado CHECK (estado IN ('Emitido','Certificado','Anulado','Rechazado')),
        CONSTRAINT fk_comprobante_venta   FOREIGN KEY (id_venta)    REFERENCES Venta(id_venta)       ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_comprobante_suc     FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal) ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_comprobante_tipo    FOREIGN KEY (id_tipo_ncf) REFERENCES TipoNCF(id_tipo_ncf)  ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    CREATE INDEX ix_comprobante_venta ON ComprobanteFiscal (id_venta);
    PRINT '✓ ComprobanteFiscal creada';
END
ELSE PRINT '- ComprobanteFiscal ya existe';
GO

-- Seed TipoNCF
IF NOT EXISTS (SELECT 1 FROM TipoNCF WHERE codigo = 'B01')
BEGIN
    INSERT INTO TipoNCF (codigo, nombre, descripcion, requiere_rnc) VALUES
        ('B01','Factura de Crédito Fiscal',     'Para ventas a contribuyentes — requiere RNC del comprador',1),
        ('B02','Factura de Consumo',             'Para ventas a consumidores finales — no requiere RNC',0),
        ('B14','Factura Gubernamental',          'Para ventas al Estado dominicano',1),
        ('B15','Comprobante para Exportaciones', 'Para exportaciones',0),
        ('B16','Comprobante para Gastos Menores','Para gastos sin requisito fiscal',0),
        ('E31','Factura de Crédito Fiscal Electrónica','e-CF para contribuyentes',1),
        ('E32','Factura de Consumo Electrónica', 'e-CF para consumidores finales',0);
    PRINT '✓ Tipos de NCF insertados';
END
ELSE PRINT '- Tipos de NCF ya existen';
GO

-- ============================================================
--  6. INVENTARIO
-- ============================================================

-- Proveedor
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Proveedor')
BEGIN
    CREATE TABLE Proveedor (
        id_proveedor    BIGINT        NOT NULL IDENTITY(1,1),
        nombre          VARCHAR(150)  NOT NULL,
        rnc             VARCHAR(11)   NULL,
        contacto        VARCHAR(100)  NULL,
        telefono        VARCHAR(20)   NULL,
        email           VARCHAR(150)  NULL,
        direccion       VARCHAR(200)  NULL,
        activo          BIT           NOT NULL DEFAULT 1,
        fecha_registro  DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT pk_proveedor     PRIMARY KEY (id_proveedor),
        CONSTRAINT uq_proveedor_rnc UNIQUE (rnc)
    );
    PRINT '✓ Proveedor creada';
END
ELSE PRINT '- Proveedor ya existe';
GO

-- OrdenCompra
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrdenCompra')
BEGIN
    CREATE TABLE OrdenCompra (
        id_orden_compra   BIGINT         NOT NULL IDENTITY(1,1),
        numero_orden      VARCHAR(20)    NOT NULL,
        id_proveedor      BIGINT         NOT NULL,
        id_sucursal       BIGINT         NOT NULL,
        id_usuario        BIGINT         NOT NULL,
        fecha_emision     DATETIME       NOT NULL DEFAULT GETDATE(),
        fecha_esperada    DATE           NULL,
        fecha_recepcion   DATETIME       NULL,
        subtotal          DECIMAL(18,2)  NOT NULL DEFAULT 0,
        itbis             DECIMAL(18,2)  NOT NULL DEFAULT 0,
        total             DECIMAL(18,2)  NOT NULL DEFAULT 0,
        estado            VARCHAR(15)    NOT NULL DEFAULT 'Pendiente',
        notas             VARCHAR(300)   NULL,
        CONSTRAINT pk_ordencompra         PRIMARY KEY (id_orden_compra),
        CONSTRAINT uq_ordencompra_numero  UNIQUE (numero_orden),
        CONSTRAINT chk_ordencompra_estado CHECK (estado IN ('Pendiente','Recibida','Parcial','Cancelada')),
        CONSTRAINT fk_ordencompra_prov    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id_proveedor) ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_ordencompra_suc     FOREIGN KEY (id_sucursal)  REFERENCES Sucursal(id_sucursal)   ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_ordencompra_usr     FOREIGN KEY (id_usuario)   REFERENCES Usuario(id_usuario)     ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    PRINT '✓ OrdenCompra creada';
END
ELSE PRINT '- OrdenCompra ya existe';
GO

-- OrdenCompraDetalle
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrdenCompraDetalle')
BEGIN
    CREATE TABLE OrdenCompraDetalle (
        id_oc_detalle       BIGINT         NOT NULL IDENTITY(1,1),
        id_orden_compra     BIGINT         NOT NULL,
        id_item             BIGINT         NOT NULL,
        cantidad_pedida     INT            NOT NULL,
        cantidad_recibida   INT            NOT NULL DEFAULT 0,
        precio_unitario     DECIMAL(18,2)  NOT NULL,
        subtotal            DECIMAL(18,2)  NOT NULL,
        CONSTRAINT pk_ordencompradetalle   PRIMARY KEY (id_oc_detalle),
        CONSTRAINT chk_ocdetalle_cantidad  CHECK (cantidad_pedida > 0),
        CONSTRAINT chk_ocdetalle_recibida  CHECK (cantidad_recibida >= 0),
        CONSTRAINT fk_ocdetalle_orden      FOREIGN KEY (id_orden_compra) REFERENCES OrdenCompra(id_orden_compra) ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_ocdetalle_item       FOREIGN KEY (id_item)         REFERENCES ItemCatalogo(id_item)         ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    PRINT '✓ OrdenCompraDetalle creada';
END
ELSE PRINT '- OrdenCompraDetalle ya existe';
GO

-- MovimientoInventario
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'MovimientoInventario')
BEGIN
    CREATE TABLE MovimientoInventario (
        id_movimiento_inv   BIGINT         NOT NULL IDENTITY(1,1),
        id_item             BIGINT         NOT NULL,
        id_sucursal         BIGINT         NOT NULL,
        id_orden_compra     BIGINT         NULL,
        id_venta            BIGINT         NULL,
        id_usuario          BIGINT         NOT NULL,
        tipo                CHAR(1)        NOT NULL,
        cantidad            INT            NOT NULL,
        stock_antes         INT            NOT NULL,
        stock_despues       INT            NOT NULL,
        concepto            VARCHAR(200)   NOT NULL,
        fecha_hora          DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT pk_movimientoinv      PRIMARY KEY (id_movimiento_inv),
        CONSTRAINT chk_movinv_tipo       CHECK (tipo IN ('E','S','A')),
        CONSTRAINT chk_movinv_cantidad   CHECK (cantidad > 0),
        CONSTRAINT fk_movinv_item        FOREIGN KEY (id_item)         REFERENCES ItemCatalogo(id_item)           ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_movinv_sucursal    FOREIGN KEY (id_sucursal)     REFERENCES Sucursal(id_sucursal)           ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_movinv_ordencompra FOREIGN KEY (id_orden_compra) REFERENCES OrdenCompra(id_orden_compra)    ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_movinv_venta       FOREIGN KEY (id_venta)        REFERENCES Venta(id_venta)                 ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_movinv_usuario     FOREIGN KEY (id_usuario)      REFERENCES Usuario(id_usuario)             ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    CREATE INDEX ix_movinv_item ON MovimientoInventario (id_item, id_sucursal);
    PRINT '✓ MovimientoInventario creada';
END
ELSE PRINT '- MovimientoInventario ya existe';
GO

-- ============================================================
--  7. Secuencia de órdenes de compra (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_orden_compra')
BEGIN
    CREATE SEQUENCE seq_orden_compra START WITH 1 INCREMENT BY 1;
    PRINT '✓ seq_orden_compra creada';
END
ELSE PRINT '- seq_orden_compra ya existe';
GO

-- ============================================================
--  8. Notificación: agregar tipo Inventario si no existe en CHECK
--     (En SQL Server no se puede alterar un CHECK, hay que recrearlo)
-- ============================================================
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_notificacion_tipo' AND parent_object_id = OBJECT_ID('Notificacion'))
BEGIN
    -- Solo recrear si no incluye Inventario
    DECLARE @def NVARCHAR(MAX);
    SELECT @def = definition FROM sys.check_constraints
    WHERE name = 'chk_notificacion_tipo' AND parent_object_id = OBJECT_ID('Notificacion');
    IF @def NOT LIKE '%Inventario%'
    BEGIN
        ALTER TABLE Notificacion DROP CONSTRAINT chk_notificacion_tipo;
        ALTER TABLE Notificacion ADD CONSTRAINT chk_notificacion_tipo
            CHECK (tipo IN ('Cita','Orden','Sistema','Recordatorio','CxC','Pago','Inventario'));
        PRINT '✓ chk_notificacion_tipo actualizado con Inventario';
    END
    ELSE PRINT '- chk_notificacion_tipo ya incluye Inventario';
END
GO

-- ============================================================
--  RESUMEN FINAL
-- ============================================================
PRINT '';
PRINT '============================================================';
PRINT ' AuraSpaDB upgrade v2 → v3 completado';
PRINT '------------------------------------------------------------';
PRINT ' Tablas nuevas: TipoNCF · SecuenciaNCF · ComprobanteFiscal';
PRINT '                Proveedor · OrdenCompra · OrdenCompraDetalle';
PRINT '                MovimientoInventario';
PRINT ' Columnas nuevas: Sucursal.rnc_sucursal';
PRINT '                  ItemCatalogoSucursal.stock_minimo';
PRINT ' Datos: 7 tipos NCF · 4 permisos nuevos';
PRINT ' Corrección: itbis_aplica=0 para Servicios (Art.344 Ley 11-92)';
PRINT '============================================================';
PRINT 'Ejecuta ahora: AuraSpa_StoredProcedures_v2.sql';
GO
