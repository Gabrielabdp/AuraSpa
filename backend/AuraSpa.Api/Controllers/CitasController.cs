using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Helpers;
using AuraSpa.Api.Models;
using AuraSpa.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CitasController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly EmailService _emailService;
        private readonly ILogger<CitasController> _logger;
        public CitasController(ApplicationDbContext ctx, EmailService emailService, ILogger<CitasController> logger)
        {
            _ctx = ctx;
            _emailService = emailService;
            _logger = logger;
        }

        private static string FormatearFecha(DateTime fechaHora)
            => fechaHora.ToString("dd 'de' MMMM 'de' yyyy", new CultureInfo("es-DO"));

        private async Task NotificarClienteAsync(long idUsuarioCliente, long idCita, string titulo, string mensaje)
        {
            _ctx.Notificaciones.Add(new Notificacion
            {
                IdUsuario  = idUsuarioCliente,
                IdCita     = idCita,
                Tipo       = "Cita",
                Titulo     = titulo,
                Mensaje    = mensaje,
                FechaEnvio = DateTime.Now,
                Leida      = false
            });
            await _ctx.SaveChangesAsync();
        }

        private static string ConstruirHtmlCita(string mensajePrincipal, string servicio, DateTime fechaHora)
        {
            var culturaEs = new CultureInfo("es-DO");
            var fecha = fechaHora.ToString("dd 'de' MMMM 'de' yyyy", culturaEs);
            var hora  = fechaHora.ToString("hh:mm tt", culturaEs);
            return $@"
            <div style=""font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;"">
              <div style=""background:#1A1A2E;padding:30px;text-align:center;border-radius:20px 20px 0 0;"">
                <span style=""color:#ffffff;font-size:1.6rem;font-weight:bold;"">AURA</span>
                <span style=""color:#978ADD;font-size:1.6rem;font-weight:bold;""> Spa</span>
              </div>
              <div style=""background:#ffffff;padding:30px;border:1px solid #eee;"">
                <p style=""font-size:1rem;color:#333;"">{mensajePrincipal}</p>
                <div style=""background:#f8f6ff;border-radius:15px;padding:20px;margin-top:20px;"">
                  <p style=""margin:0 0 8px;color:#666;font-size:0.9rem;""><strong>Servicio:</strong> {servicio}</p>
                  <p style=""margin:0 0 8px;color:#666;font-size:0.9rem;""><strong>Fecha:</strong> {fecha}</p>
                  <p style=""margin:0;color:#666;font-size:0.9rem;""><strong>Hora:</strong> {hora}</p>
                </div>
              </div>
              <div style=""background:#1A1A2E;padding:16px;text-align:center;border-radius:0 0 20px 20px;"">
                <p style=""color:#ccc;font-size:0.78rem;margin:0;"">AuraSpa — contacto@auraspa.com</p>
              </div>
            </div>";
        }

        // GET /api/citas/mis-citas
        [HttpGet("mis-citas")]
        public async Task<IActionResult> GetMisCitas()
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdCliente == null) return Ok(new List<object>());

            var citas = await _ctx.Citas
                .Include(c => c.Item).ThenInclude(i => i!.Categoria)
                .Include(c => c.Empleado)
                .Include(c => c.Sucursal)
                .Where(c => c.IdCliente == usuario.IdCliente)
                .OrderByDescending(c => c.FechaHora)
                .Select(c => new
                {
                    c.IdCita,
                    c.FechaHora,
                    c.Estado,
                    c.Notas,
                    c.PrecioAcordado,
                    Servicio    = c.Item!.Nombre,
                    Categoria   = c.Item.Categoria!.Nombre,
                    Especialista = c.Empleado != null ? c.Empleado.Nombres + " " + c.Empleado.Apellidos : "Sin asignar",
                    Sucursal    = c.Sucursal!.Nombre,
                    // campos específicos
                    c.TipoFacial, c.TipoPiel,
                    c.TipoMasaje, c.DuracionMasajeMin,
                    c.ZonaDepilacion, c.MetodoDepilacion,
                    c.SubservicioCejas, c.TieneTrabajoAnterior,
                    c.TipoUnias, c.IncluyeRemocion,
                    c.TipoServicioPelo, c.LargoCabello
                })
                .ToListAsync();

            return Ok(citas);
        }

        // POST /api/citas
        [HttpPost]
        public async Task<IActionResult> CrearCita([FromBody] CrearCitaDto dto)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdCliente == null) return BadRequest("Usuario sin perfil de cliente.");

            if (dto.FechaHora <= DateTime.Now)
                return BadRequest("La fecha de la cita debe ser futura.");

            // Verificar doble agendamiento
            if (dto.IdEmpleado.HasValue)
            {
                var conflicto = await _ctx.Citas.AnyAsync(c =>
                    c.IdEmpleado == dto.IdEmpleado &&
                    c.FechaHora  == dto.FechaHora  &&
                    c.Estado     != "Cancelada"     &&
                    c.Estado     != "Rechazada");

                if (conflicto) return BadRequest("El especialista ya tiene una cita a esa hora.");
            }

            var item = await _ctx.ItemsCatalogo.FindAsync(dto.IdItem);

            var cita = new Cita
            {
                IdCliente           = usuario.IdCliente.Value,
                IdEmpleado          = dto.IdEmpleado,
                IdItem              = dto.IdItem,
                IdCabina            = dto.IdCabina,
                IdSucursal          = dto.IdSucursal,
                IdMetodoPago        = dto.IdMetodoPago,
                FechaHora           = dto.FechaHora,
                DuracionMinutos     = dto.DuracionMasajeMin ?? item?.DuracionMinutos,
                PrecioAcordado      = item?.PrecioBase,
                Estado              = "Pendiente",
                Notas               = dto.Notas,
                TipoFacial          = dto.TipoFacial,
                TipoPiel            = dto.TipoPiel,
                TipoMasaje          = dto.TipoMasaje,
                DuracionMasajeMin   = dto.DuracionMasajeMin,
                ZonaDepilacion      = dto.ZonaDepilacion,
                MetodoDepilacion    = dto.MetodoDepilacion,
                SubservicioCejas    = dto.SubservicioCejas,
                TieneTrabajoAnterior = dto.TieneTrabajoAnterior,
                TipoUnias           = dto.TipoUnias,
                IncluyeRemocion     = dto.IncluyeRemocion,
                TipoServicioPelo    = dto.TipoServicioPelo,
                LargoCabello        = dto.LargoCabello
            };

            _ctx.Citas.Add(cita);
            await _ctx.SaveChangesAsync();

            var usuarioCliente = await _ctx.Usuarios.FirstOrDefaultAsync(u => u.IdCliente == cita.IdCliente);

            if (usuarioCliente != null)
            {
                var mensajeNotif = $"Tu solicitud de cita para {item?.Nombre ?? "servicio"} el {FormatearFecha(cita.FechaHora)} fue registrada exitosamente.";
                await NotificarClienteAsync(usuarioCliente.IdUsuario, cita.IdCita, "Solicitud recibida", mensajeNotif);
            }

            try
            {
                if (usuarioCliente != null && !string.IsNullOrEmpty(usuarioCliente.Email))
                {
                    var html = ConstruirHtmlCita(
                        "¡Hola! Recibimos tu solicitud de cita. Nuestro equipo la revisará y te avisaremos apenas quede confirmada.",
                        item?.Nombre ?? "Servicio", cita.FechaHora);
                    await _emailService.SendEmailAsync(usuarioCliente.Email, usuarioCliente.Nombre,
                        "AuraSpa — Tu solicitud fue recibida", html);
                }
            }
            catch (Exception ex)
            {
                // El envío del correo no debe interrumpir la creación de la cita
                _logger.LogError(ex, "No se pudo enviar el correo de solicitud recibida para la cita {IdCita}", cita.IdCita);
            }

            return Ok(new { cita.IdCita, cita.Estado, cita.FechaHora });
        }

        // PUT /api/citas/{id}/cancelar
        [HttpPut("{id}/cancelar")]
        public async Task<IActionResult> Cancelar(long id)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            var cita      = await _ctx.Citas.FindAsync(id);

            if (cita == null || cita.IdCliente != usuario?.IdCliente)
                return NotFound();

            if (cita.Estado != "Pendiente" && cita.Estado != "Confirmada")
                return BadRequest("Solo se pueden cancelar citas Pendientes o Confirmadas.");

            // Regla 72 horas
            if ((cita.FechaHora - DateTime.Now).TotalHours < 72)
                return BadRequest("No puedes cancelar con menos de 72 horas de anticipación.");

            cita.Estado = "Cancelada";
            await _ctx.SaveChangesAsync();

            if (usuario != null)
            {
                var itemCancelado = await _ctx.ItemsCatalogo.FindAsync(cita.IdItem);
                var mensajeNotif = $"Tu cita de {itemCancelado?.Nombre ?? "servicio"} el {FormatearFecha(cita.FechaHora)} fue cancelada exitosamente.";
                await NotificarClienteAsync(usuario.IdUsuario, cita.IdCita, "Cita cancelada", mensajeNotif);
            }

            return Ok(new { message = "Cita cancelada exitosamente." });
        }

        // GET /api/citas/todas  (solo Admin/Especialista)
        [HttpGet("todas")]
        [Authorize(Roles = "Admin,Cajero,Especialista")]
        public async Task<IActionResult> GetTodas([FromQuery] string? estado, [FromQuery] DateTime? fecha)
        {
            var q = _ctx.Citas
                .Include(c => c.Cliente)
                .Include(c => c.Item)
                .Include(c => c.Empleado)
                .AsQueryable();

            if (!string.IsNullOrEmpty(estado)) q = q.Where(c => c.Estado == estado);
            if (fecha.HasValue) q = q.Where(c => c.FechaHora.Date == fecha.Value.Date);

            return Ok(await q.OrderBy(c => c.FechaHora).ToListAsync());
        }

        // GET /api/citas/disponibilidad?idEmpleado=&fecha=  — horas ocupadas de un especialista en una fecha
        // Accesible para cualquier usuario autenticado (incluye Cliente agendando); no expone datos de otros clientes.
        [HttpGet("disponibilidad")]
        public async Task<IActionResult> GetDisponibilidad([FromQuery] long idEmpleado, [FromQuery] DateTime fecha)
        {
            var horasOcupadas = await _ctx.Citas
                .Where(c => c.IdEmpleado == idEmpleado
                         && c.FechaHora.Date == fecha.Date
                         && c.Estado != "Cancelada" && c.Estado != "Rechazada")
                .Select(c => c.FechaHora)
                .ToListAsync();

            return Ok(horasOcupadas.Select(h => h.ToString("HH:mm")));
        }

        // GET /api/citas/mis-citas-empleado  (solo el propio Especialista)
        [HttpGet("mis-citas-empleado")]
        [Authorize(Roles = "Especialista")]
        public async Task<IActionResult> GetMisCitasEmpleado([FromQuery] DateTime? fecha)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdEmpleado == null) return Ok(new List<object>());

            var q = _ctx.Citas
                .Include(c => c.Cliente)
                .Include(c => c.Item).ThenInclude(i => i!.Categoria)
                .Include(c => c.Empleado)
                .Where(c => c.IdEmpleado == usuario.IdEmpleado.Value)
                .AsQueryable();

            if (fecha.HasValue) q = q.Where(c => c.FechaHora.Date == fecha.Value.Date);

            return Ok(await q.OrderBy(c => c.FechaHora).ToListAsync());
        }

        // PUT /api/citas/{id}/estado  (solo Admin)
        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Admin,Cajero,Especialista")]
        public async Task<IActionResult> CambiarEstado(long id, [FromBody] string nuevoEstado)
        {
            var cita = await _ctx.Citas.FindAsync(id);
            if (cita == null) return NotFound();

            var estadosValidos = new[] { "Pendiente","Confirmada","Completada","Cancelada","Rechazada" };
            if (!estadosValidos.Contains(nuevoEstado)) return BadRequest("Estado inválido.");

            if (nuevoEstado == "Completada" && cita.Estado != "Completada")
            {
                var cliente = await _ctx.Clientes.FindAsync(cita.IdCliente);
                if (cliente != null) cliente.Puntos += PuntosCalculator.PorMonto(cita.PrecioAcordado ?? 0);
            }

            cita.Estado = nuevoEstado;
            await _ctx.SaveChangesAsync();

            if (nuevoEstado == "Confirmada" || nuevoEstado == "Rechazada")
            {
                var usuarioCliente = await _ctx.Usuarios.FirstOrDefaultAsync(u => u.IdCliente == cita.IdCliente);
                var itemCita = await _ctx.ItemsCatalogo.FindAsync(cita.IdItem);
                var esConfirmada = nuevoEstado == "Confirmada";
                var servicioNombre = itemCita?.Nombre ?? "servicio";
                var fechaFormateada = FormatearFecha(cita.FechaHora);

                if (usuarioCliente != null)
                {
                    var tituloNotif = esConfirmada ? "Cita confirmada" : "Cita no disponible";
                    var mensajeNotif = esConfirmada
                        ? $"Tu cita de {servicioNombre} el {fechaFormateada} ha sido confirmada. ¡Te esperamos!"
                        : $"Lo sentimos, tu cita de {servicioNombre} el {fechaFormateada} no pudo ser confirmada.";
                    await NotificarClienteAsync(usuarioCliente.IdUsuario, cita.IdCita, tituloNotif, mensajeNotif);
                }

                try
                {
                    if (usuarioCliente != null && !string.IsNullOrEmpty(usuarioCliente.Email))
                    {
                        var html = ConstruirHtmlCita(
                            esConfirmada
                                ? "¡Buenas noticias! Tu cita fue confirmada. Te esperamos en la fecha y hora acordadas."
                                : "Lamentablemente no pudimos confirmar tu cita para el horario solicitado. Contáctanos o agenda otro horario disponible.",
                            servicioNombre, cita.FechaHora);
                        await _emailService.SendEmailAsync(usuarioCliente.Email, usuarioCliente.Nombre,
                            esConfirmada ? "AuraSpa — Tu cita fue confirmada" : "AuraSpa — Tu cita no pudo ser confirmada",
                            html);
                    }
                }
                catch (Exception ex)
                {
                    // El envío del correo no debe interrumpir el cambio de estado
                    _logger.LogError(ex, "No se pudo enviar el correo de cambio de estado para la cita {IdCita}", cita.IdCita);
                }
            }

            return Ok(new { cita.IdCita, cita.Estado });
        }
    }
}
