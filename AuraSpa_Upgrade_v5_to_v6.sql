-- ============================================================
--  AuraSpa — Upgrade v5 → v6
--  Solo agrega lo que NO existe: reservas de productos (apartados)
--  Ejecutar sobre una AuraSpaDB que ya tiene el schema v5
-- ============================================================

USE AuraSpaDB;
GO

-- ============================================================
--  1. PRODUCTOAPARTADO
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProductoApartado')
BEGIN
    CREATE TABLE ProductoApartado (
        id_apartado       BIGINT        NOT NULL IDENTITY(1,1),
        id_usuario        BIGINT        NOT NULL,
        id_item           BIGINT        NOT NULL,
        cantidad          INT           NOT NULL,
        precio_unitario   DECIMAL(18,2) NOT NULL,
        subtotal          DECIMAL(18,2) NOT NULL,
        itbis             DECIMAL(18,2) NOT NULL,
        total             DECIMAL(18,2) NOT NULL,
        id_sucursal       BIGINT        NOT NULL,
        estado            VARCHAR(15)   NOT NULL DEFAULT 'Pendiente',
        fecha_reserva     DATETIME      NOT NULL DEFAULT GETDATE(),
        notas             VARCHAR(300)  NULL,
        CONSTRAINT pk_productoapartado        PRIMARY KEY (id_apartado),
        CONSTRAINT chk_productoapartado_estado CHECK (estado IN ('Pendiente','Retirado','Cancelado')),
        CONSTRAINT fk_productoapartado_usuario  FOREIGN KEY (id_usuario)  REFERENCES Usuario(id_usuario)     ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_productoapartado_item     FOREIGN KEY (id_item)     REFERENCES ItemCatalogo(id_item)   ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_productoapartado_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)   ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    PRINT '✓ ProductoApartado creada';
END
ELSE PRINT '- ProductoApartado ya existe';
GO
