using AuraSpa.Api.Data;
using AuraSpa.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LealtadController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public LealtadController(ApplicationDbContext ctx) => _ctx = ctx;

        // GET /api/lealtad/estado
        [HttpGet("estado")]
        public async Task<IActionResult> GetEstado()
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdCliente == null) return BadRequest("Usuario sin perfil de cliente.");

            var cliente = await _ctx.Clientes.FindAsync(usuario.IdCliente.Value);
            if (cliente == null) return NotFound();

            var puntos = cliente.Puntos;
            string nivelActual;
            string? proximoNivel;
            int? puntosParaProximoNivel;

            if (puntos < 500)
            {
                nivelActual = "Bronce";
                proximoNivel = "Plata";
                puntosParaProximoNivel = 500 - puntos;
            }
            else if (puntos < 1000)
            {
                nivelActual = "Plata";
                proximoNivel = "Oro";
                puntosParaProximoNivel = 1000 - puntos;
            }
            else
            {
                nivelActual = "Oro";
                proximoNivel = null;
                puntosParaProximoNivel = null;
            }

            return Ok(new
            {
                puntos,
                codigoReferido = cliente.CodigoReferido,
                nivelActual,
                proximoNivel,
                puntosParaProximoNivel
            });
        }

        // POST /api/lealtad/reservar-productos
        [HttpPost("reservar-productos")]
        public async Task<IActionResult> ReservarProductos([FromBody] ReservarProductosDto dto)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdCliente == null) return BadRequest("Usuario sin perfil de cliente.");

            var cliente = await _ctx.Clientes.FindAsync(usuario.IdCliente.Value);
            if (cliente == null) return NotFound();

            var puntosGanados = PuntosCalculator.PorMonto(dto.MontoTotal);
            cliente.Puntos += puntosGanados;
            await _ctx.SaveChangesAsync();

            return Ok(new { puntosGanados, puntosTotales = cliente.Puntos });
        }
    }

    public class ReservarProductosDto
    {
        public decimal MontoTotal { get; set; }
    }
}
