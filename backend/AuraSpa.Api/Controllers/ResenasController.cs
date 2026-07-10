using AuraSpa.Api.Data;
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
    public class ResenasController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public ResenasController(ApplicationDbContext ctx) => _ctx = ctx;

        // POST /api/resenas
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearResenaDto dto)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario?.IdCliente == null) return BadRequest("Usuario sin perfil de cliente.");

            if (dto.Calificacion < 1 || dto.Calificacion > 5)
                return BadRequest("La calificación debe estar entre 1 y 5.");

            var cita = await _ctx.Citas.FindAsync(dto.IdCita);
            if (cita == null || cita.IdCliente != usuario.IdCliente.Value)
                return NotFound("Cita no encontrada.");

            if (cita.Estado != "Completada")
                return BadRequest("Solo puedes dejar una reseña de citas completadas.");

            if (await _ctx.Resenas.AnyAsync(r => r.IdCita == dto.IdCita))
                return BadRequest("Ya dejaste una reseña para esta cita.");

            var resena = new Resena
            {
                IdCliente    = usuario.IdCliente.Value,
                IdCita       = dto.IdCita,
                Calificacion = dto.Calificacion,
                Comentario   = dto.Comentario
            };
            _ctx.Resenas.Add(resena);

            var cliente = await _ctx.Clientes.FindAsync(usuario.IdCliente.Value);
            if (cliente != null) cliente.Puntos += PuntosCalculator.PuntosResena;

            await _ctx.SaveChangesAsync();
            return Ok(new { resena.IdResena, puntosGanados = PuntosCalculator.PuntosResena });
        }
    }

    public class CrearResenaDto
    {
        public long   IdCita       { get; set; }
        public byte   Calificacion { get; set; }
        public string? Comentario  { get; set; }
    }
}
