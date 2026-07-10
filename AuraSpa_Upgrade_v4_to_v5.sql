-- ============================================================
--  AuraSpa — Upgrade v4 → v5
--  Solo agrega lo que NO existe: recuperación de contraseña
--  Ejecutar sobre una AuraSpaDB que ya tiene el schema v4
-- ============================================================

USE AuraSpaDB;
GO

-- ============================================================
--  1. Columna token_recuperacion en Usuario (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Usuario') AND name = 'token_recuperacion')
BEGIN
    ALTER TABLE Usuario ADD token_recuperacion VARCHAR(64) NULL;
    PRINT '✓ Usuario.token_recuperacion agregada';
END
ELSE PRINT '- Usuario.token_recuperacion ya existe';
GO

-- ============================================================
--  2. Columna token_recuperacion_expira en Usuario (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Usuario') AND name = 'token_recuperacion_expira')
BEGIN
    ALTER TABLE Usuario ADD token_recuperacion_expira DATETIME NULL;
    PRINT '✓ Usuario.token_recuperacion_expira agregada';
END
ELSE PRINT '- Usuario.token_recuperacion_expira ya existe';
GO
