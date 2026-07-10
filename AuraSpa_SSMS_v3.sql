-- ============================================================
--  AuraSpa — Schema Completo v3
--  SQL Server · SSMS · DESKTOP-RH3N4KE\SQLEXPRESS
--  Equipo 5 · IDS325L-01 · INTEC · 2026
--  v3: + Inventario (Proveedor, OrdenCompra, MovimientoInventario)
--      + ComprobanteFiscal (NCF para caja)
-- ============================================================

USE master;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AuraSpaDB')
    CREATE DATABASE AuraSpaDB;
GO
USE AuraSpaDB;
GO

-- ============================================================
--  DOMINIO 1: CATÁLOGOS Y CONFIGURACIÓN
-- ============================================================

CREATE TABLE TipoDocumento (
    id_tipo_doc     BIGINT        NOT NULL IDENTITY(1,1),
    codigo          VARCHAR(5)    NOT NULL,
    nombre          VARCHAR(80)   NOT NULL,
    descripcion     VARCHAR(200)  NULL,
    longitud_min    SMALLINT      NULL,
    longitud_max    SMALLINT      NULL,
    solo_numeros    BIT           NOT NULL DEFAULT 0,
    requiere_pais   BIT           NOT NULL DEFAULT 0,
    activo          BIT           NOT NULL DEFAULT 1,
    CONSTRAINT pk_tipodocumento     PRIMARY KEY (id_tipo_doc),
    CONSTRAINT uq_tipodocumento_cod UNIQUE (codigo)
);
GO

CREATE TABLE Pais (
    id_pais  BIGINT       NOT NULL IDENTITY(1,1),
    codigo   VARCHAR(3)   NOT NULL,
    nombre   VARCHAR(80)  NOT NULL,
    CONSTRAINT pk_pais     PRIMARY KEY (id_pais),
    CONSTRAINT uq_pais_cod UNIQUE (codigo)
);
GO

CREATE TABLE Sucursal (
    id_sucursal       BIGINT        NOT NULL IDENTITY(1,1),
    nombre            VARCHAR(100)  NOT NULL,
    direccion         VARCHAR(200)  NOT NULL,
    telefono          VARCHAR(20)   NULL,
    email_contacto    VARCHAR(150)  NULL,
    rnc_sucursal      VARCHAR(11)   NULL,   -- RNC propio para comprobantes fiscales
    activa            BIT           NOT NULL DEFAULT 1,
    horario_apertura  TIME          NULL,
    horario_cierre    TIME          NULL,
    fecha_creacion    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_sucursal PRIMARY KEY (id_sucursal)
);
GO

CREATE TABLE Perfil (
    id_perfil    BIGINT       NOT NULL IDENTITY(1,1),
    nombre       VARCHAR(50)  NOT NULL,
    descripcion  VARCHAR(200) NULL,
    activo       BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_perfil        PRIMARY KEY (id_perfil),
    CONSTRAINT uq_perfil_nombre UNIQUE (nombre)
);
GO

CREATE TABLE Permiso (
    id_permiso  BIGINT        NOT NULL IDENTITY(1,1),
    codigo      VARCHAR(60)   NOT NULL,
    nombre      VARCHAR(100)  NOT NULL,
    modulo      VARCHAR(40)   NOT NULL,
    CONSTRAINT pk_permiso     PRIMARY KEY (id_permiso),
    CONSTRAINT uq_permiso_cod UNIQUE (codigo)
);
GO

CREATE TABLE PerfilPermiso (
    id_perfil   BIGINT  NOT NULL,
    id_permiso  BIGINT  NOT NULL,
    CONSTRAINT pk_perfilpermiso         PRIMARY KEY (id_perfil, id_permiso),
    CONSTRAINT fk_perfilpermiso_perfil  FOREIGN KEY (id_perfil)  REFERENCES Perfil(id_perfil)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_perfilpermiso_permiso FOREIGN KEY (id_permiso) REFERENCES Permiso(id_permiso) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE MetodoPago (
    id_metodo_pago  BIGINT       NOT NULL IDENTITY(1,1),
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(60)  NOT NULL,
    activo          BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_metodopago     PRIMARY KEY (id_metodo_pago),
    CONSTRAINT uq_metodopago_cod UNIQUE (codigo)
);
GO

CREATE TABLE CategoriaServicio (
    id_categoria  BIGINT       NOT NULL IDENTITY(1,1),
    nombre        VARCHAR(50)  NOT NULL,
    descripcion   VARCHAR(200) NULL,
    icono_url     VARCHAR(200) NULL,
    orden_display SMALLINT     NOT NULL DEFAULT 0,
    activa        BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_categoriaservicio     PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoriaservicio_nom UNIQUE (nombre)
);
GO

-- ============================================================
--  DOMINIO 2: PERSONAS Y SEGURIDAD
-- ============================================================

CREATE TABLE Cliente (
    id_cliente            BIGINT        NOT NULL IDENTITY(1,1),
    id_tipo_doc           BIGINT        NOT NULL,
    numero_documento      VARCHAR(20)   NOT NULL,
    id_pais_doc           BIGINT        NULL,
    nombres               VARCHAR(80)   NOT NULL,
    apellidos             VARCHAR(80)   NOT NULL,
    fecha_nacimiento      DATE          NULL,
    genero                VARCHAR(10)   NULL,
    email                 VARCHAR(150)  NULL,
    telefono              VARCHAR(20)   NULL,
    telefono_alt          VARCHAR(20)   NULL,
    direccion             VARCHAR(200)  NULL,
    activo                BIT           NOT NULL DEFAULT 1,
    fecha_registro        DATETIME      NOT NULL DEFAULT GETDATE(),
    puntos                INT           NOT NULL DEFAULT 0,
    codigo_referido       VARCHAR(10)   NULL,
    id_cliente_referidor  BIGINT        NULL,
    CONSTRAINT pk_cliente     PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_doc UNIQUE (id_tipo_doc, numero_documento),
    CONSTRAINT fk_cliente_tipodoc   FOREIGN KEY (id_tipo_doc)          REFERENCES TipoDocumento(id_tipo_doc) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cliente_pais      FOREIGN KEY (id_pais_doc)          REFERENCES Pais(id_pais)              ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cliente_referidor FOREIGN KEY (id_cliente_referidor) REFERENCES Cliente(id_cliente)        ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

SET QUOTED_IDENTIFIER ON;
GO
CREATE UNIQUE INDEX uq_cliente_codigo_referido ON Cliente(codigo_referido) WHERE codigo_referido IS NOT NULL;
GO

CREATE TABLE Empleado (
    id_empleado         BIGINT       NOT NULL IDENTITY(1,1),
    id_tipo_doc         BIGINT       NOT NULL,
    numero_documento    VARCHAR(20)  NOT NULL,
    id_pais_doc         BIGINT       NULL,
    nombres             VARCHAR(80)  NOT NULL,
    apellidos           VARCHAR(80)  NOT NULL,
    fecha_nacimiento    DATE         NULL,
    email_personal      VARCHAR(150) NULL,
    email_empresarial   VARCHAR(150) NULL,
    telefono            VARCHAR(20)  NULL,
    tipo_empleado       VARCHAR(20)  NOT NULL DEFAULT 'Especialista',
    activo              BIT          NOT NULL DEFAULT 1,
    fecha_ingreso       DATE         NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    id_sucursal         BIGINT       NOT NULL,
    CONSTRAINT pk_empleado        PRIMARY KEY (id_empleado),
    CONSTRAINT uq_empleado_doc    UNIQUE (id_tipo_doc, numero_documento),
    CONSTRAINT chk_empleado_tipo  CHECK (tipo_empleado IN ('Especialista','Cajero','Admin','Supervisor')),
    CONSTRAINT fk_empleado_tipodoc  FOREIGN KEY (id_tipo_doc) REFERENCES TipoDocumento(id_tipo_doc) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_empleado_pais     FOREIGN KEY (id_pais_doc) REFERENCES Pais(id_pais)              ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_empleado_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)      ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE EmpleadoCategoria (
    id_empleado   BIGINT       NOT NULL,
    id_categoria  BIGINT       NOT NULL,
    nivel         VARCHAR(20)  NOT NULL DEFAULT 'Junior',
    activo        BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_empleadocategoria      PRIMARY KEY (id_empleado, id_categoria),
    CONSTRAINT chk_empcategoria_nivel    CHECK (nivel IN ('Junior','Intermedio','Senior')),
    CONSTRAINT fk_empcategoria_empleado  FOREIGN KEY (id_empleado)  REFERENCES Empleado(id_empleado)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_empcategoria_categoria FOREIGN KEY (id_categoria) REFERENCES CategoriaServicio(id_categoria) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Usuario (
    id_usuario          BIGINT        NOT NULL IDENTITY(1,1),
    email               VARCHAR(150)  NOT NULL,
    nombre_usuario      VARCHAR(50)   NULL,
    contrasena_hash     VARCHAR(256)  NOT NULL,
    nombre              VARCHAR(100)  NOT NULL,
    apellido            VARCHAR(100)  NOT NULL,
    telefono            VARCHAR(20)   NULL,
    id_perfil           BIGINT        NOT NULL,
    id_cliente          BIGINT        NULL,
    id_empleado         BIGINT        NULL,
    activo              BIT           NOT NULL DEFAULT 1,
    verificado          BIT           NOT NULL DEFAULT 0,
    token_verificacion  VARCHAR(255)  NULL,
    token_recuperacion  VARCHAR(64)   NULL,
    token_recuperacion_expira DATETIME NULL,
    intentos_fallidos   SMALLINT      NOT NULL DEFAULT 0,
    bloqueado_hasta     DATETIME      NULL,
    fecha_registro      DATETIME      NOT NULL DEFAULT GETDATE(),
    ultimo_acceso       DATETIME      NULL,
    CONSTRAINT pk_usuario          PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email    UNIQUE (email),
    CONSTRAINT uq_usuario_username UNIQUE (nombre_usuario),
    CONSTRAINT fk_usuario_perfil   FOREIGN KEY (id_perfil)   REFERENCES Perfil(id_perfil)     ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_usuario_cliente  FOREIGN KEY (id_cliente)  REFERENCES Cliente(id_cliente)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_usuario_empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE UsuarioTwoFactor (
    id_2fa              BIGINT      NOT NULL IDENTITY(1,1),
    id_usuario          BIGINT      NOT NULL,
    secret_key          VARCHAR(64) NOT NULL,
    habilitado          BIT         NOT NULL DEFAULT 0,
    fecha_activacion    DATETIME    NULL,
    ultimo_codigo_usado VARCHAR(6)  NULL,
    CONSTRAINT pk_usuariotwofactor  PRIMARY KEY (id_2fa),
    CONSTRAINT uq_twofactor_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_twofactor_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Sesion (
    id_sesion    BIGINT        NOT NULL IDENTITY(1,1),
    id_usuario   BIGINT        NOT NULL,
    token_hash   VARCHAR(255)  NOT NULL,
    ip_origen    VARCHAR(45)   NULL,
    user_agent   VARCHAR(500)  NULL,
    fecha_inicio DATETIME      NOT NULL DEFAULT GETDATE(),
    fecha_expira DATETIME      NOT NULL,
    activa       BIT           NOT NULL DEFAULT 1,
    CONSTRAINT pk_sesion         PRIMARY KEY (id_sesion),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE RecuperacionContrasena (
    id_recuperacion BIGINT        NOT NULL IDENTITY(1,1),
    id_usuario      BIGINT        NOT NULL,
    token_hash      VARCHAR(255)  NOT NULL,
    fecha_solicitud DATETIME      NOT NULL DEFAULT GETDATE(),
    fecha_expira    DATETIME      NOT NULL,
    usado           BIT           NOT NULL DEFAULT 0,
    CONSTRAINT pk_recuperacion        PRIMARY KEY (id_recuperacion),
    CONSTRAINT uq_recuperacion_token  UNIQUE (token_hash),
    CONSTRAINT fk_recuperacion_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 3: CATÁLOGO DE SERVICIOS Y PRODUCTOS
-- ============================================================

CREATE TABLE ItemCatalogo (
    id_item           BIGINT         NOT NULL IDENTITY(1,1),
    nombre            VARCHAR(100)   NOT NULL,
    descripcion       VARCHAR(500)   NOT NULL DEFAULT '',
    precio_base       DECIMAL(18,2)  NOT NULL,
    tipo              VARCHAR(10)    NOT NULL,
    imagen_url        VARCHAR(200)   NULL,
    id_categoria      BIGINT         NULL,
    duracion_minutos  INT            NULL,
    precio_variable   BIT            NOT NULL DEFAULT 0,
    itbis_aplica      BIT            NOT NULL DEFAULT 0, -- Servicios exentos Art.344 Ley 11-92
    activo            BIT            NOT NULL DEFAULT 1,
    CONSTRAINT pk_itemcatalogo   PRIMARY KEY (id_item),
    CONSTRAINT chk_item_tipo     CHECK (tipo IN ('Servicio','Producto')),
    CONSTRAINT chk_item_precio   CHECK (precio_base >= 0),
    CONSTRAINT fk_item_categoria FOREIGN KEY (id_categoria) REFERENCES CategoriaServicio(id_categoria) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE ItemCatalogoSucursal (
    id_item_sucursal  BIGINT         NOT NULL IDENTITY(1,1),
    id_item           BIGINT         NOT NULL,
    id_sucursal       BIGINT         NOT NULL,
    precio_override   DECIMAL(18,2)  NULL,
    stock             INT            NULL,
    disponible        BIT            NOT NULL DEFAULT 1,
    stock_minimo      INT            NOT NULL DEFAULT 5, -- umbral de alerta
    CONSTRAINT pk_itemsucursal      PRIMARY KEY (id_item_sucursal),
    CONSTRAINT uq_itemsucursal      UNIQUE (id_item, id_sucursal),
    CONSTRAINT fk_itemsucursal_item FOREIGN KEY (id_item)     REFERENCES ItemCatalogo(id_item)  ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_itemsucursal_suc  FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Paquete (
    id_paquete      BIGINT         NOT NULL IDENTITY(1,1),
    nombre          VARCHAR(100)   NOT NULL,
    descripcion     VARCHAR(300)   NULL,
    precio_total    DECIMAL(18,2)  NOT NULL,
    total_sesiones  INT            NOT NULL,
    vigencia_dias   INT            NULL,
    id_item         BIGINT         NULL,
    activo          BIT            NOT NULL DEFAULT 1,
    CONSTRAINT pk_paquete           PRIMARY KEY (id_paquete),
    CONSTRAINT chk_paquete_sesiones CHECK (total_sesiones > 0),
    CONSTRAINT chk_paquete_precio   CHECK (precio_total   > 0),
    CONSTRAINT fk_paquete_item      FOREIGN KEY (id_item) REFERENCES ItemCatalogo(id_item) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE ClientePaquete (
    id_cli_paquete      BIGINT       NOT NULL IDENTITY(1,1),
    id_cliente          BIGINT       NOT NULL,
    id_paquete          BIGINT       NOT NULL,
    sesiones_totales    INT          NOT NULL,
    sesiones_restantes  INT          NOT NULL,
    fecha_adquisicion   DATETIME     NOT NULL DEFAULT GETDATE(),
    fecha_expiracion    DATETIME     NULL,
    estado              VARCHAR(10)  NOT NULL DEFAULT 'Activo',
    CONSTRAINT pk_clientepaquete       PRIMARY KEY (id_cli_paquete),
    CONSTRAINT chk_clipaquete_estado   CHECK (estado IN ('Activo','Consumido','Expirado')),
    CONSTRAINT chk_clipaquete_sesiones CHECK (sesiones_restantes >= 0),
    CONSTRAINT fk_clipaquete_cliente   FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_clipaquete_paquete   FOREIGN KEY (id_paquete) REFERENCES Paquete(id_paquete) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Cupon (
    id_cupon          BIGINT         NOT NULL IDENTITY(1,1),
    codigo            VARCHAR(30)    NOT NULL,
    tipo_descuento    VARCHAR(10)    NOT NULL,
    valor             DECIMAL(10,2)  NOT NULL,
    fecha_inicio      DATETIME       NOT NULL,
    fecha_expiracion  DATETIME       NOT NULL,
    usos_maximos      INT            NULL,
    usos_actuales     INT            NOT NULL DEFAULT 0,
    solo_primer_uso   BIT            NOT NULL DEFAULT 0,
    activo            BIT            NOT NULL DEFAULT 1,
    CONSTRAINT pk_cupon         PRIMARY KEY (id_cupon),
    CONSTRAINT uq_cupon_codigo  UNIQUE (codigo),
    CONSTRAINT chk_cupon_tipo   CHECK (tipo_descuento IN ('PORCENTAJE','MONTO')),
    CONSTRAINT chk_cupon_valor  CHECK (valor > 0),
    CONSTRAINT chk_cupon_fechas CHECK (fecha_expiracion > fecha_inicio)
);
GO

-- ============================================================
--  DOMINIO 4: INSTALACIONES
-- ============================================================

CREATE TABLE Cabina (
    id_cabina     BIGINT       NOT NULL IDENTITY(1,1),
    nombre        VARCHAR(50)  NOT NULL,
    id_categoria  BIGINT       NULL,
    id_sucursal   BIGINT       NOT NULL,
    activa        BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_cabina           PRIMARY KEY (id_cabina),
    CONSTRAINT fk_cabina_categoria FOREIGN KEY (id_categoria) REFERENCES CategoriaServicio(id_categoria) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cabina_sucursal  FOREIGN KEY (id_sucursal)  REFERENCES Sucursal(id_sucursal)           ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 5: CITAS Y AGENDAMIENTO
-- ============================================================

CREATE TABLE Cita (
    id_cita                 BIGINT         NOT NULL IDENTITY(1,1),
    id_cliente              BIGINT         NOT NULL,
    id_empleado             BIGINT         NULL,
    id_item                 BIGINT         NOT NULL,
    id_cabina               BIGINT         NULL,
    id_sucursal             BIGINT         NOT NULL,
    id_metodo_pago          BIGINT         NULL,
    fecha_hora              DATETIME       NOT NULL,
    duracion_minutos        INT            NULL,
    precio_acordado         DECIMAL(18,2)  NULL,
    estado                  VARCHAR(15)    NOT NULL DEFAULT 'Pendiente',
    notas                   VARCHAR(300)   NULL,
    fecha_creacion          DATETIME       NOT NULL DEFAULT GETDATE(),
    tipo_facial             VARCHAR(30)    NULL,
    tipo_piel               VARCHAR(20)    NULL,
    tipo_masaje             VARCHAR(30)    NULL,
    duracion_masaje_min     INT            NULL,
    zona_depilacion         VARCHAR(30)    NULL,
    metodo_depilacion       VARCHAR(20)    NULL,
    subservicio_cejas       VARCHAR(30)    NULL,
    tiene_trabajo_anterior  BIT            NULL,
    tipo_unias              VARCHAR(30)    NULL,
    incluye_remocion        BIT            NULL,
    tipo_servicio_pelo      VARCHAR(30)    NULL,
    largo_cabello           VARCHAR(15)    NULL,
    CONSTRAINT pk_cita            PRIMARY KEY (id_cita),
    CONSTRAINT chk_cita_estado    CHECK (estado IN ('Pendiente','Confirmada','Completada','Cancelada','Rechazada')),
    CONSTRAINT fk_cita_cliente    FOREIGN KEY (id_cliente)     REFERENCES Cliente(id_cliente)         ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cita_empleado   FOREIGN KEY (id_empleado)    REFERENCES Empleado(id_empleado)       ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cita_item       FOREIGN KEY (id_item)        REFERENCES ItemCatalogo(id_item)        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cita_cabina     FOREIGN KEY (id_cabina)      REFERENCES Cabina(id_cabina)            ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cita_sucursal   FOREIGN KEY (id_sucursal)    REFERENCES Sucursal(id_sucursal)        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cita_metodopago FOREIGN KEY (id_metodo_pago) REFERENCES MetodoPago(id_metodo_pago)   ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX uq_cita_horario_especialista
    ON Cita (id_empleado, fecha_hora)
    WHERE id_empleado IS NOT NULL;
GO

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
GO

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
GO

CREATE TABLE ConsentimientoInformado (
    id_consentimiento       BIGINT           NOT NULL IDENTITY(1,1),
    id_cita                 BIGINT           NOT NULL,
    id_cliente              BIGINT           NOT NULL,
    texto_consentimiento    NVARCHAR(MAX)    NOT NULL,
    aceptado                BIT              NOT NULL DEFAULT 0,
    fecha_firma             DATETIME         NULL,
    firma_digital           NVARCHAR(MAX)    NULL,
    CONSTRAINT pk_consentimiento      PRIMARY KEY (id_consentimiento),
    CONSTRAINT uq_consentimiento_cita UNIQUE (id_cita),
    CONSTRAINT fk_consent_cita        FOREIGN KEY (id_cita)    REFERENCES Cita(id_cita)       ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_consent_cliente     FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Resena (
    id_resena    BIGINT       NOT NULL IDENTITY(1,1),
    id_cliente   BIGINT       NOT NULL,
    id_cita      BIGINT       NOT NULL,
    calificacion TINYINT      NOT NULL,
    comentario   VARCHAR(500) NULL,
    fecha        DATETIME     NOT NULL DEFAULT GETDATE(),
    visible      BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_resena               PRIMARY KEY (id_resena),
    CONSTRAINT uq_resena_cita          UNIQUE (id_cita),
    CONSTRAINT chk_resena_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    CONSTRAINT fk_resena_cliente       FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_resena_cita          FOREIGN KEY (id_cita)    REFERENCES Cita(id_cita)       ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE ExpedienteClinico (
    id_expediente         BIGINT         NOT NULL IDENTITY(1,1),
    id_cliente            BIGINT         NOT NULL,
    tipo_piel             VARCHAR(30)    NULL,
    alergias              NVARCHAR(MAX)  NULL,
    condiciones_medicas   NVARCHAR(MAX)  NULL,
    medicamentos          NVARCHAR(MAX)  NULL,
    notas_especialista    NVARCHAR(MAX)  NULL,
    ultima_actualizacion  DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_expediente         PRIMARY KEY (id_expediente),
    CONSTRAINT uq_expediente_cliente UNIQUE (id_cliente),
    CONSTRAINT fk_expediente_cliente FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE GaleriaServicio (
    id_foto      BIGINT       NOT NULL IDENTITY(1,1),
    id_cita      BIGINT       NOT NULL,
    id_empleado  BIGINT       NOT NULL,
    url_antes    VARCHAR(300) NULL,
    url_despues  VARCHAR(300) NULL,
    descripcion  VARCHAR(200) NULL,
    fecha_subida DATETIME     NOT NULL DEFAULT GETDATE(),
    publica      BIT          NOT NULL DEFAULT 0,
    CONSTRAINT pk_galeria          PRIMARY KEY (id_foto),
    CONSTRAINT fk_galeria_cita     FOREIGN KEY (id_cita)     REFERENCES Cita(id_cita)         ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_galeria_empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 6: VENTAS Y CAJA
-- ============================================================

CREATE TABLE SesionCaja (
    id_sesion_caja  BIGINT         NOT NULL IDENTITY(1,1),
    id_usuario      BIGINT         NOT NULL,
    id_sucursal     BIGINT         NOT NULL,
    fecha_apertura  DATETIME       NOT NULL DEFAULT GETDATE(),
    fecha_cierre    DATETIME       NULL,
    monto_inicial   DECIMAL(18,2)  NOT NULL,
    monto_final     DECIMAL(18,2)  NULL,
    diferencia      DECIMAL(18,2)  NULL,
    justificacion   VARCHAR(300)   NULL,
    notas_apertura  VARCHAR(200)   NULL,
    estado          VARCHAR(10)    NOT NULL DEFAULT 'Abierta',
    CONSTRAINT pk_sesioncaja         PRIMARY KEY (id_sesion_caja),
    CONSTRAINT chk_sesioncaja_estado CHECK (estado IN ('Abierta','Cerrada')),
    CONSTRAINT chk_sesioncaja_monto  CHECK (monto_inicial >= 0),
    CONSTRAINT fk_sesioncaja_usuario  FOREIGN KEY (id_usuario)  REFERENCES Usuario(id_usuario)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_sesioncaja_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Venta (
    id_venta        BIGINT         NOT NULL IDENTITY(1,1),
    numero_factura  VARCHAR(20)    NOT NULL,
    id_cliente      BIGINT         NULL,
    id_usuario      BIGINT         NULL,
    id_sesion_caja  BIGINT         NULL,
    id_metodo_pago  BIGINT         NULL,
    id_cupon        BIGINT         NULL,
    fecha           DATETIME       NOT NULL DEFAULT GETDATE(),
    subtotal        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    itbis           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    descuento       DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    condicion_pago  VARCHAR(10)    NOT NULL DEFAULT 'Contado',
    tipo_venta      VARCHAR(5)     NOT NULL DEFAULT 'POS',
    estado          VARCHAR(15)    NOT NULL DEFAULT 'Completada',
    CONSTRAINT pk_venta           PRIMARY KEY (id_venta),
    CONSTRAINT uq_venta_factura   UNIQUE (numero_factura),
    CONSTRAINT chk_venta_condicion CHECK (condicion_pago IN ('Contado','Credito')),
    CONSTRAINT chk_venta_tipo     CHECK (tipo_venta IN ('POS','Web')),
    CONSTRAINT chk_venta_estado   CHECK (estado IN ('Completada','Pendiente','Cancelada','Credito')),
    CONSTRAINT fk_venta_cliente    FOREIGN KEY (id_cliente)     REFERENCES Cliente(id_cliente)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_venta_usuario    FOREIGN KEY (id_usuario)     REFERENCES Usuario(id_usuario)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_venta_sesioncaja FOREIGN KEY (id_sesion_caja) REFERENCES SesionCaja(id_sesion_caja)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_venta_metodopago FOREIGN KEY (id_metodo_pago) REFERENCES MetodoPago(id_metodo_pago)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_venta_cupon      FOREIGN KEY (id_cupon)       REFERENCES Cupon(id_cupon)               ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE VentaDetalle (
    id_detalle      BIGINT         NOT NULL IDENTITY(1,1),
    id_venta        BIGINT         NOT NULL,
    id_item         BIGINT         NOT NULL,
    id_empleado     BIGINT         NULL,
    cantidad        INT            NOT NULL,
    precio_unitario DECIMAL(18,2)  NOT NULL,
    descuento_linea DECIMAL(18,2)  NOT NULL DEFAULT 0,
    subtotal        DECIMAL(18,2)  NOT NULL,
    CONSTRAINT pk_ventadetalle           PRIMARY KEY (id_detalle),
    CONSTRAINT chk_ventadetalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT fk_ventadetalle_venta     FOREIGN KEY (id_venta)    REFERENCES Venta(id_venta)       ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ventadetalle_item      FOREIGN KEY (id_item)     REFERENCES ItemCatalogo(id_item)  ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ventadetalle_empleado  FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE MovimientoCaja (
    id_movimiento           BIGINT         NOT NULL IDENTITY(1,1),
    id_sesion_caja          BIGINT         NOT NULL,
    id_venta                BIGINT         NULL,
    concepto                VARCHAR(200)   NOT NULL,
    tipo                    CHAR(1)        NOT NULL,
    monto                   DECIMAL(18,2)  NOT NULL,
    id_metodo_pago          BIGINT         NULL,
    fecha_hora              DATETIME       NOT NULL DEFAULT GETDATE(),
    id_usuario              BIGINT         NOT NULL,
    estado_sincronizacion   VARCHAR(15)    NOT NULL DEFAULT 'Sincronizado',
    CONSTRAINT pk_movimientocaja        PRIMARY KEY (id_movimiento),
    CONSTRAINT chk_movimiento_tipo      CHECK (tipo IN ('I','E')),
    CONSTRAINT chk_movimiento_monto     CHECK (monto > 0),
    CONSTRAINT chk_movimiento_sync      CHECK (estado_sincronizacion IN ('Sincronizado','Pendiente','Error')),
    CONSTRAINT fk_movimiento_sesion     FOREIGN KEY (id_sesion_caja) REFERENCES SesionCaja(id_sesion_caja)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movimiento_venta      FOREIGN KEY (id_venta)       REFERENCES Venta(id_venta)              ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movimiento_metodopago FOREIGN KEY (id_metodo_pago) REFERENCES MetodoPago(id_metodo_pago)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movimiento_usuario    FOREIGN KEY (id_usuario)     REFERENCES Usuario(id_usuario)          ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Cotizacion (
    id_cotizacion       BIGINT         NOT NULL IDENTITY(1,1),
    numero_cotizacion   VARCHAR(20)    NOT NULL,
    id_cliente          BIGINT         NULL,
    id_empleado         BIGINT         NULL,
    id_usuario          BIGINT         NOT NULL,
    fecha               DATETIME       NOT NULL DEFAULT GETDATE(),
    fecha_vigencia      DATETIME       NULL,
    subtotal            DECIMAL(18,2)  NOT NULL DEFAULT 0,
    itbis               DECIMAL(18,2)  NOT NULL DEFAULT 0,
    descuento           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total               DECIMAL(18,2)  NOT NULL DEFAULT 0,
    estado              VARCHAR(15)    NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT pk_cotizacion         PRIMARY KEY (id_cotizacion),
    CONSTRAINT uq_cotizacion_numero  UNIQUE (numero_cotizacion),
    CONSTRAINT chk_cotizacion_estado CHECK (estado IN ('Pendiente','Facturada','Expirada','Cancelada')),
    CONSTRAINT fk_cotizacion_cliente  FOREIGN KEY (id_cliente)  REFERENCES Cliente(id_cliente)   ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cotizacion_empleado FOREIGN KEY (id_empleado) REFERENCES Empleado(id_empleado) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cotizacion_usuario  FOREIGN KEY (id_usuario)  REFERENCES Usuario(id_usuario)   ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE CotizacionDetalle (
    id_cot_detalle  BIGINT         NOT NULL IDENTITY(1,1),
    id_cotizacion   BIGINT         NOT NULL,
    id_item         BIGINT         NOT NULL,
    cantidad        INT            NOT NULL,
    precio_unitario DECIMAL(18,2)  NOT NULL,
    subtotal        DECIMAL(18,2)  NOT NULL,
    CONSTRAINT pk_cotizaciondetalle     PRIMARY KEY (id_cot_detalle),
    CONSTRAINT chk_cotdetalle_cantidad  CHECK (cantidad > 0),
    CONSTRAINT fk_cotdetalle_cotizacion FOREIGN KEY (id_cotizacion) REFERENCES Cotizacion(id_cotizacion) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cotdetalle_item       FOREIGN KEY (id_item)       REFERENCES ItemCatalogo(id_item)      ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE CuentaPorCobrar (
    id_cxc            BIGINT         NOT NULL IDENTITY(1,1),
    id_venta          BIGINT         NOT NULL,
    id_cliente        BIGINT         NOT NULL,
    monto_original    DECIMAL(18,2)  NOT NULL,
    monto_abonado     DECIMAL(18,2)  NOT NULL DEFAULT 0,
    saldo_pendiente   AS (monto_original - monto_abonado),
    dias_mora         AS (CASE WHEN GETDATE() > fecha_vencimiento
                               THEN DATEDIFF(DAY, fecha_vencimiento, GETDATE())
                               ELSE 0 END),
    fecha_vencimiento DATETIME       NOT NULL,
    estado            VARCHAR(10)    NOT NULL DEFAULT 'Pendiente',
    notas             VARCHAR(200)   NULL,
    fecha_creacion    DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_cuentaporcobrar  PRIMARY KEY (id_cxc),
    CONSTRAINT chk_cxc_estado      CHECK (estado IN ('Pendiente','Parcial','Saldada','Vencida')),
    CONSTRAINT chk_cxc_monto       CHECK (monto_original > 0),
    CONSTRAINT chk_cxc_abonado     CHECK (monto_abonado >= 0),
    CONSTRAINT fk_cxc_venta        FOREIGN KEY (id_venta)   REFERENCES Venta(id_venta)     ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_cxc_cliente      FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 7: COMPROBANTE FISCAL (NCF)
--  Ley 32-23 · DGII · República Dominicana
--  Manejado principalmente desde el módulo Caja
-- ============================================================

CREATE TABLE TipoNCF (
    id_tipo_ncf  BIGINT       NOT NULL IDENTITY(1,1),
    codigo       VARCHAR(3)   NOT NULL,   -- B01, B02, B14, B15, B16, E31, E32
    nombre       VARCHAR(80)  NOT NULL,
    descripcion  VARCHAR(200) NULL,
    requiere_rnc BIT          NOT NULL DEFAULT 0, -- B01 y B14 requieren RNC del cliente
    activo       BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_tiponcf     PRIMARY KEY (id_tipo_ncf),
    CONSTRAINT uq_tiponcf_cod UNIQUE (codigo)
);
GO

CREATE TABLE SecuenciaNCF (
    id_secuencia    BIGINT       NOT NULL IDENTITY(1,1),
    id_sucursal     BIGINT       NOT NULL,
    id_tipo_ncf     BIGINT       NOT NULL,
    prefijo         VARCHAR(3)   NOT NULL,   -- E31, B01, etc.
    numero_actual   BIGINT       NOT NULL DEFAULT 0,
    numero_hasta    BIGINT       NOT NULL,   -- tope autorizado por DGII
    fecha_vencimiento DATE       NOT NULL,
    activa          BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_secuenciancf       PRIMARY KEY (id_secuencia),
    CONSTRAINT uq_secuencia_suc_tipo UNIQUE (id_sucursal, id_tipo_ncf),
    CONSTRAINT fk_secuencia_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_secuencia_tiponcf  FOREIGN KEY (id_tipo_ncf) REFERENCES TipoNCF(id_tipo_ncf)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE ComprobanteFiscal (
    id_comprobante      BIGINT         NOT NULL IDENTITY(1,1),
    id_venta            BIGINT         NOT NULL,
    id_sucursal         BIGINT         NOT NULL,
    id_tipo_ncf         BIGINT         NOT NULL,
    -- Número de comprobante completo: ej. E310000000001
    numero_comprobante  VARCHAR(19)    NOT NULL,
    -- Datos del receptor
    rnc_cedula_receptor VARCHAR(11)    NULL,   -- solo B01/B14
    nombre_receptor     VARCHAR(150)   NULL,
    -- Montos del comprobante (desnorm. controlada — preserva valor fiscal)
    subtotal            DECIMAL(18,2)  NOT NULL,
    itbis               DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total               DECIMAL(18,2)  NOT NULL,
    fecha_emision       DATETIME       NOT NULL DEFAULT GETDATE(),
    estado              VARCHAR(15)    NOT NULL DEFAULT 'Emitido',
    -- Para e-CF: respuesta de la DGII
    codigo_seguridad    VARCHAR(50)    NULL,
    fecha_certificacion DATETIME       NULL,
    xml_enviado         NVARCHAR(MAX)  NULL,
    xml_respuesta       NVARCHAR(MAX)  NULL,
    CONSTRAINT pk_comprobante          PRIMARY KEY (id_comprobante),
    CONSTRAINT uq_comprobante_numero   UNIQUE (numero_comprobante),
    CONSTRAINT chk_comprobante_estado  CHECK (estado IN ('Emitido','Certificado','Anulado','Rechazado')),
    CONSTRAINT fk_comprobante_venta    FOREIGN KEY (id_venta)      REFERENCES Venta(id_venta)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_comprobante_sucursal FOREIGN KEY (id_sucursal)   REFERENCES Sucursal(id_sucursal)     ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_comprobante_tiponcf  FOREIGN KEY (id_tipo_ncf)   REFERENCES TipoNCF(id_tipo_ncf)      ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 8: INVENTARIO
-- ============================================================

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
GO

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
GO

CREATE TABLE OrdenCompraDetalle (
    id_oc_detalle       BIGINT         NOT NULL IDENTITY(1,1),
    id_orden_compra     BIGINT         NOT NULL,
    id_item             BIGINT         NOT NULL,
    cantidad_pedida     INT            NOT NULL,
    cantidad_recibida   INT            NOT NULL DEFAULT 0,
    precio_unitario     DECIMAL(18,2)  NOT NULL,
    subtotal            DECIMAL(18,2)  NOT NULL,
    CONSTRAINT pk_ordencompradetalle    PRIMARY KEY (id_oc_detalle),
    CONSTRAINT chk_ocdetalle_cantidad   CHECK (cantidad_pedida > 0),
    CONSTRAINT chk_ocdetalle_recibida   CHECK (cantidad_recibida >= 0),
    CONSTRAINT fk_ocdetalle_orden       FOREIGN KEY (id_orden_compra) REFERENCES OrdenCompra(id_orden_compra) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ocdetalle_item        FOREIGN KEY (id_item)         REFERENCES ItemCatalogo(id_item)         ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE MovimientoInventario (
    id_movimiento_inv   BIGINT         NOT NULL IDENTITY(1,1),
    id_item             BIGINT         NOT NULL,
    id_sucursal         BIGINT         NOT NULL,
    id_orden_compra     BIGINT         NULL,
    id_venta            BIGINT         NULL,
    id_usuario          BIGINT         NOT NULL,
    tipo                CHAR(1)        NOT NULL,   -- E=Entrada S=Salida A=Ajuste
    cantidad            INT            NOT NULL,
    stock_antes         INT            NOT NULL,
    stock_despues       INT            NOT NULL,
    concepto            VARCHAR(200)   NOT NULL,
    fecha_hora          DATETIME       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_movimientoinv          PRIMARY KEY (id_movimiento_inv),
    CONSTRAINT chk_movinv_tipo           CHECK (tipo IN ('E','S','A')),
    CONSTRAINT chk_movinv_cantidad       CHECK (cantidad > 0),
    CONSTRAINT fk_movinv_item            FOREIGN KEY (id_item)         REFERENCES ItemCatalogo(id_item)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movinv_sucursal        FOREIGN KEY (id_sucursal)     REFERENCES Sucursal(id_sucursal)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movinv_ordencompra     FOREIGN KEY (id_orden_compra) REFERENCES OrdenCompra(id_orden_compra)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movinv_venta           FOREIGN KEY (id_venta)        REFERENCES Venta(id_venta)                 ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_movinv_usuario         FOREIGN KEY (id_usuario)      REFERENCES Usuario(id_usuario)             ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 9: PORTAL WEB
-- ============================================================

CREATE TABLE OrdenWeb (
    id_orden        BIGINT         NOT NULL IDENTITY(1,1),
    numero_orden    VARCHAR(20)    NOT NULL,
    id_cliente      BIGINT         NOT NULL,
    id_usuario      BIGINT         NOT NULL,
    id_cupon        BIGINT         NULL,
    id_metodo_pago  BIGINT         NULL,
    fecha           DATETIME       NOT NULL DEFAULT GETDATE(),
    subtotal        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    itbis           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    descuento       DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total           DECIMAL(18,2)  NOT NULL DEFAULT 0,
    estado          VARCHAR(15)    NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT pk_ordenweb           PRIMARY KEY (id_orden),
    CONSTRAINT uq_ordenweb_numero    UNIQUE (numero_orden),
    CONSTRAINT chk_ordenweb_estado   CHECK (estado IN ('Pendiente','Confirmada','Completada','Cancelada')),
    CONSTRAINT fk_ordenweb_cliente   FOREIGN KEY (id_cliente)    REFERENCES Cliente(id_cliente)         ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ordenweb_usuario   FOREIGN KEY (id_usuario)    REFERENCES Usuario(id_usuario)         ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ordenweb_cupon     FOREIGN KEY (id_cupon)      REFERENCES Cupon(id_cupon)              ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ordenweb_metpago   FOREIGN KEY (id_metodo_pago) REFERENCES MetodoPago(id_metodo_pago) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE OrdenWebDetalle (
    id_orden_detalle  BIGINT         NOT NULL IDENTITY(1,1),
    id_orden          BIGINT         NOT NULL,
    id_item           BIGINT         NOT NULL,
    cantidad          INT            NOT NULL,
    precio_unitario   DECIMAL(18,2)  NOT NULL,
    subtotal          DECIMAL(18,2)  NOT NULL,
    bloqueado         BIT            NOT NULL DEFAULT 0,
    CONSTRAINT pk_ordenwebdetalle        PRIMARY KEY (id_orden_detalle),
    CONSTRAINT chk_ordendetalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT fk_ordendetalle_orden     FOREIGN KEY (id_orden) REFERENCES OrdenWeb(id_orden)       ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_ordendetalle_item      FOREIGN KEY (id_item)  REFERENCES ItemCatalogo(id_item)    ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  DOMINIO 10: NOTIFICACIONES Y AUDITORÍA
-- ============================================================

CREATE TABLE PreferenciasNotificacion (
    id_preferencia  BIGINT       NOT NULL IDENTITY(1,1),
    id_usuario      BIGINT       NOT NULL,
    canal_push      BIT          NOT NULL DEFAULT 1,
    canal_email     BIT          NOT NULL DEFAULT 1,
    canal_sms       BIT          NOT NULL DEFAULT 0,
    frecuencia      VARCHAR(10)  NOT NULL DEFAULT 'Inmediata',
    activo          BIT          NOT NULL DEFAULT 1,
    CONSTRAINT pk_preferencias             PRIMARY KEY (id_preferencia),
    CONSTRAINT uq_preferencias_usuario     UNIQUE (id_usuario),
    CONSTRAINT chk_preferencias_frecuencia CHECK (frecuencia IN ('Inmediata','Diaria','Semanal')),
    CONSTRAINT fk_preferencias_usuario     FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Notificacion (
    id_notificacion  BIGINT       NOT NULL IDENTITY(1,1),
    id_usuario       BIGINT       NOT NULL,
    id_cita          BIGINT       NULL,
    id_orden         BIGINT       NULL,
    tipo             VARCHAR(15)  NOT NULL DEFAULT 'Sistema',
    titulo           VARCHAR(100) NOT NULL,
    mensaje          VARCHAR(500) NOT NULL,
    canal            VARCHAR(10)  NOT NULL DEFAULT 'Sistema',
    leida            BIT          NOT NULL DEFAULT 0,
    fecha_envio      DATETIME     NOT NULL DEFAULT GETDATE(),
    fecha_lectura    DATETIME     NULL,
    url_accion       VARCHAR(200) NULL,
    CONSTRAINT pk_notificacion         PRIMARY KEY (id_notificacion),
    CONSTRAINT chk_notificacion_tipo   CHECK (tipo  IN ('Cita','Orden','Sistema','Recordatorio','CxC','Pago','Inventario')),
    CONSTRAINT chk_notificacion_canal  CHECK (canal IN ('Push','Email','SMS','Sistema')),
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_notificacion_cita    FOREIGN KEY (id_cita)    REFERENCES Cita(id_cita)       ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_notificacion_orden   FOREIGN KEY (id_orden)   REFERENCES OrdenWeb(id_orden)  ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE Auditoria (
    id_auditoria       BIGINT          NOT NULL IDENTITY(1,1),
    id_usuario         BIGINT          NULL,
    usuario_nombre     VARCHAR(200)    NOT NULL,
    usuario_email      VARCHAR(150)    NOT NULL,
    perfil_en_momento  VARCHAR(50)     NOT NULL,
    accion             VARCHAR(100)    NOT NULL,
    modulo             VARCHAR(60)     NOT NULL,
    entidad_afectada   VARCHAR(60)     NULL,
    id_entidad         BIGINT          NULL,
    campo              VARCHAR(50)     NULL,
    valor_anterior     NVARCHAR(MAX)   NULL,
    valor_nuevo        NVARCHAR(MAX)   NULL,
    ip_origen          VARCHAR(45)     NULL,
    user_agent         VARCHAR(500)    NULL,
    resultado          VARCHAR(10)     NOT NULL DEFAULT 'Exitoso',
    fecha              DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_auditoria            PRIMARY KEY (id_auditoria),
    CONSTRAINT chk_auditoria_resultado CHECK (resultado IN ('Exitoso','Fallido','Rechazado')),
    CONSTRAINT fk_auditoria_usuario    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

-- ============================================================
--  ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX ix_cita_cliente  ON Cita             (id_cliente);
CREATE INDEX ix_cita_fecha    ON Cita             (fecha_hora);
CREATE INDEX ix_cita_estado   ON Cita             (estado);
CREATE INDEX ix_venta_cliente ON Venta            (id_cliente);
CREATE INDEX ix_venta_fecha   ON Venta            (fecha);
CREATE INDEX ix_mov_sesion    ON MovimientoCaja   (id_sesion_caja);
CREATE INDEX ix_notif_usuario ON Notificacion     (id_usuario, leida);
CREATE INDEX ix_cxc_estado    ON CuentaPorCobrar  (estado);
CREATE INDEX ix_movinv_item   ON MovimientoInventario (id_item, id_sucursal);
CREATE INDEX ix_comprobante_venta ON ComprobanteFiscal (id_venta);
GO

-- ============================================================
--  SECUENCIAS
-- ============================================================
CREATE SEQUENCE seq_factura    START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_cotizacion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_orden_compra START WITH 1 INCREMENT BY 1;
GO

-- ============================================================
--  SEED DATA
-- ============================================================

INSERT INTO TipoDocumento (codigo, nombre, descripcion, longitud_min, longitud_max, solo_numeros, requiere_pais) VALUES
    ('CED','Cédula de Identidad Dominicana','11 dígitos. Formato: 000-0000000-0',11,11,1,0),
    ('RNC','Registro Nacional del Contribuyente','Para personas jurídicas. 9 dígitos.',9,9,1,0),
    ('PAS','Pasaporte','Pasaporte nacional o extranjero.',6,20,0,1),
    ('EXT','Documento de Identidad Extranjero','Cédula emitida en otro país.',5,20,0,1),
    ('DNI','DNI (otros países hispanohablantes)','Documento Nacional de Identidad de otro país.',7,15,0,1);
GO

INSERT INTO Pais (codigo, nombre) VALUES
    ('DO','República Dominicana'),('US','Estados Unidos'),('ES','España'),
    ('MX','México'),('CO','Colombia'),('VE','Venezuela'),('HT','Haití'),
    ('PR','Puerto Rico'),('CU','Cuba'),('PA','Panamá'),('GT','Guatemala'),
    ('HN','Honduras'),('SV','El Salvador'),('NI','Nicaragua'),('CR','Costa Rica'),
    ('IT','Italia'),('FR','Francia'),('DE','Alemania'),('GB','Reino Unido'),
    ('BR','Brasil'),('AR','Argentina'),('CL','Chile'),('PE','Perú'),('EC','Ecuador');
GO

INSERT INTO MetodoPago (codigo, nombre) VALUES
    ('EFECTIVO','Efectivo'),('TARJETA_CRED','Tarjeta de Crédito'),
    ('TARJETA_DEB','Tarjeta de Débito'),('TRANSFERENCIA','Transferencia Bancaria'),
    ('CAJA','Pago en Caja'),('CREDITO','Crédito / CxC');
GO

INSERT INTO Perfil (nombre, descripcion) VALUES
    ('Admin','Acceso total al sistema'),('Cajero','Ventas, caja y cotizaciones'),
    ('Especialista','Citas, expedientes y galería'),('Cliente','Portal web: citas, órdenes y perfil');
GO

INSERT INTO CategoriaServicio (nombre, descripcion, orden_display) VALUES
    ('Uñas','Manicura, pedicura, acrílicas, nail art y más',1),
    ('Faciales','Limpiezas, hidratación, anti-edad y tratamientos',2),
    ('Masajes','Relajantes, descontracturantes, piedras y drenaje',3),
    ('Depilación','Cera caliente, cera fría e hilo en todas las zonas',4),
    ('Cejas/Pestañas','Diseño, tinte, extensiones y lifting',5),
    ('Pelo','Corte, tinte, mechas, keratina e hidratación',6);
GO

INSERT INTO Sucursal (nombre, direccion, telefono, email_contacto, horario_apertura, horario_cierre) VALUES
    ('AuraSpa Principal','Santo Domingo, República Dominicana','809-000-0000','contacto@auraspa.com','08:00','20:00');
GO

INSERT INTO Cabina (nombre, id_categoria, id_sucursal) VALUES
    ('Cabina 1 - Uñas',1,1),('Cabina 2 - Facial',2,1),
    ('Cabina 3 - Masaje',3,1),('Cabina 4 - Depilación',4,1),
    ('Cabina 5 - Pelo',6,1),('Cabina 6 - General',NULL,1);
GO

INSERT INTO Permiso (codigo, nombre, modulo) VALUES
    ('ventas.ver','Ver ventas','ventas'),('ventas.crear','Crear venta','ventas'),
    ('ventas.cancelar','Cancelar venta','ventas'),('caja.abrir','Abrir caja','caja'),
    ('caja.cerrar','Cerrar caja','caja'),('citas.ver','Ver citas','citas'),
    ('citas.aprobar','Aprobar citas','citas'),('catalogo.editar','Editar catálogo','catalogo'),
    ('clientes.ver','Ver clientes','clientes'),('clientes.crear','Crear cliente','clientes'),
    ('admin.usuarios','Gestionar usuarios','admin'),('admin.reportes','Ver reportes','admin'),
    ('expediente.ver','Ver expediente','expediente'),('expediente.editar','Editar expediente','expediente'),
    ('inventario.ver','Ver inventario','inventario'),('inventario.editar','Editar inventario','inventario'),
    ('comprobantes.emitir','Emitir comprobantes fiscales','fiscal'),
    ('comprobantes.anular','Anular comprobantes fiscales','fiscal');
GO

-- Tipos de NCF según DGII RD
INSERT INTO TipoNCF (codigo, nombre, descripcion, requiere_rnc) VALUES
    ('B01','Factura de Crédito Fiscal','Para ventas a contribuyentes — requiere RNC del comprador',1),
    ('B02','Factura de Consumo','Para ventas a consumidores finales — no requiere RNC',0),
    ('B14','Factura Gubernamental','Para ventas al Estado dominicano',1),
    ('B15','Comprobante para Exportaciones','Para exportaciones',0),
    ('B16','Comprobante para Gastos Menores','Para gastos sin requito fiscal',0),
    ('E31','Factura de Crédito Fiscal Electrónica','e-CF — para contribuyentes',1),
    ('E32','Factura de Consumo Electrónica','e-CF — para consumidores finales',0);
GO

PRINT '============================================================';
PRINT ' AuraSpaDB v3 creada en DESKTOP-RH3N4KE\SQLEXPRESS';
PRINT '------------------------------------------------------------';
PRINT ' Dominios: Catálogos · Personas · Catálogo Servicios';
PRINT '           Citas · Ventas/Caja · Comprobante Fiscal';
PRINT '           Inventario · Portal Web · Notificaciones';
PRINT ' Total: 41 tablas + índices + secuencias + seed data';
PRINT '============================================================';
GO
