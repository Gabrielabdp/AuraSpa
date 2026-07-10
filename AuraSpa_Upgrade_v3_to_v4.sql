-- ============================================================
--  AuraSpa — Upgrade v3 → v4
--  Solo agrega lo que NO existe: Programa de Lealtad (puntos,
--  código de referido) + tabla Resena
--  Ejecutar sobre una AuraSpaDB que ya tiene el schema v3
-- ============================================================

USE AuraSpaDB;
GO

-- ============================================================
--  1. Columna puntos en Cliente (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Cliente') AND name = 'puntos')
BEGIN
    ALTER TABLE Cliente ADD puntos INT NOT NULL DEFAULT 0;
    PRINT '✓ Cliente.puntos agregada';
END
ELSE PRINT '- Cliente.puntos ya existe';
GO

-- ============================================================
--  2. Columna codigo_referido en Cliente (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Cliente') AND name = 'codigo_referido')
BEGIN
    ALTER TABLE Cliente ADD codigo_referido VARCHAR(10) NULL;
    PRINT '✓ Cliente.codigo_referido agregada';
END
ELSE PRINT '- Cliente.codigo_referido ya existe';
GO

-- Backfill determinístico para clientes existentes sin código
UPDATE Cliente
SET codigo_referido = 'AURA' + RIGHT('00000' + CAST(id_cliente AS VARCHAR(10)), 5)
WHERE codigo_referido IS NULL;
GO

-- Índice único (permite múltiples NULL en SQL Server, seguro incluso antes del backfill)
-- Requiere QUOTED_IDENTIFIER ON para índices filtrados
SET QUOTED_IDENTIFIER ON;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_cliente_codigo_referido' AND object_id = OBJECT_ID('Cliente'))
BEGIN
    CREATE UNIQUE INDEX uq_cliente_codigo_referido ON Cliente(codigo_referido) WHERE codigo_referido IS NOT NULL;
    PRINT '✓ Índice único uq_cliente_codigo_referido creado';
END
ELSE PRINT '- uq_cliente_codigo_referido ya existe';
GO

-- ============================================================
--  3. Columna id_cliente_referidor en Cliente (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Cliente') AND name = 'id_cliente_referidor')
BEGIN
    ALTER TABLE Cliente ADD id_cliente_referidor BIGINT NULL;
    ALTER TABLE Cliente ADD CONSTRAINT fk_cliente_referidor FOREIGN KEY (id_cliente_referidor) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION;
    PRINT '✓ Cliente.id_cliente_referidor agregada';
END
ELSE PRINT '- Cliente.id_cliente_referidor ya existe';
GO

-- ============================================================
--  4. RESENA
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Resena')
BEGIN
    CREATE TABLE Resena (
        id_resena     BIGINT       NOT NULL IDENTITY(1,1),
        id_cliente    BIGINT       NOT NULL,
        id_cita       BIGINT       NOT NULL,
        calificacion  TINYINT      NOT NULL,
        comentario    VARCHAR(500) NULL,
        fecha         DATETIME     NOT NULL DEFAULT GETDATE(),
        visible       BIT          NOT NULL DEFAULT 1,
        CONSTRAINT pk_resena         PRIMARY KEY (id_resena),
        CONSTRAINT uq_resena_cita    UNIQUE (id_cita),
        CONSTRAINT chk_resena_calif  CHECK (calificacion BETWEEN 1 AND 5),
        CONSTRAINT fk_resena_cliente FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION,
        CONSTRAINT fk_resena_cita    FOREIGN KEY (id_cita)    REFERENCES Cita(id_cita)       ON UPDATE NO ACTION ON DELETE NO ACTION
    );
    PRINT '✓ Resena creada';
END
ELSE PRINT '- Resena ya existe';
GO
