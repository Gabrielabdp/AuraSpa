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

            if (dto.CondicionPago == "Credito" && !dto.IdCliente.HasValue)
                return BadRequest("Las ventas a crédito requieren un cliente identificado.");

            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
                IdUsuario     = idUsuario,
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

            await _ctx.SaveChangesAsync();

            if (dto.CondicionPago == "Credito")
            {
                _ctx.CuentasPorCobrar.Add(new CuentaPorCobrar
                {
                    IdVenta          = venta.IdVenta,
                    IdCliente        = venta.IdCliente!.Value,
                    MontoOriginal    = venta.Total,
                    MontoAbonado     = 0,
                    FechaVencimiento = DateTime.Now.AddDays(15),
                    Estado           = "Pendiente"
                });
                await _ctx.SaveChangesAsync();
            }

            return Ok(new { venta.IdVenta, venta.NumeroFactura, venta.Total, venta.Itbis, venta.Subtotal });
        }

        // GET /api/caja/ventas/{sesionId}
        [HttpGet("ventas/{sesionId}")]
        public async Task<IActionResult> GetVentasPorSesion(long sesionId)
        {
            var ventas = await _ctx.Ventas
                .Where(v => v.IdSesionCaja == sesionId)
                .OrderByDescending(v => v.Fecha)
                .Select(v => new
                {
                    v.IdVenta,
                    v.NumeroFactura,
                    v.IdCliente,
                    v.IdMetodoPago,
                    v.Fecha,
                    v.Subtotal,
                    v.Itbis,
                    v.Total,
                    v.CondicionPago,
                    v.Estado,
                    Detalles = v.Detalles.Select(d => new
                    {
                        d.IdDetalle,
                        d.IdItem,
                        Producto = d.Item != null ? d.Item.Nombre : "",
                        d.Cantidad,
                        d.PrecioUnitario,
                        d.Subtotal
                    })
                })
                .ToListAsync();
            return Ok(ventas);
        }

        // GET /api/caja/movimientos?desde=&hasta=  (por defecto, ventas del día actual)
        [HttpGet("movimientos")]
        public async Task<IActionResult> GetMovimientos([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            var inicio = (desde ?? DateTime.Today).Date;
            var fin    = (hasta ?? DateTime.Today).Date.AddDays(1);

            var movimientos = await _ctx.Ventas
                .Include(v => v.Usuario)
                .Where(v => v.Fecha >= inicio && v.Fecha < fin)
                .OrderByDescending(v => v.Fecha)
                .Select(v => new
                {
                    id            = v.IdVenta,
                    concepto      = "Venta #" + v.NumeroFactura,
                    fecha         = v.Fecha,
                    tipo          = "Ingreso",
                    condicionPago = v.CondicionPago,
                    usuario       = v.Usuario != null ? v.Usuario.Nombre + " " + v.Usuario.Apellido : "—",
                    monto         = v.Total,
                    estado        = v.Estado
                })
                .ToListAsync();

            return Ok(movimientos);
        }

        // GET /api/caja/cxc — cuentas por cobrar pendientes o parciales
        [HttpGet("cxc")]
        public async Task<IActionResult> GetCxc()
        {
            var cxc = await _ctx.CuentasPorCobrar
                .Include(c => c.Venta)
                .Include(c => c.Cliente)
                .Where(c => c.Estado == "Pendiente" || c.Estado == "Parcial")
                .OrderBy(c => c.FechaVencimiento)
                .Select(c => new
                {
                    id               = c.IdCxc,
                    ventaId          = c.Venta != null ? c.Venta.NumeroFactura : "",
                    clienteNombre    = c.Cliente != null ? c.Cliente.Nombres + " " + c.Cliente.Apellidos : "Cliente",
                    montoTotal       = c.MontoOriginal,
                    montoPagado      = c.MontoAbonado,
                    saldoPendiente   = c.MontoOriginal - c.MontoAbonado,
                    fechaVencimiento = c.FechaVencimiento,
                    estado           = c.Estado
                })
                .ToListAsync();

            return Ok(cxc);
        }

        // POST /api/caja/cxc/{id}/abono
        [HttpPost("cxc/{id}/abono")]
        public async Task<IActionResult> RegistrarAbono(long id, [FromBody] RegistrarAbonoDto dto)
        {
            var cxc = await _ctx.CuentasPorCobrar.FindAsync(id);
            if (cxc == null) return NotFound("Cuenta por cobrar no encontrada.");

            var saldo = cxc.MontoOriginal - cxc.MontoAbonado;
            if (dto.Monto <= 0 || dto.Monto > saldo)
                return BadRequest("El monto del abono no es válido.");

            cxc.MontoAbonado += dto.Monto;
            cxc.Estado = (cxc.MontoOriginal - cxc.MontoAbonado) <= 0 ? "Saldada" : "Parcial";
            await _ctx.SaveChangesAsync();

            return Ok(new { cxc.IdCxc, cxc.MontoAbonado, saldoPendiente = cxc.MontoOriginal - cxc.MontoAbonado, cxc.Estado });
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

    public class RegistrarAbonoDto
    {
        public decimal Monto { get; set; }
    }
}
