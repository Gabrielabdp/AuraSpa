using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Helpers;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Cajero,Admin,Especialista")]
    public class CajaController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CajaController(ApplicationDbContext ctx) => _ctx = ctx;

        // GET /api/caja/sesion-activa/{usuarioId}
        [HttpGet("sesion-activa/{usuarioId}")]
        public async Task<IActionResult> GetSesionActiva(long usuarioId)
        {
            var sesion = await _ctx.SesionesCaja
                .Include(s => s.Sucursal)
                .FirstOrDefaultAsync(s => s.IdUsuario == usuarioId && s.Estado == "Abierta");
            if (sesion == null) return NotFound("No hay sesión activa.");
            return Ok(sesion);
        }

        // POST /api/caja/apertura
        [HttpPost("apertura")]
        public async Task<IActionResult> AbrirCaja([FromBody] AperturaCajaDto dto)
        {
            if (await _ctx.SesionesCaja.AnyAsync(s => s.IdUsuario == dto.IdUsuario && s.Estado == "Abierta"))
                return BadRequest("Ya tienes una sesión de caja abierta.");

            var sesion = new SesionCaja
            {
                IdUsuario     = dto.IdUsuario,
                IdSucursal    = dto.IdSucursal,
                MontoInicial  = dto.MontoInicial,
                NotasApertura = dto.Notas,
                Estado        = "Abierta"
            };
            _ctx.SesionesCaja.Add(sesion);
            await _ctx.SaveChangesAsync();
            return Ok(sesion);
        }

        // POST /api/caja/cierre/{id}
        [HttpPost("cierre/{id}")]
        public async Task<IActionResult> CerrarCaja(long id, [FromBody] CierreCajaDto dto)
        {
            var sesion = await _ctx.SesionesCaja.FindAsync(id);
            if (sesion == null || sesion.Estado != "Abierta") return NotFound("Sesión no encontrada.");

            sesion.FechaCierre  = DateTime.Now;
            sesion.MontoFinal   = dto.MontoFinal;
            sesion.Diferencia   = dto.MontoFinal - sesion.MontoInicial;
            sesion.Justificacion = dto.Justificacion;
            sesion.Estado       = "Cerrada";
            await _ctx.SaveChangesAsync();
            return Ok(sesion);
        }

        // POST /api/caja/venta
        [HttpPost("venta")]
        public async Task<IActionResult> RegistrarVenta([FromBody] VentaDto dto)
        {
            if (dto.Detalles == null || dto.Detalles.Count == 0)
                return BadRequest("La venta debe tener al menos un ítem.");

            // Calcular montos
            decimal subtotal = 0;
            var detalles = new List<VentaDetalle>();

            foreach (var d in dto.Detalles)
            {
                var linea = (d.PrecioUnitario - d.DescuentoLinea) * d.Cantidad;
                subtotal += linea;
                detalles.Add(new VentaDetalle
                {
                    IdItem         = d.IdItem,
                    IdEmpleado     = d.IdEmpleado,
                    Cantidad       = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    DescuentoLinea = d.DescuentoLinea,
                    Subtotal       = linea
                });
            }

            decimal itbis = subtotal * 0.18m;
            decimal total = subtotal + itbis;

            // Generar número de factura único
            var numFactura = $"FAC-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks % 100000:D5}";

            var venta = new Venta
            {
                NumeroFactura = numFactura,
                IdCliente     = dto.IdCliente,
                IdSesionCaja  = dto.IdSesionCaja,
                IdMetodoPago  = dto.IdMetodoPago,
                CondicionPago = dto.CondicionPago,
                TipoVenta     = "POS",
                Subtotal      = subtotal,
                Itbis         = itbis,
                Descuento     = 0,
                Total         = total,
                Estado        = "Completada",
                Detalles      = detalles
            };

            _ctx.Ventas.Add(venta);

            if (venta.IdCliente.HasValue)
            {
                var cliente = await _ctx.Clientes.FindAsync(venta.IdCliente.Value);
                if (cliente != null) cliente.Puntos += PuntosCalculator.PorMonto(venta.Total);
            }

            // Descontar stock de productos
            foreach (var d in dto.Detalles)
            {
                var item = await _ctx.ItemsCatalogo.FindAsync(d.IdItem);
                if (item?.Tipo == "Producto")
                {
                    // El stock se maneja en ItemCatalogoSucursal, ajustamos via SP si existe
                    // Por ahora solo registramos la venta
                }
            }

            await _ctx.SaveChangesAsync();
            return Ok(new { venta.IdVenta, venta.NumeroFactura, venta.Total, venta.Itbis, venta.Subtotal });
        }

        // GET /api/caja/ventas/{sesionId}
        [HttpGet("ventas/{sesionId}")]
        public async Task<IActionResult> GetVentasPorSesion(long sesionId)
        {
            var ventas = await _ctx.Ventas
                .Include(v => v.Detalles).ThenInclude(d => d.Item)
                .Where(v => v.IdSesionCaja == sesionId)
                .OrderByDescending(v => v.Fecha)
                .ToListAsync();
            return Ok(ventas);
        }
    }

    // DTOs locales de Caja
    public class AperturaCajaDto
    {
        public long    IdUsuario    { get; set; }
        public long    IdSucursal   { get; set; }
        public decimal MontoInicial { get; set; }
        public string? Notas        { get; set; }
    }

    public class CierreCajaDto
    {
        public decimal MontoFinal   { get; set; }
        public string? Justificacion { get; set; }
    }
}
