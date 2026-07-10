using AuraSpa.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public DashboardController(ApplicationDbContext ctx) => _ctx = ctx;

        // GET /api/dashboard/resumen — Admin y Cajero
        [HttpGet("resumen")]
        [Authorize(Roles = "Admin,Cajero")]
        public async Task<IActionResult> Resumen()
        {
            var hoy = DateTime.Today;
            var ventasHoy = await _ctx.Ventas
                .Where(v => v.Fecha.Date == hoy && v.Estado != "Cancelada")
                .ToListAsync();
            var citasHoy = await _ctx.Citas
                .Where(c => c.FechaHora.Date == hoy)
                .GroupBy(c => c.Estado)
                .Select(g => new { estado = g.Key, cantidad = g.Count() })
                .ToListAsync();
            var topServicios = await _ctx.VentasDetalle
                .Include(d => d.Item)
                .Where(d => d.Venta!.Fecha.Month == hoy.Month && d.Item!.Tipo == "Servicio")
                .GroupBy(d => d.Item!.Nombre)
                .Select(g => new { servicio = g.Key, total = g.Sum(d => d.Cantidad) })
                .OrderByDescending(x => x.total).Take(5).ToListAsync();
            return Ok(new {
                ventas = new {
                    cantidad = ventasHoy.Count,
                    subtotal = ventasHoy.Sum(v => v.Subtotal),
                    itbis    = ventasHoy.Sum(v => v.Itbis),
                    total    = ventasHoy.Sum(v => v.Total)
                },
                citasPorEstado = citasHoy,
                topServicios
            });
        }

        // GET /api/dashboard/reportes — Admin Y Cajero (ambos)
        [HttpGet("reportes")]
        [Authorize(Roles = "Admin,Cajero")]
        public async Task<IActionResult> Reportes([FromQuery] int mes = 0, [FromQuery] int anio = 0)
        {
            if (mes  == 0) mes  = DateTime.Today.Month;
            if (anio == 0) anio = DateTime.Today.Year;

            var ventasMes = await _ctx.Ventas
                .Where(v => v.Fecha.Month == mes && v.Fecha.Year == anio && v.Estado != "Cancelada")
                .ToListAsync();

            var topServicios = await _ctx.VentasDetalle
                .Include(d => d.Item)
                .Where(d => d.Venta!.Fecha.Month == mes && d.Venta.Fecha.Year == anio && d.Item!.Tipo == "Servicio")
                .GroupBy(d => new { d.Item!.Nombre, d.Item.IdItem })
                .Select(g => new {
                    servicio = g.Key.Nombre,
                    veces    = g.Sum(d => d.Cantidad),
                    ingresos = g.Sum(d => d.Subtotal)
                })
                .OrderByDescending(x => x.ingresos).Take(8).ToListAsync();

            var citasPorCategoria = await _ctx.Citas
                .Include(c => c.Item).ThenInclude(i => i!.Categoria)
                .Where(c => c.FechaHora.Month == mes && c.FechaHora.Year == anio && c.Estado == "Completada")
                .GroupBy(c => c.Item!.Categoria!.Nombre)
                .Select(g => new { categoria = g.Key, cantidad = g.Count() })
                .OrderByDescending(x => x.cantidad).ToListAsync();

            var ventasPorDia = await _ctx.Ventas
                .Where(v => v.Fecha.Month == mes && v.Fecha.Year == anio && v.Estado != "Cancelada")
                .GroupBy(v => v.Fecha.Day)
                .Select(g => new { dia = g.Key, total = g.Sum(v => v.Total) })
                .OrderBy(x => x.dia).ToListAsync();

            var cxcPendientes = await _ctx.CuentasPorCobrar
                .Where(c => c.Estado == "Pendiente" || c.Estado == "Parcial")
                .CountAsync();

            return Ok(new {
                mes, anio,
                resumenMes = new {
                    totalVentas    = ventasMes.Count,
                    ingresosBrutos = ventasMes.Sum(v => v.Subtotal),
                    itbisTotal     = ventasMes.Sum(v => v.Itbis),
                    ingresosNetos  = ventasMes.Sum(v => v.Total),
                    descuentos     = ventasMes.Sum(v => v.Descuento)
                },
                topServicios,
                citasPorCategoria,
                ventasPorDia,
                cxcPendientes
            });
        }

        // GET /api/dashboard/citas-hoy
        [HttpGet("citas-hoy")]
        [Authorize(Roles = "Admin,Cajero,Especialista")]
        public async Task<IActionResult> CitasHoy()
        {
            var hoy = DateTime.Today;
            var citas = await _ctx.Citas
                .Include(c => c.Cliente).Include(c => c.Item).Include(c => c.Empleado)
                .Where(c => c.FechaHora.Date == hoy)
                .OrderBy(c => c.FechaHora)
                .Select(c => new {
                    c.IdCita, c.FechaHora, c.Estado, c.PrecioAcordado,
                    Cliente      = c.Cliente != null ? c.Cliente.Nombres + " " + c.Cliente.Apellidos : "Sin cliente",
                    Servicio     = c.Item != null ? c.Item.Nombre : "",
                    Especialista = c.Empleado != null ? c.Empleado.Nombres + " " + c.Empleado.Apellidos : "Sin asignar"
                }).ToListAsync();
            return Ok(citas);
        }

        // GET /api/dashboard/citas-pendientes
        [HttpGet("citas-pendientes")]
        [Authorize(Roles = "Admin,Cajero,Especialista")]
        public async Task<IActionResult> CitasPendientes()
        {
            var citas = await _ctx.Citas
                .Include(c => c.Cliente).Include(c => c.Item).Include(c => c.Empleado)
                .Where(c => c.Estado == "Pendiente")
                .OrderBy(c => c.FechaHora).Take(10)
                .Select(c => new {
                    c.IdCita, c.FechaHora, c.Estado, c.PrecioAcordado,
                    Cliente      = c.Cliente != null ? c.Cliente.Nombres + " " + c.Cliente.Apellidos : "Sin cliente",
                    Servicio     = c.Item != null ? c.Item.Nombre : "",
                    Especialista = c.Empleado != null ? c.Empleado.Nombres + " " + c.Empleado.Apellidos : "Sin asignar"
                }).ToListAsync();
            return Ok(citas);
        }

        // GET /api/dashboard/notificaciones/{usuarioId}
        [HttpGet("notificaciones/{usuarioId}")]
        [Authorize]
        public async Task<IActionResult> GetNotificaciones(long usuarioId)
        {
            var idUsuarioActual = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (usuarioId != idUsuarioActual) return Forbid();

            var notifs = await _ctx.Notificaciones
                .Where(n => n.IdUsuario == usuarioId)
                .OrderByDescending(n => n.FechaEnvio).Take(20).ToListAsync();
            return Ok(notifs);
        }

        [HttpPut("notificaciones/{id}/leer")]
        [Authorize]
        public async Task<IActionResult> MarcarLeida(long id)
        {
            var idUsuarioActual = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var n = await _ctx.Notificaciones.FindAsync(id);
            if (n == null) return NotFound();
            if (n.IdUsuario != idUsuarioActual) return Forbid();

            n.Leida = true; n.FechaLectura = DateTime.Now;
            await _ctx.SaveChangesAsync();
            return Ok();
        }
    }
}
