using AuraSpa.Api.Data;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Data;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Cajero,Admin")]
    public class ComprobanteFiscalController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IConfiguration _cfg;
        public ComprobanteFiscalController(ApplicationDbContext ctx, IConfiguration cfg)
        { _ctx = ctx; _cfg = cfg; }

        // GET /api/comprobante/tipos
        [HttpGet("tipos")]
        public async Task<IActionResult> GetTipos()
            => Ok(await _ctx.TiposNCF.Where(t => t.Activo).ToListAsync());

        // GET /api/comprobante/secuencias/{sucursalId}
        [HttpGet("secuencias/{sucursalId}")]
        public async Task<IActionResult> GetSecuencias(long sucursalId)
        {
            var secs = await _ctx.SecuenciasNCF
                .Include(s => s.TipoNCF)
                .Where(s => s.IdSucursal == sucursalId && s.Activa)
                .ToListAsync();
            return Ok(secs.Select(s => new {
                s.IdSecuencia, s.Prefijo,
                TipoNCF = s.TipoNCF!.Codigo,
                NombreTipo = s.TipoNCF.Nombre,
                Disponibles = s.NumeroHasta - s.NumeroActual,
                s.FechaVencimiento
            }));
        }

        // POST /api/comprobante/emitir
        [HttpPost("emitir")]
        public async Task<IActionResult> Emitir([FromBody] EmitirComprobanteDto dto)
        {
            using var conn = new SqlConnection(_cfg.GetConnectionString("DefaultConnection"));
            await conn.OpenAsync();
            using var cmd = new SqlCommand("sp_EmitirComprobanteFiscal", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdVenta",           dto.IdVenta);
            cmd.Parameters.AddWithValue("@CodigoTipoNCF",     dto.CodigoTipoNCF);
            cmd.Parameters.AddWithValue("@RncCedulaReceptor", (object?)dto.RncCedulaReceptor ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@NombreReceptor",    (object?)dto.NombreReceptor    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdUsuario",         dto.IdUsuario);
            var pNumero = new SqlParameter("@NumeroComprobante", SqlDbType.VarChar, 19) { Direction = ParameterDirection.Output };
            var pError  = new SqlParameter("@Error",             SqlDbType.VarChar, 200) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pNumero); cmd.Parameters.Add(pError);
            await cmd.ExecuteNonQueryAsync();

            string? error = pError.Value as string;
            if (!string.IsNullOrEmpty(error)) return BadRequest(error);

            return Ok(new { numeroComprobante = pNumero.Value?.ToString(), mensaje = "Comprobante emitido exitosamente." });
        }

        // PUT /api/comprobante/{id}/anular
        [HttpPut("{id}/anular")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Anular(long id, [FromBody] long idUsuario)
        {
            using var conn = new SqlConnection(_cfg.GetConnectionString("DefaultConnection"));
            await conn.OpenAsync();
            using var cmd = new SqlCommand("sp_AnularComprobante", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdComprobante", id);
            cmd.Parameters.AddWithValue("@IdUsuario",     idUsuario);
            var pError = new SqlParameter("@Error", SqlDbType.VarChar, 200) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pError);
            await cmd.ExecuteNonQueryAsync();
            string? error = pError.Value as string;
            if (!string.IsNullOrEmpty(error)) return BadRequest(error);
            return Ok(new { mensaje = "Comprobante anulado." });
        }

        // GET /api/comprobante/venta/{ventaId}
        [HttpGet("venta/{ventaId}")]
        public async Task<IActionResult> GetPorVenta(long ventaId)
        {
            var cf = await _ctx.ComprobantesFiscales
                .Include(c => c.TipoNCF)
                .FirstOrDefaultAsync(c => c.IdVenta == ventaId && c.Estado != "Anulado");
            if (cf == null) return NotFound("Esta venta no tiene comprobante fiscal.");
            return Ok(cf);
        }

        // POST /api/comprobante/secuencias  (Admin: registrar nueva secuencia)
        [HttpPost("secuencias")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CrearSecuencia([FromBody] SecuenciaNCF sec)
        {
            _ctx.SecuenciasNCF.Add(sec);
            await _ctx.SaveChangesAsync();
            return Ok(sec);
        }
    }

    public class EmitirComprobanteDto
    {
        public long   IdVenta            { get; set; }
        public string CodigoTipoNCF      { get; set; } = "B02";
        public string? RncCedulaReceptor { get; set; }
        public string? NombreReceptor    { get; set; }
        public long   IdUsuario          { get; set; }
    }
}
