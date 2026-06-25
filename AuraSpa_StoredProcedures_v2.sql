-- ============================================================
--  AuraSpa — Stored Procedures v2
--  SQL Server · SSMS · DESKTOP-RH3N4KE\SQLEXPRESS
--  Equipo 5 · IDS325L-01 · INTEC · 2026
--  v2: + sp_EmitirComprobanteFiscal · sp_AnularComprobante
--      + sp_RecibirOrdenCompra · sp_AjustarStock · sp_AlertasStockBajo
-- ============================================================
USE AuraSpaDB;
GO

-- ============================================================
--  AUTENTICACIÓN
-- ============================================================
CREATE OR ALTER PROCEDURE sp_LoginUsuario
    @Email VARCHAR(150), @Resultado INT OUTPUT, @IdUsuario BIGINT OUTPUT,
    @NombreCompleto VARCHAR(201) OUTPUT, @NombrePerfil VARCHAR(50) OUTPUT, @HashContrasena VARCHAR(256) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @BloqueadoHasta DATETIME; DECLARE @Activo BIT;
    SELECT @IdUsuario=u.id_usuario, @NombreCompleto=u.nombre+' '+u.apellido,
           @NombrePerfil=p.nombre, @HashContrasena=u.contrasena_hash,
           @BloqueadoHasta=u.bloqueado_hasta, @Activo=u.activo
    FROM Usuario u INNER JOIN Perfil p ON p.id_perfil=u.id_perfil
    WHERE u.email=@Email OR u.nombre_usuario=@Email;
    IF @IdUsuario IS NULL BEGIN SET @Resultado=1; RETURN; END
    IF @Activo=0 BEGIN SET @Resultado=1; RETURN; END
    IF @BloqueadoHasta IS NOT NULL AND @BloqueadoHasta>GETDATE() BEGIN SET @Resultado=2; RETURN; END
    SET @Resultado=0;
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginExitoso @IdUsuario BIGINT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuario SET intentos_fallidos=0, bloqueado_hasta=NULL, ultimo_acceso=GETDATE()
    WHERE id_usuario=@IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginFallido @IdUsuario BIGINT, @EstaBloqueado BIT OUTPUT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuario SET intentos_fallidos=intentos_fallidos+1,
        bloqueado_hasta=CASE WHEN intentos_fallidos+1>=5 THEN DATEADD(MINUTE,15,GETDATE()) ELSE NULL END
    WHERE id_usuario=@IdUsuario;
    SELECT @EstaBloqueado=CASE WHEN intentos_fallidos>=5 THEN 1 ELSE 0 END FROM Usuario WHERE id_usuario=@IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarUsuario
    @Nombre VARCHAR(100), @Apellido VARCHAR(100), @Email VARCHAR(150),
    @NombreUsuario VARCHAR(50), @HashContrasena VARCHAR(256), @Telefono VARCHAR(20),
    @IdTipoDoc BIGINT, @NumeroDocumento VARCHAR(20), @IdPaisDoc BIGINT=NULL,
    @NombrePerfil VARCHAR(50)='Cliente', @IdUsuarioNuevo BIGINT OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    IF EXISTS(SELECT 1 FROM Usuario WHERE email=@Email) BEGIN SET @Error='El email ya está registrado.'; ROLLBACK; RETURN; END
    DECLARE @IdPerfil BIGINT; DECLARE @IdCliente BIGINT;
    SELECT @IdPerfil=id_perfil FROM Perfil WHERE nombre=@NombrePerfil;
    IF @IdPerfil IS NULL BEGIN SET @Error='Perfil no encontrado.'; ROLLBACK; RETURN; END
    INSERT INTO Cliente(id_tipo_doc,numero_documento,id_pais_doc,nombres,apellidos,email,telefono)
    VALUES(@IdTipoDoc,@NumeroDocumento,@IdPaisDoc,@Nombre,@Apellido,@Email,@Telefono);
    SET @IdCliente=SCOPE_IDENTITY();
    INSERT INTO Usuario(email,nombre_usuario,contrasena_hash,nombre,apellido,telefono,id_perfil,id_cliente,verificado)
    VALUES(@Email,@NombreUsuario,@HashContrasena,@Nombre,@Apellido,@Telefono,@IdPerfil,@IdCliente,0);
    SET @IdUsuarioNuevo=SCOPE_IDENTITY(); SET @Error=NULL; COMMIT;
    END TRY BEGIN CATCH ROLLBACK; SET @Error=ERROR_MESSAGE(); END CATCH
END;
GO

-- ============================================================
--  CITAS
-- ============================================================
CREATE OR ALTER PROCEDURE sp_CrearCita
    @IdCliente BIGINT, @IdEmpleado BIGINT=NULL, @IdItem BIGINT, @IdCabina BIGINT=NULL,
    @IdSucursal BIGINT, @IdMetodoPago BIGINT=NULL, @FechaHora DATETIME, @Notas VARCHAR(300)=NULL,
    @TipoFacial VARCHAR(30)=NULL, @TipoPiel VARCHAR(20)=NULL, @TipoMasaje VARCHAR(30)=NULL,
    @DuracionMasajeMin INT=NULL, @ZonaDepilacion VARCHAR(30)=NULL, @MetodoDepilacion VARCHAR(20)=NULL,
    @SubservicioCejas VARCHAR(30)=NULL, @TieneTrabajoAnterior BIT=NULL,
    @TipoUnias VARCHAR(30)=NULL, @IncluyeRemocion BIT=NULL,
    @TipoServicioPelo VARCHAR(30)=NULL, @LargoCabello VARCHAR(15)=NULL,
    @IdCitaNueva BIGINT OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    IF @FechaHora<=GETDATE() BEGIN SET @Error='La fecha debe ser futura.'; ROLLBACK; RETURN; END
    IF @IdEmpleado IS NOT NULL AND EXISTS(
        SELECT 1 FROM Cita WHERE id_empleado=@IdEmpleado AND fecha_hora=@FechaHora AND estado NOT IN('Cancelada','Rechazada'))
    BEGIN SET @Error='El especialista ya tiene una cita a esa hora.'; ROLLBACK; RETURN; END
    DECLARE @PrecioAcordado DECIMAL(18,2); DECLARE @DurMin INT;
    SELECT @PrecioAcordado=precio_base, @DurMin=duracion_minutos FROM ItemCatalogo WHERE id_item=@IdItem;
    INSERT INTO Cita(id_cliente,id_empleado,id_item,id_cabina,id_sucursal,id_metodo_pago,
        fecha_hora,duracion_minutos,precio_acordado,estado,notas,tipo_facial,tipo_piel,tipo_masaje,
        duracion_masaje_min,zona_depilacion,metodo_depilacion,subservicio_cejas,tiene_trabajo_anterior,
        tipo_unias,incluye_remocion,tipo_servicio_pelo,largo_cabello)
    VALUES(@IdCliente,@IdEmpleado,@IdItem,@IdCabina,@IdSucursal,@IdMetodoPago,
        @FechaHora,ISNULL(@DuracionMasajeMin,@DurMin),@PrecioAcordado,'Pendiente',@Notas,@TipoFacial,@TipoPiel,
        @TipoMasaje,@DuracionMasajeMin,@ZonaDepilacion,@MetodoDepilacion,@SubservicioCejas,@TieneTrabajoAnterior,
        @TipoUnias,@IncluyeRemocion,@TipoServicioPelo,@LargoCabello);
    SET @IdCitaNueva=SCOPE_IDENTITY(); SET @Error=NULL; COMMIT;
    END TRY BEGIN CATCH ROLLBACK; SET @Error=ERROR_MESSAGE(); END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CambiarEstadoCita
    @IdCita BIGINT, @NuevoEstado VARCHAR(15), @IdUsuario BIGINT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @EstadoActual VARCHAR(15);
    SELECT @EstadoActual=estado FROM Cita WHERE id_cita=@IdCita;
    IF @EstadoActual IS NULL BEGIN SET @Error='Cita no encontrada.'; RETURN; END
    IF NOT((@EstadoActual='Pendiente' AND @NuevoEstado IN('Aprobada','Rechazada','Cancelada')) OR
           (@EstadoActual='Aprobada'  AND @NuevoEstado IN('Completada','Cancelada')))
    BEGIN SET @Error='Transición de estado no permitida: '+@EstadoActual+' → '+@NuevoEstado; RETURN; END
    UPDATE Cita SET estado=@NuevoEstado WHERE id_cita=@IdCita;
    INSERT INTO Auditoria(id_usuario,usuario_nombre,usuario_email,perfil_en_momento,accion,modulo,entidad_afectada,id_entidad,campo,valor_anterior,valor_nuevo)
    SELECT @IdUsuario,u.nombre+' '+u.apellido,u.email,p.nombre,'CAMBIO_ESTADO','citas','Cita',@IdCita,'estado',@EstadoActual,@NuevoEstado
    FROM Usuario u INNER JOIN Perfil p ON p.id_perfil=u.id_perfil WHERE u.id_usuario=@IdUsuario;
    SET @Error=NULL;
END;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerCitasCliente @IdCliente BIGINT, @Estado VARCHAR(15)=NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.id_cita,c.fecha_hora,c.estado,c.precio_acordado,c.notas,
           ic.nombre AS servicio,cat.nombre AS categoria,
           e.nombres+' '+e.apellidos AS especialista,
           cab.nombre AS cabina,s.nombre AS sucursal,c.fecha_creacion
    FROM Cita c
    INNER JOIN ItemCatalogo ic ON ic.id_item=c.id_item
    INNER JOIN Sucursal s ON s.id_sucursal=c.id_sucursal
    LEFT JOIN CategoriaServicio cat ON cat.id_categoria=ic.id_categoria
    LEFT JOIN Empleado e ON e.id_empleado=c.id_empleado
    LEFT JOIN Cabina cab ON cab.id_cabina=c.id_cabina
    WHERE c.id_cliente=@IdCliente AND(@Estado IS NULL OR c.estado=@Estado)
    ORDER BY c.fecha_hora DESC;
END;
GO

-- ============================================================
--  VENTAS Y CAJA
-- ============================================================
CREATE OR ALTER PROCEDURE sp_AbrirCaja
    @IdUsuario BIGINT, @IdSucursal BIGINT, @MontoInicial DECIMAL(18,2),
    @NotasApertura VARCHAR(200)=NULL, @IdSesion BIGINT OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS(SELECT 1 FROM SesionCaja WHERE id_usuario=@IdUsuario AND estado='Abierta')
    BEGIN SET @Error='Ya tienes una sesión de caja abierta.'; RETURN; END
    INSERT INTO SesionCaja(id_usuario,id_sucursal,monto_inicial,notas_apertura,estado)
    VALUES(@IdUsuario,@IdSucursal,@MontoInicial,@NotasApertura,'Abierta');
    SET @IdSesion=SCOPE_IDENTITY(); SET @Error=NULL;
END;
GO

CREATE OR ALTER PROCEDURE sp_CerrarCaja
    @IdSesionCaja BIGINT, @MontoFinal DECIMAL(18,2), @Justificacion VARCHAR(300)=NULL, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM SesionCaja WHERE id_sesion_caja=@IdSesionCaja AND estado='Abierta')
    BEGIN SET @Error='Sesión no encontrada o ya cerrada.'; RETURN; END
    DECLARE @MontoInicial DECIMAL(18,2);
    SELECT @MontoInicial=monto_inicial FROM SesionCaja WHERE id_sesion_caja=@IdSesionCaja;
    UPDATE SesionCaja SET fecha_cierre=GETDATE(),monto_final=@MontoFinal,
        diferencia=@MontoFinal-@MontoInicial,justificacion=@Justificacion,estado='Cerrada'
    WHERE id_sesion_caja=@IdSesionCaja;
    SET @Error=NULL;
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarVenta
    @IdCliente BIGINT=NULL, @IdUsuario BIGINT=NULL, @IdSesionCaja BIGINT=NULL,
    @IdMetodoPago BIGINT=NULL, @IdCupon BIGINT=NULL, @CondicionPago VARCHAR(10)='Contado',
    @TipoVenta VARCHAR(5)='POS', @Descuento DECIMAL(18,2)=0, @DetallesXML XML,
    @IdVentaNueva BIGINT OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    DECLARE @NumeroFactura VARCHAR(20);
    SET @NumeroFactura='FAC-'+FORMAT(GETDATE(),'yyyyMMdd')+'-'+RIGHT('00000'+CAST(NEXT VALUE FOR seq_factura AS VARCHAR),5);
    INSERT INTO Venta(numero_factura,id_cliente,id_usuario,id_sesion_caja,id_metodo_pago,id_cupon,condicion_pago,tipo_venta,descuento,estado)
    VALUES(@NumeroFactura,@IdCliente,@IdUsuario,@IdSesionCaja,@IdMetodoPago,@IdCupon,@CondicionPago,@TipoVenta,@Descuento,'Completada');
    SET @IdVentaNueva=SCOPE_IDENTITY();
    INSERT INTO VentaDetalle(id_venta,id_item,id_empleado,cantidad,precio_unitario,subtotal)
    SELECT @IdVentaNueva,d.value('@id_item','BIGINT'),NULLIF(d.value('@id_empleado','VARCHAR(20)'),''),
           d.value('@cantidad','INT'),d.value('@precio_unitario','DECIMAL(18,2)'),
           d.value('@cantidad','INT')*(d.value('@precio_unitario','DECIMAL(18,2)')-ISNULL(d.value('@descuento_linea','DECIMAL(18,2)'),0))
    FROM @DetallesXML.nodes('/detalles/d') AS t(d);

    -- Descontar stock y registrar movimiento de inventario
    DECLARE @IdItemCur BIGINT; DECLARE @CantCur INT;
    DECLARE @IdSucursalCur BIGINT; DECLARE @StockActual INT;
    IF @IdSesionCaja IS NOT NULL
        SELECT @IdSucursalCur=id_sucursal FROM SesionCaja WHERE id_sesion_caja=@IdSesionCaja;
    DECLARE cur CURSOR FOR
        SELECT vd.id_item, vd.cantidad FROM VentaDetalle vd
        INNER JOIN ItemCatalogo ic ON ic.id_item=vd.id_item
        WHERE vd.id_venta=@IdVentaNueva AND ic.tipo='Producto';
    OPEN cur; FETCH NEXT FROM cur INTO @IdItemCur, @CantCur;
    WHILE @@FETCH_STATUS=0
    BEGIN
        SELECT @StockActual=ISNULL(stock,0) FROM ItemCatalogoSucursal
        WHERE id_item=@IdItemCur AND id_sucursal=@IdSucursalCur;
        UPDATE ItemCatalogoSucursal SET stock=ISNULL(stock,0)-@CantCur
        WHERE id_item=@IdItemCur AND id_sucursal=@IdSucursalCur;
        INSERT INTO MovimientoInventario(id_item,id_sucursal,id_venta,id_usuario,tipo,cantidad,stock_antes,stock_despues,concepto)
        VALUES(@IdItemCur,@IdSucursalCur,@IdVentaNueva,@IdUsuario,'S',@CantCur,@StockActual,@StockActual-@CantCur,'Venta #'+CAST(@IdVentaNueva AS VARCHAR));
        FETCH NEXT FROM cur INTO @IdItemCur, @CantCur;
    END
    CLOSE cur; DEALLOCATE cur;

    -- Calcular totales (servicios: itbis_aplica=0 por ley, productos: itbis_aplica=1)
    DECLARE @Subtotal DECIMAL(18,2);
    DECLARE @Itbis DECIMAL(18,2);
    SELECT @Subtotal=SUM(vd.subtotal) FROM VentaDetalle vd WHERE vd.id_venta=@IdVentaNueva;
    SELECT @Itbis=ISNULL(SUM(vd.subtotal*0.18),0) FROM VentaDetalle vd
    INNER JOIN ItemCatalogo ic ON ic.id_item=vd.id_item
    WHERE vd.id_venta=@IdVentaNueva AND ic.itbis_aplica=1;

    IF @IdCupon IS NOT NULL
    BEGIN
        DECLARE @TipoDesc VARCHAR(10); DECLARE @ValorDesc DECIMAL(10,2);
        SELECT @TipoDesc=tipo_descuento,@ValorDesc=valor FROM Cupon WHERE id_cupon=@IdCupon;
        SET @Descuento=CASE WHEN @TipoDesc='PORCENTAJE' THEN @Subtotal*(@ValorDesc/100) ELSE @ValorDesc END;
        UPDATE Cupon SET usos_actuales=usos_actuales+1 WHERE id_cupon=@IdCupon;
    END

    UPDATE Venta SET subtotal=@Subtotal,itbis=@Itbis,descuento=@Descuento,total=@Subtotal+@Itbis-@Descuento
    WHERE id_venta=@IdVentaNueva;

    IF @IdSesionCaja IS NOT NULL
    BEGIN
        DECLARE @TotalFinal DECIMAL(18,2);
        SELECT @TotalFinal=total FROM Venta WHERE id_venta=@IdVentaNueva;
        INSERT INTO MovimientoCaja(id_sesion_caja,id_venta,concepto,tipo,monto,id_metodo_pago,id_usuario)
        VALUES(@IdSesionCaja,@IdVentaNueva,'Venta #'+CAST(@IdVentaNueva AS VARCHAR),'I',@TotalFinal,@IdMetodoPago,@IdUsuario);
    END

    IF @CondicionPago='Credito' AND @IdCliente IS NOT NULL
    BEGIN
        DECLARE @TotalCredito DECIMAL(18,2);
        SELECT @TotalCredito=total FROM Venta WHERE id_venta=@IdVentaNueva;
        INSERT INTO CuentaPorCobrar(id_venta,id_cliente,monto_original,fecha_vencimiento,estado)
        VALUES(@IdVentaNueva,@IdCliente,@TotalCredito,DATEADD(DAY,30,GETDATE()),'Pendiente');
    END

    SET @Error=NULL; COMMIT;
    END TRY BEGIN CATCH
        IF CURSOR_STATUS('local','cur')>=0 BEGIN CLOSE cur; DEALLOCATE cur; END
        ROLLBACK; SET @Error=ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CrearCotizacion
    @IdCliente BIGINT=NULL, @IdEmpleado BIGINT=NULL, @IdUsuario BIGINT,
    @FechaVigencia DATETIME=NULL, @DetallesXML XML,
    @IdCotizacion BIGINT OUTPUT, @NumeroCotizacion VARCHAR(20) OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    SET @NumeroCotizacion='COT-'+FORMAT(GETDATE(),'yyyyMMdd')+'-'+RIGHT('00000'+CAST(NEXT VALUE FOR seq_cotizacion AS VARCHAR),5);
    INSERT INTO Cotizacion(numero_cotizacion,id_cliente,id_empleado,id_usuario,fecha_vigencia,estado)
    VALUES(@NumeroCotizacion,@IdCliente,@IdEmpleado,@IdUsuario,ISNULL(@FechaVigencia,DATEADD(DAY,7,GETDATE())),'Pendiente');
    SET @IdCotizacion=SCOPE_IDENTITY();
    INSERT INTO CotizacionDetalle(id_cotizacion,id_item,cantidad,precio_unitario,subtotal)
    SELECT @IdCotizacion,d.value('@id_item','BIGINT'),d.value('@cantidad','INT'),
           d.value('@precio_unitario','DECIMAL(18,2)'),
           d.value('@cantidad','INT')*d.value('@precio_unitario','DECIMAL(18,2)')
    FROM @DetallesXML.nodes('/detalles/d') AS t(d);
    DECLARE @Sub DECIMAL(18,2); DECLARE @Itb DECIMAL(18,2);
    SELECT @Sub=SUM(subtotal) FROM CotizacionDetalle WHERE id_cotizacion=@IdCotizacion;
    SELECT @Itb=ISNULL(SUM(cd.subtotal*0.18),0) FROM CotizacionDetalle cd
    INNER JOIN ItemCatalogo ic ON ic.id_item=cd.id_item
    WHERE cd.id_cotizacion=@IdCotizacion AND ic.itbis_aplica=1;
    UPDATE Cotizacion SET subtotal=@Sub,itbis=@Itb,total=@Sub+@Itb WHERE id_cotizacion=@IdCotizacion;
    SET @Error=NULL; COMMIT;
    END TRY BEGIN CATCH ROLLBACK; SET @Error=ERROR_MESSAGE(); END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_FacturarCotizacion
    @IdCotizacion BIGINT, @IdSesionCaja BIGINT=NULL, @IdMetodoPago BIGINT=NULL,
    @IdVentaNueva BIGINT OUTPUT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    DECLARE @Estado VARCHAR(15);
    SELECT @Estado=estado FROM Cotizacion WHERE id_cotizacion=@IdCotizacion;
    IF @Estado IS NULL BEGIN SET @Error='Cotización no encontrada.'; ROLLBACK; RETURN; END
    IF @Estado!='Pendiente' BEGIN SET @Error='Solo se pueden facturar cotizaciones Pendientes.'; ROLLBACK; RETURN; END
    DECLARE @DetallesXML XML;
    SELECT @DetallesXML=(SELECT id_item AS "@id_item",cantidad AS "@cantidad",precio_unitario AS "@precio_unitario"
        FROM CotizacionDetalle WHERE id_cotizacion=@IdCotizacion FOR XML PATH('d'),ROOT('detalles'));
    DECLARE @IdCliente BIGINT; DECLARE @IdUsuario BIGINT;
    SELECT @IdCliente=id_cliente,@IdUsuario=id_usuario FROM Cotizacion WHERE id_cotizacion=@IdCotizacion;
    EXEC sp_RegistrarVenta @IdCliente=@IdCliente,@IdUsuario=@IdUsuario,@IdSesionCaja=@IdSesionCaja,
        @IdMetodoPago=@IdMetodoPago,@TipoVenta='POS',@DetallesXML=@DetallesXML,
        @IdVentaNueva=@IdVentaNueva OUTPUT,@Error=@Error OUTPUT;
    IF @Error IS NULL UPDATE Cotizacion SET estado='Facturada' WHERE id_cotizacion=@IdCotizacion;
    COMMIT;
    END TRY BEGIN CATCH ROLLBACK; SET @Error=ERROR_MESSAGE(); END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarAbonoCxC @IdCxc BIGINT, @Abono DECIMAL(18,2), @Error VARCHAR(200) OUTPUT AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MontoOriginal DECIMAL(18,2); DECLARE @MontoAbonado DECIMAL(18,2);
    SELECT @MontoOriginal=monto_original,@MontoAbonado=monto_abonado FROM CuentaPorCobrar WHERE id_cxc=@IdCxc;
    IF @MontoOriginal IS NULL BEGIN SET @Error='Cuenta por cobrar no encontrada.'; RETURN; END
    IF @Abono<=0 BEGIN SET @Error='El abono debe ser mayor a cero.'; RETURN; END
    IF(@MontoAbonado+@Abono)>@MontoOriginal BEGIN SET @Error='El abono supera el saldo pendiente.'; RETURN; END
    DECLARE @NuevoAbonado DECIMAL(18,2)=@MontoAbonado+@Abono;
    UPDATE CuentaPorCobrar SET monto_abonado=@NuevoAbonado,
        estado=CASE WHEN @NuevoAbonado>=@MontoOriginal THEN 'Saldada' ELSE 'Parcial' END
    WHERE id_cxc=@IdCxc;
    SET @Error=NULL;
END;
GO

-- ============================================================
--  COMPROBANTE FISCAL
-- ============================================================

CREATE OR ALTER PROCEDURE sp_EmitirComprobanteFiscal
    @IdVenta          BIGINT,
    @CodigoTipoNCF    VARCHAR(3),    -- B01, B02, E31, E32, etc.
    @RncCedulaReceptor VARCHAR(11)=NULL,
    @NombreReceptor   VARCHAR(150)=NULL,
    @IdUsuario        BIGINT,
    @NumeroComprobante VARCHAR(19) OUTPUT,
    @Error            VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY

        -- Verificar que la venta existe y no tiene comprobante
        IF NOT EXISTS (SELECT 1 FROM Venta WHERE id_venta=@IdVenta)
        BEGIN SET @Error='Venta no encontrada.'; ROLLBACK; RETURN; END

        IF EXISTS (SELECT 1 FROM ComprobanteFiscal WHERE id_venta=@IdVenta AND estado!='Anulado')
        BEGIN SET @Error='Esta venta ya tiene un comprobante fiscal emitido.'; ROLLBACK; RETURN; END

        -- Obtener tipo NCF y sucursal
        DECLARE @IdTipoNCF BIGINT; DECLARE @RequiereRNC BIT;
        SELECT @IdTipoNCF=id_tipo_ncf, @RequiereRNC=requiere_rnc
        FROM TipoNCF WHERE codigo=@CodigoTipoNCF AND activo=1;
        IF @IdTipoNCF IS NULL BEGIN SET @Error='Tipo de NCF no válido: '+@CodigoTipoNCF; ROLLBACK; RETURN; END

        -- Validar RNC si el tipo lo requiere
        IF @RequiereRNC=1 AND (@RncCedulaReceptor IS NULL OR LEN(TRIM(@RncCedulaReceptor))=0)
        BEGIN SET @Error='El tipo '+@CodigoTipoNCF+' requiere RNC o cédula del receptor.'; ROLLBACK; RETURN; END

        -- Obtener sucursal desde la sesión de caja
        DECLARE @IdSucursal BIGINT;
        SELECT @IdSucursal=sc.id_sucursal FROM Venta v
        INNER JOIN SesionCaja sc ON sc.id_sesion_caja=v.id_sesion_caja
        WHERE v.id_venta=@IdVenta;
        IF @IdSucursal IS NULL
        BEGIN SET @Error='No se pudo determinar la sucursal de la venta.'; ROLLBACK; RETURN; END

        -- Obtener y validar la secuencia NCF activa
        DECLARE @IdSecuencia BIGINT; DECLARE @NumeroActual BIGINT;
        DECLARE @NumeroHasta BIGINT; DECLARE @FechaVencSeq DATE;
        SELECT @IdSecuencia=id_secuencia, @NumeroActual=numero_actual,
               @NumeroHasta=numero_hasta, @FechaVencSeq=fecha_vencimiento
        FROM SecuenciaNCF
        WHERE id_sucursal=@IdSucursal AND id_tipo_ncf=@IdTipoNCF AND activa=1;

        IF @IdSecuencia IS NULL
        BEGIN SET @Error='No hay secuencia NCF activa para '+@CodigoTipoNCF+' en esta sucursal.'; ROLLBACK; RETURN; END

        IF CAST(GETDATE() AS DATE) > @FechaVencSeq
        BEGIN SET @Error='La secuencia NCF para '+@CodigoTipoNCF+' está vencida. Renueva ante la DGII.'; ROLLBACK; RETURN; END

        IF @NumeroActual >= @NumeroHasta
        BEGIN SET @Error='La secuencia NCF para '+@CodigoTipoNCF+' está agotada. Solicita nuevos números ante la DGII.'; ROLLBACK; RETURN; END

        -- Generar número de comprobante: E31 + 10 dígitos
        DECLARE @SiguienteNum BIGINT = @NumeroActual + 1;
        SET @NumeroComprobante = @CodigoTipoNCF + RIGHT('0000000000' + CAST(@SiguienteNum AS VARCHAR), 10);

        -- Actualizar secuencia
        UPDATE SecuenciaNCF SET numero_actual=@SiguienteNum WHERE id_secuencia=@IdSecuencia;

        -- Obtener montos de la venta
        DECLARE @Subtotal DECIMAL(18,2); DECLARE @Itbis DECIMAL(18,2); DECLARE @Total DECIMAL(18,2);
        SELECT @Subtotal=subtotal, @Itbis=itbis, @Total=total FROM Venta WHERE id_venta=@IdVenta;

        -- Insertar comprobante
        INSERT INTO ComprobanteFiscal(id_venta,id_sucursal,id_tipo_ncf,numero_comprobante,
            rnc_cedula_receptor,nombre_receptor,subtotal,itbis,total,estado)
        VALUES(@IdVenta,@IdSucursal,@IdTipoNCF,@NumeroComprobante,
            @RncCedulaReceptor,@NombreReceptor,@Subtotal,@Itbis,@Total,'Emitido');

        -- Auditoría
        INSERT INTO Auditoria(id_usuario,usuario_nombre,usuario_email,perfil_en_momento,
            accion,modulo,entidad_afectada,id_entidad,valor_nuevo)
        SELECT @IdUsuario,u.nombre+' '+u.apellido,u.email,p.nombre,
            'EMITIR_NCF','fiscal','ComprobanteFiscal',@IdVenta,@NumeroComprobante
        FROM Usuario u INNER JOIN Perfil p ON p.id_perfil=u.id_perfil WHERE u.id_usuario=@IdUsuario;

        SET @Error=NULL;
        COMMIT;
    END TRY
    BEGIN CATCH ROLLBACK; SET @Error=ERROR_MESSAGE(); END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AnularComprobante
    @IdComprobante  BIGINT,
    @IdUsuario      BIGINT,
    @Error          VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Estado VARCHAR(15);
    SELECT @Estado=estado FROM ComprobanteFiscal WHERE id_comprobante=@IdComprobante;
    IF @Estado IS NULL BEGIN SET @Error='Comprobante no encontrado.'; RETURN; END
    IF @Estado='Anulado' BEGIN SET @Error='El comprobante ya está anulado.'; RETURN; END
    IF @Estado='Certificado'
    BEGIN SET @Error='No se puede anular un comprobante ya certificado por la DGII. Debe emitir una nota de crédito.'; RETURN; END

    UPDATE ComprobanteFiscal SET estado='Anulado' WHERE id_comprobante=@IdComprobante;

    INSERT INTO Auditoria(id_usuario,usuario_nombre,usuario_email,perfil_en_momento,
        accion,modulo,entidad_afectada,id_entidad,valor_anterior,valor_nuevo)
    SELECT @IdUsuario,u.nombre+' '+u.apellido,u.email,p.nombre,
        'ANULAR_NCF','fiscal','ComprobanteFiscal',@IdComprobante,'Emitido','Anulado'
    FROM Usuario u INNER JOIN Perfil p ON p.id_perfil=u.id_perfil WHERE u.id_usuario=@IdUsuario;

    SET @Error=NULL;
END;
GO

-- ============================================================
--  INVENTARIO
-- ============================================================

CREATE OR ALTER PROCEDURE sp_RecibirOrdenCompra
    @IdOrdenCompra BIGINT, @IdUsuario BIGINT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION; BEGIN TRY
    DECLARE @Estado VARCHAR(15); DECLARE @IdSucursal BIGINT;
    SELECT @Estado=estado,@IdSucursal=id_sucursal FROM OrdenCompra WHERE id_orden_compra=@IdOrdenCompra;
    IF @Estado IS NULL BEGIN SET @Error='Orden no encontrada.'; ROLLBACK; RETURN; END
    IF @Estado='Cancelada' BEGIN SET @Error='No se puede recibir una orden cancelada.'; ROLLBACK; RETURN; END
    IF @Estado='Recibida'  BEGIN SET @Error='Esta orden ya fue recibida.'; ROLLBACK; RETURN; END

    DECLARE @IdItem BIGINT; DECLARE @CantPedida INT; DECLARE @CantRecibida INT; DECLARE @StockActual INT;
    DECLARE cur CURSOR FOR
        SELECT id_item,cantidad_pedida,cantidad_recibida FROM OrdenCompraDetalle
        WHERE id_orden_compra=@IdOrdenCompra AND cantidad_pedida>cantidad_recibida;
    OPEN cur; FETCH NEXT FROM cur INTO @IdItem,@CantPedida,@CantRecibida;
    WHILE @@FETCH_STATUS=0
    BEGIN
        DECLARE @CantEntrante INT=@CantPedida-@CantRecibida;
        SELECT @StockActual=ISNULL(stock,0) FROM ItemCatalogoSucursal WHERE id_item=@IdItem AND id_sucursal=@IdSucursal;
        IF EXISTS(SELECT 1 FROM ItemCatalogoSucursal WHERE id_item=@IdItem AND id_sucursal=@IdSucursal)
            UPDATE ItemCatalogoSucursal SET stock=ISNULL(stock,0)+@CantEntrante WHERE id_item=@IdItem AND id_sucursal=@IdSucursal;
        ELSE
            INSERT INTO ItemCatalogoSucursal(id_item,id_sucursal,stock,disponible) VALUES(@IdItem,@IdSucursal,@CantEntrante,1);
        UPDATE OrdenCompraDetalle SET cantidad_recibida=@CantPedida WHERE id_orden_compra=@IdOrdenCompra AND id_item=@IdItem;
        INSERT INTO MovimientoInventario(id_item,id_sucursal,id_orden_compra,id_usuario,tipo,cantidad,stock_antes,stock_despues,concepto)
        VALUES(@IdItem,@IdSucursal,@IdOrdenCompra,@IdUsuario,'E',@CantEntrante,ISNULL(@StockActual,0),ISNULL(@StockActual,0)+@CantEntrante,'Recepción OC #'+CAST(@IdOrdenCompra AS VARCHAR));
        FETCH NEXT FROM cur INTO @IdItem,@CantPedida,@CantRecibida;
    END
    CLOSE cur; DEALLOCATE cur;
    UPDATE OrdenCompra SET estado='Recibida',fecha_recepcion=GETDATE() WHERE id_orden_compra=@IdOrdenCompra;
    SET @Error=NULL; COMMIT;
    END TRY BEGIN CATCH
        IF CURSOR_STATUS('local','cur')>=0 BEGIN CLOSE cur; DEALLOCATE cur; END
        ROLLBACK; SET @Error=ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_AjustarStock
    @IdItem BIGINT, @IdSucursal BIGINT, @StockReal INT,
    @Concepto VARCHAR(200), @IdUsuario BIGINT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @StockSistema INT;
    SELECT @StockSistema=ISNULL(stock,0) FROM ItemCatalogoSucursal WHERE id_item=@IdItem AND id_sucursal=@IdSucursal;
    IF @StockSistema IS NULL BEGIN SET @Error='Item no encontrado en esta sucursal.'; RETURN; END
    IF @StockReal=@StockSistema BEGIN SET @Error=NULL; RETURN; END
    UPDATE ItemCatalogoSucursal SET stock=@StockReal WHERE id_item=@IdItem AND id_sucursal=@IdSucursal;
    INSERT INTO MovimientoInventario(id_item,id_sucursal,id_usuario,tipo,cantidad,stock_antes,stock_despues,concepto)
    VALUES(@IdItem,@IdSucursal,@IdUsuario,'A',ABS(@StockReal-@StockSistema),@StockSistema,@StockReal,@Concepto);
    SET @Error=NULL;
END;
GO

CREATE OR ALTER PROCEDURE sp_AlertasStockBajo @IdSucursal BIGINT=NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT ic.id_item,ic.nombre AS producto,s.nombre AS sucursal,
           ISNULL(ics.stock,0) AS stock_actual,ics.stock_minimo AS stock_minimo,
           CASE WHEN ISNULL(ics.stock,0)=0 THEN 'Sin stock' ELSE 'Stock bajo' END AS alerta
    FROM ItemCatalogoSucursal ics
    INNER JOIN ItemCatalogo ic ON ic.id_item=ics.id_item
    INNER JOIN Sucursal s ON s.id_sucursal=ics.id_sucursal
    WHERE ic.tipo='Producto' AND ic.activo=1
      AND ISNULL(ics.stock,0)<=ics.stock_minimo
      AND(@IdSucursal IS NULL OR ics.id_sucursal=@IdSucursal)
    ORDER BY ics.stock ASC;
END;
GO

-- ============================================================
--  CATÁLOGO
-- ============================================================
CREATE OR ALTER PROCEDURE sp_ObtenerCatalogo
    @IdSucursal BIGINT=NULL, @IdCategoria BIGINT=NULL, @Tipo VARCHAR(10)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ic.id_item,ic.nombre,ic.descripcion,ic.precio_base,
           ISNULL(ics.precio_override,ic.precio_base) AS precio_vigente,
           ic.tipo,ic.imagen_url,ic.duracion_minutos,ic.itbis_aplica,
           cat.nombre AS categoria,ics.stock,ISNULL(ics.disponible,ic.activo) AS disponible
    FROM ItemCatalogo ic
    INNER JOIN CategoriaServicio cat ON cat.id_categoria=ic.id_categoria
    LEFT JOIN ItemCatalogoSucursal ics ON ics.id_item=ic.id_item AND(@IdSucursal IS NULL OR ics.id_sucursal=@IdSucursal)
    WHERE ic.activo=1 AND(@IdCategoria IS NULL OR ic.id_categoria=@IdCategoria) AND(@Tipo IS NULL OR ic.tipo=@Tipo)
    ORDER BY cat.orden_display,ic.nombre;
END;
GO

CREATE OR ALTER PROCEDURE sp_ActualizarPrecioItem
    @IdItem BIGINT, @NuevoPrecio DECIMAL(18,2), @IdUsuario BIGINT, @Error VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PrecioAnterior DECIMAL(18,2);
    SELECT @PrecioAnterior=precio_base FROM ItemCatalogo WHERE id_item=@IdItem;
    IF @PrecioAnterior IS NULL BEGIN SET @Error='Item no encontrado.'; RETURN; END
    UPDATE ItemCatalogo SET precio_base=@NuevoPrecio WHERE id_item=@IdItem;
    INSERT INTO Auditoria(id_usuario,usuario_nombre,usuario_email,perfil_en_momento,accion,modulo,entidad_afectada,id_entidad,campo,valor_anterior,valor_nuevo)
    SELECT @IdUsuario,u.nombre+' '+u.apellido,u.email,p.nombre,'ACTUALIZAR_PRECIO','catalogo','ItemCatalogo',@IdItem,'precio_base',CAST(@PrecioAnterior AS VARCHAR),CAST(@NuevoPrecio AS VARCHAR)
    FROM Usuario u INNER JOIN Perfil p ON p.id_perfil=u.id_perfil WHERE u.id_usuario=@IdUsuario;
    SET @Error=NULL;
END;
GO

-- ============================================================
--  REPORTES Y DASHBOARD
-- ============================================================
CREATE OR ALTER PROCEDURE sp_ResumenDashboard @IdSucursal BIGINT=NULL, @Fecha DATE=NULL AS
BEGIN
    SET NOCOUNT ON;
    IF @Fecha IS NULL SET @Fecha=CAST(GETDATE() AS DATE);
    SELECT COUNT(*) AS total_ventas,SUM(subtotal) AS ingresos_subtotal,
           SUM(itbis) AS ingresos_itbis,SUM(total) AS ingresos_total,SUM(descuento) AS descuentos
    FROM Venta v LEFT JOIN SesionCaja sc ON sc.id_sesion_caja=v.id_sesion_caja
    WHERE CAST(v.fecha AS DATE)=@Fecha AND v.estado IN('Completada','Credito')
      AND(@IdSucursal IS NULL OR sc.id_sucursal=@IdSucursal);
    SELECT estado,COUNT(*) AS cantidad FROM Cita
    WHERE CAST(fecha_hora AS DATE)=@Fecha AND(@IdSucursal IS NULL OR id_sucursal=@IdSucursal)
    GROUP BY estado;
    SELECT TOP 5 ic.nombre AS servicio,SUM(vd.cantidad) AS veces_vendido,SUM(vd.subtotal) AS ingresos
    FROM VentaDetalle vd INNER JOIN ItemCatalogo ic ON ic.id_item=vd.id_item INNER JOIN Venta v ON v.id_venta=vd.id_venta
    WHERE ic.tipo='Servicio' AND MONTH(v.fecha)=MONTH(@Fecha) AND YEAR(v.fecha)=YEAR(@Fecha) AND v.estado IN('Completada','Credito')
    GROUP BY ic.nombre ORDER BY veces_vendido DESC;
    -- Alertas de stock bajo
    EXEC sp_AlertasStockBajo @IdSucursal=@IdSucursal;
END;
GO

CREATE OR ALTER PROCEDURE sp_ReporteVentasPorPeriodo @FechaInicio DATE, @FechaFin DATE, @IdSucursal BIGINT=NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.id_venta,v.numero_factura,v.fecha,cl.nombres+' '+cl.apellidos AS cliente,
           mp.nombre AS metodo_pago,v.subtotal,v.itbis,v.descuento,v.total,
           v.condicion_pago,v.tipo_venta,v.estado,
           u.nombre+' '+u.apellido AS cajero,s.nombre AS sucursal,
           cf.numero_comprobante AS ncf
    FROM Venta v
    LEFT JOIN Cliente cl ON cl.id_cliente=v.id_cliente
    LEFT JOIN MetodoPago mp ON mp.id_metodo_pago=v.id_metodo_pago
    LEFT JOIN Usuario u ON u.id_usuario=v.id_usuario
    LEFT JOIN SesionCaja sc ON sc.id_sesion_caja=v.id_sesion_caja
    LEFT JOIN Sucursal s ON s.id_sucursal=sc.id_sucursal
    LEFT JOIN ComprobanteFiscal cf ON cf.id_venta=v.id_venta AND cf.estado!='Anulado'
    WHERE CAST(v.fecha AS DATE) BETWEEN @FechaInicio AND @FechaFin
      AND v.estado IN('Completada','Credito')
      AND(@IdSucursal IS NULL OR sc.id_sucursal=@IdSucursal)
    ORDER BY v.fecha DESC;
END;
GO

-- ============================================================
--  NOTIFICACIONES Y EXPEDIENTE
-- ============================================================
CREATE OR ALTER PROCEDURE sp_CrearNotificacion
    @IdUsuario BIGINT, @IdCita BIGINT=NULL, @IdOrden BIGINT=NULL,
    @Tipo VARCHAR(15)='Sistema', @Titulo VARCHAR(100), @Mensaje VARCHAR(500),
    @Canal VARCHAR(10)='Sistema', @UrlAccion VARCHAR(200)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Notificacion(id_usuario,id_cita,id_orden,tipo,titulo,mensaje,canal,url_accion)
    VALUES(@IdUsuario,@IdCita,@IdOrden,@Tipo,@Titulo,@Mensaje,@Canal,@UrlAccion);
END;
GO

CREATE OR ALTER PROCEDURE sp_MarcarNotificacionLeida @IdNotificacion BIGINT, @IdUsuario BIGINT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Notificacion SET leida=1,fecha_lectura=GETDATE()
    WHERE id_notificacion=@IdNotificacion AND id_usuario=@IdUsuario;
END;
GO

CREATE OR ALTER PROCEDURE sp_ObtenerExpediente @IdCliente BIGINT AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM ExpedienteClinico WHERE id_cliente=@IdCliente;
    SELECT TOP 10 c.id_cita,c.fecha_hora,ic.nombre AS servicio,cat.nombre AS categoria,
           e.nombres+' '+e.apellidos AS especialista,c.notas,
           c.tipo_facial,c.tipo_piel,c.tipo_masaje,c.duracion_masaje_min,
           c.zona_depilacion,c.metodo_depilacion,c.subservicio_cejas,c.tiene_trabajo_anterior,
           c.tipo_unias,c.incluye_remocion,c.tipo_servicio_pelo,c.largo_cabello
    FROM Cita c
    INNER JOIN ItemCatalogo ic ON ic.id_item=c.id_item
    LEFT JOIN CategoriaServicio cat ON cat.id_categoria=ic.id_categoria
    LEFT JOIN Empleado e ON e.id_empleado=c.id_empleado
    WHERE c.id_cliente=@IdCliente AND c.estado='Completada'
    ORDER BY c.fecha_hora DESC;
END;
GO

PRINT '============================================================';
PRINT ' Stored Procedures v2 creados — AuraSpaDB';
PRINT '------------------------------------------------------------';
PRINT ' Auth:        sp_Login* · sp_RegistrarUsuario';
PRINT ' Citas:       sp_CrearCita · sp_CambiarEstadoCita · sp_ObtenerCitasCliente';
PRINT ' Ventas/Caja: sp_AbrirCaja · sp_CerrarCaja · sp_RegistrarVenta';
PRINT '              sp_CrearCotizacion · sp_FacturarCotizacion · sp_RegistrarAbonoCxC';
PRINT ' Fiscal:      sp_EmitirComprobanteFiscal · sp_AnularComprobante';
PRINT ' Inventario:  sp_RecibirOrdenCompra · sp_AjustarStock · sp_AlertasStockBajo';
PRINT ' Catálogo:    sp_ObtenerCatalogo · sp_ActualizarPrecioItem';
PRINT ' Reportes:    sp_ResumenDashboard · sp_ReporteVentasPorPeriodo';
PRINT ' Noti/Exped:  sp_CrearNotificacion · sp_MarcarNotificacionLeida · sp_ObtenerExpediente';
PRINT '============================================================';
GO
