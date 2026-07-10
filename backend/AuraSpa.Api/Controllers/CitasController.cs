using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Helpers;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CitasController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CitasController(ApplicationDbContext ctx) => _ctx = ctx;

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

            if (cita.Estado != "Pendiente" && cita.Estado != "Aprobada")
                return BadRequest("Solo se pueden cancelar citas Pendientes o Aprobadas.");

            // Regla 72 horas
            if ((cita.FechaHora - DateTime.Now).TotalHours < 72)
                return BadRequest("No puedes cancelar con menos de 72 horas de anticipación.");

            cita.Estado = "Cancelada";
            await _ctx.SaveChangesAsync();
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

            var estadosValidos = new[] { "Pendiente","Aprobada","Confirmada","Completada","Cancelada","Rechazada" };
            // Normalizar: "Confirmada" = "Aprobada" para compatibilidad entre capas
            if (nuevoEstado == "Confirmada") nuevoEstado = "Aprobada";
            if (!estadosValidos.Contains(nuevoEstado)) return BadRequest("Estado inválido.");

            if (nuevoEstado == "Completada" && cita.Estado != "Completada")
            {
                var cliente = await _ctx.Clientes.FindAsync(cita.IdCliente);
                if (cliente != null) cliente.Puntos += PuntosCalculator.PorMonto(cita.PrecioAcordado ?? 0);
            }

            cita.Estado = nuevoEstado;
            await _ctx.SaveChangesAsync();
            return Ok(new { cita.IdCita, cita.Estado });
        }
    }
}
