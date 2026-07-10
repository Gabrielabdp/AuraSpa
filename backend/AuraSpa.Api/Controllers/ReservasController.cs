using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
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
    public class ReservasController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly EmailService _emailService;
        private readonly ILogger<ReservasController> _logger;

        public ReservasController(ApplicationDbContext ctx, EmailService emailService, ILogger<ReservasController> logger)
        {
            _ctx = ctx;
            _emailService = emailService;
            _logger = logger;
        }

        private static string ConstruirHtmlReserva(List<(string Nombre, int Cantidad, decimal PrecioUnitario)> productos, decimal total, string sucursal)
        {
            var filas = string.Join("", productos.Select(p => $@"
                <tr>
                  <td style=""padding:8px 0;color:#333;font-size:0.9rem;"">{p.Nombre}</td>
                  <td style=""padding:8px 0;color:#666;font-size:0.9rem;text-align:center;"">x{p.Cantidad}</td>
                  <td style=""padding:8px 0;color:#666;font-size:0.9rem;text-align:right;"">RD$ {(p.PrecioUnitario * p.Cantidad).ToString("N2")}</td>
                </tr>"));

            return $@"
            <div style=""font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;"">
              <div style=""background:#1A1A2E;padding:30px;text-align:center;border-radius:20px 20px 0 0;"">
                <span style=""color:#ffffff;font-size:1.6rem;font-weight:bold;"">AURA</span>
                <span style=""color:#978ADD;font-size:1.6rem;font-weight:bold;""> Spa</span>
              </div>
              <div style=""background:#ffffff;padding:30px;border:1px solid #eee;"">
                <p style=""font-size:1rem;color:#333;"">¡Hola! Tu reserva de productos fue confirmada. Aquí el resumen:</p>
                <table style=""width:100%;border-collapse:collapse;margin-top:16px;"">
                  {filas}
                </table>
                <div style=""background:#f8f6ff;border-radius:15px;padding:20px;margin-top:20px;"">
                  <p style=""margin:0 0 8px;color:#666;font-size:0.9rem;""><strong>Total:</strong> RD$ {total.ToString("N2")}</p>
                  <p style=""margin:0;color:#666;font-size:0.9rem;""><strong>Sucursal de retiro:</strong> {sucursal}</p>
                </div>
                <p style=""font-size:0.85rem;color:#a15c00;background:#fff8e6;border-radius:10px;padding:12px;margin-top:20px;"">
                  Tienes <strong>48 horas</strong> para pasar a recoger tus productos y pagar en caja.
                </p>
              </div>
              <div style=""background:#1A1A2E;padding:16px;text-align:center;border-radius:0 0 20px 20px;"">
                <p style=""color:#ccc;font-size:0.78rem;margin:0;"">AuraSpa — contacto@auraspa.com</p>
              </div>
            </div>";
        }

        // POST /api/reservas
        [HttpPost]
        public async Task<IActionResult> CrearReserva([FromBody] CrearReservaDto dto)
        {
            if (dto.Productos == null || dto.Productos.Count == 0)
                return BadRequest("El carrito no tiene productos.");

            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario == null) return BadRequest("Usuario no encontrado.");

            var sucursal = await _ctx.Sucursales.FindAsync(dto.IdSucursal);
            if (sucursal == null) return BadRequest("Sucursal no válida.");

            var reservas = new List<ProductoApartado>();
            var resumenEmail = new List<(string Nombre, int Cantidad, decimal PrecioUnitario)>();
            decimal totalGeneral = 0;

            foreach (var linea in dto.Productos)
            {
                var item = await _ctx.ItemsCatalogo.FindAsync(linea.IdItem);
                if (item == null) return BadRequest($"El producto {linea.IdItem} no existe.");

                var subtotal = linea.PrecioUnitario * linea.Cantidad;
                var itbis    = Math.Round(subtotal * 0.18m, 2);
                var total    = subtotal + itbis;

                reservas.Add(new ProductoApartado
                {
                    IdUsuario      = usuario.IdUsuario,
                    IdItem         = linea.IdItem,
                    Cantidad       = linea.Cantidad,
                    PrecioUnitario = linea.PrecioUnitario,
                    Subtotal       = subtotal,
                    Itbis          = itbis,
                    Total          = total,
                    IdSucursal     = dto.IdSucursal,
                    Estado         = "Pendiente",
                    FechaReserva   = DateTime.Now,
                    Notas          = dto.Notas
                });

                resumenEmail.Add((item.Nombre, linea.Cantidad, linea.PrecioUnitario));
                totalGeneral += total;
            }

            _ctx.ProductosApartados.AddRange(reservas);
            await _ctx.SaveChangesAsync();

            var mensajeNotif = $"Tu reserva de {dto.Productos.Count} producto(s) en {sucursal.Nombre} fue registrada. Tienes 48 horas para recogerlos.";
            _ctx.Notificaciones.Add(new Notificacion
            {
                IdUsuario  = usuario.IdUsuario,
                Tipo       = "Orden",
                Titulo     = "Reserva confirmada",
                Mensaje    = mensajeNotif,
                FechaEnvio = DateTime.Now,
                Leida      = false
            });
            await _ctx.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrEmpty(usuario.Email))
                {
                    var html = ConstruirHtmlReserva(resumenEmail, totalGeneral, sucursal.Nombre);
                    await _emailService.SendEmailAsync(usuario.Email, usuario.Nombre,
                        "AuraSpa — Tu reserva fue confirmada", html);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar el correo de reserva confirmada para el usuario {IdUsuario}", usuario.IdUsuario);
            }

            return Ok(new { idsApartado = reservas.Select(r => r.IdApartado), total = totalGeneral });
        }

        // GET /api/reservas/mis-reservas
        [HttpGet("mis-reservas")]
        public async Task<IActionResult> GetMisReservas()
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var reservas = await _ctx.ProductosApartados
                .Include(r => r.Item)
                .Include(r => r.Sucursal)
                .Where(r => r.IdUsuario == idUsuario)
                .OrderByDescending(r => r.FechaReserva)
                .Select(r => new
                {
                    r.IdApartado,
                    Producto  = r.Item!.Nombre,
                    r.Cantidad,
                    r.PrecioUnitario,
                    r.Subtotal,
                    r.Itbis,
                    r.Total,
                    Sucursal  = r.Sucursal!.Nombre,
                    r.Estado,
                    r.FechaReserva,
                    r.Notas
                })
                .ToListAsync();

            return Ok(reservas);
        }
    }
}
