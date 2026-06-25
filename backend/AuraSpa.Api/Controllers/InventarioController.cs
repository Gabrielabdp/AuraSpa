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
    [Authorize(Roles = "Admin,Cajero")]
    public class InventarioController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IConfiguration _cfg;
        public InventarioController(ApplicationDbContext ctx, IConfiguration cfg)
        { _ctx = ctx; _cfg = cfg; }

        // GET /api/inventario/stock/{sucursalId}
        [HttpGet("stock/{sucursalId}")]
        public async Task<IActionResult> GetStock(long sucursalId)
        {
            var stock = await _ctx.ItemsCatalogo
                .Include(i => i.Categoria)
                .Where(i => i.Activo && i.Tipo == "Producto")
                .Join(_ctx.Set<ItemCatalogoSucursal>().Where(s => s.IdSucursal == sucursalId),
                      item => item.IdItem,
                      ics  => ics.IdItem,
                      (item, ics) => new {
                          item.IdItem,
                          item.Nombre,
                          Categoria  = item.Categoria != null ? item.Categoria.Nombre : "",
                          ics.Stock,
                          ics.StockMinimo,
                          ics.Disponible,
                          Alerta = ics.Stock.HasValue && ics.Stock <= ics.StockMinimo
                      })
                .ToListAsync();
            return Ok(stock);
        }

        // GET /api/inventario/alertas/{sucursalId}
        [HttpGet("alertas/{sucursalId}")]
        public async Task<IActionResult> GetAlertas(long sucursalId)
        {
            using var conn = new SqlConnection(_cfg.GetConnectionString("DefaultConnection"));
            await conn.OpenAsync();
            using var cmd = new SqlCommand("sp_AlertasStockBajo", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdSucursal", sucursalId);
            using var reader = await cmd.ExecuteReaderAsync();
            var alertas = new List<object>();
            while (await reader.ReadAsync())
                alertas.Add(new {
                    idItem      = reader["id_item"],
                    producto    = reader["producto"].ToString(),
                    sucursal    = reader["sucursal"].ToString(),
                    stockActual = reader["stock_actual"],
                    stockMinimo = reader["stock_minimo"],
                    alerta      = reader["alerta"].ToString()
                });
            return Ok(alertas);
        }

        // GET /api/inventario/movimientos/{itemId}
        [HttpGet("movimientos/{itemId}")]
        public async Task<IActionResult> GetMovimientos(long itemId)
        {
            var movs = await _ctx.MovimientosInventario
                .Where(m => m.IdItem == itemId)
                .OrderByDescending(m => m.FechaHora)
                .Take(50)
                .ToListAsync();
            return Ok(movs);
        }

        // GET /api/inventario/proveedores
        [HttpGet("proveedores")]
        public async Task<IActionResult> GetProveedores()
            => Ok(await _ctx.Proveedores.Where(p => p.Activo).ToListAsync());

        // POST /api/inventario/proveedores
        [HttpPost("proveedores")]
        public async Task<IActionResult> CrearProveedor([FromBody] Proveedor prov)
        {
            _ctx.Proveedores.Add(prov);
            await _ctx.SaveChangesAsync();
            return Ok(prov);
        }

        // GET /api/inventario/ordenes-compra
        [HttpGet("ordenes-compra")]
        public async Task<IActionResult> GetOrdenes()
        {
            var ordenes = await _ctx.OrdenesCompra
                .Include(o => o.Proveedor)
                .Include(o => o.Sucursal)
                .Include(o => o.Detalles)
                .OrderByDescending(o => o.FechaEmision)
                .ToListAsync();
            return Ok(ordenes);
        }

        // POST /api/inventario/ordenes-compra
        [HttpPost("ordenes-compra")]
        public async Task<IActionResult> CrearOrden([FromBody] OrdenCompra orden)
        {
            orden.NumeroOrden  = $"OC-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks % 10000:D4}";
            orden.FechaEmision = DateTime.Now;
            orden.Estado       = "Pendiente";
            foreach (var d in orden.Detalles)
                d.Subtotal = d.CantidadPedida * d.PrecioUnitario;
            orden.Subtotal = orden.Detalles.Sum(d => d.Subtotal);
            orden.Itbis    = orden.Subtotal * 0.18m;
            orden.Total    = orden.Subtotal + orden.Itbis;
            _ctx.OrdenesCompra.Add(orden);
            await _ctx.SaveChangesAsync();
            return Ok(orden);
        }

        // POST /api/inventario/ordenes-compra/{id}/recibir
        [HttpPost("ordenes-compra/{id}/recibir")]
        public async Task<IActionResult> RecibirOrden(long id, [FromBody] long idUsuario)
        {
            using var conn = new SqlConnection(_cfg.GetConnectionString("DefaultConnection"));
            await conn.OpenAsync();
            using var cmd = new SqlCommand("sp_RecibirOrdenCompra", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdOrdenCompra", id);
            cmd.Parameters.AddWithValue("@IdUsuario",     idUsuario);
            var pError = new SqlParameter("@Error", SqlDbType.VarChar, 200) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pError);
            await cmd.ExecuteNonQueryAsync();
            string? error = pError.Value as string;
            if (!string.IsNullOrEmpty(error)) return BadRequest(error);
            return Ok(new { mensaje = "Orden recibida. Stock actualizado." });
        }

        // POST /api/inventario/ajuste
        [HttpPost("ajuste")]
        public async Task<IActionResult> AjustarStock([FromBody] AjusteStockDto dto)
        {
            using var conn = new SqlConnection(_cfg.GetConnectionString("DefaultConnection"));
            await conn.OpenAsync();
            using var cmd = new SqlCommand("sp_AjustarStock", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdItem",     dto.IdItem);
            cmd.Parameters.AddWithValue("@IdSucursal", dto.IdSucursal);
            cmd.Parameters.AddWithValue("@StockReal",  dto.StockReal);
            cmd.Parameters.AddWithValue("@Concepto",   dto.Concepto);
            cmd.Parameters.AddWithValue("@IdUsuario",  dto.IdUsuario);
            var pError = new SqlParameter("@Error", SqlDbType.VarChar, 200) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pError);
            await cmd.ExecuteNonQueryAsync();
            string? error = pError.Value as string;
            if (!string.IsNullOrEmpty(error)) return BadRequest(error);
            return Ok(new { mensaje = "Stock ajustado." });
        }
    }

    public class AjusteStockDto
    {
        public long   IdItem     { get; set; }
        public long   IdSucursal { get; set; }
        public int    StockReal  { get; set; }
        public string Concepto   { get; set; } = string.Empty;
        public long   IdUsuario  { get; set; }
    }
}
