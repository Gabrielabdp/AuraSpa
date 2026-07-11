-- ============================================================
--  AuraSpa — Upgrade v6 → v7
--  Solo agrega lo que NO existe: días no laborables (feriados/cierres)
--  Ejecutar sobre una AuraSpaDB que ya tiene el schema v6
-- ============================================================

USE AuraSpaDB;
GO

-- ============================================================
--  1. DIABLOQUEADO
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DiaBloqueado')
BEGIN
    CREATE TABLE DiaBloqueado (
        id_dia_bloqueado BIGINT       NOT NULL IDENTITY(1,1),
        fecha            DATETIME     NOT NULL,
        motivo           VARCHAR(200) NOT NULL,
        activo           BIT          NOT NULL DEFAULT 1,
        fecha_creacion   DATETIME     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT pk_diabloqueado PRIMARY KEY (id_dia_bloqueado),
        CONSTRAINT uq_diabloqueado_fecha UNIQUE (fecha)
    );
    PRINT '✓ DiaBloqueado creada';
END
ELSE PRINT '- DiaBloqueado ya existe';
GO
