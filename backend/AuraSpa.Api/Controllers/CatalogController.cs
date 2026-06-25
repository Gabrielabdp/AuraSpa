using AuraSpa.Api.Data;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CatalogController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CatalogController(ApplicationDbContext ctx) => _ctx = ctx;

        // GET /api/catalog  (todos los items activos)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? tipo, [FromQuery] long? categoriaId)
        {
            var q = _ctx.ItemsCatalogo.Include(i => i.Categoria)
                        .Where(i => i.Activo);
            if (!string.IsNullOrEmpty(tipo))    q = q.Where(i => i.Tipo == tipo);
            if (categoriaId.HasValue)            q = q.Where(i => i.IdCategoria == categoriaId);
            return Ok(await q.OrderBy(i => i.Categoria!.OrdenDisplay).ThenBy(i => i.Nombre).ToListAsync());
        }

        // GET /api/catalog/services
        [HttpGet("services")]
        public async Task<IActionResult> GetServices([FromQuery] long? categoriaId)
        {
            var q = _ctx.ItemsCatalogo.Include(i => i.Categoria)
                        .Where(i => i.Activo && i.Tipo == "Servicio");
            if (categoriaId.HasValue) q = q.Where(i => i.IdCategoria == categoriaId);
            return Ok(await q.OrderBy(i => i.Categoria!.OrdenDisplay).ThenBy(i => i.Nombre).ToListAsync());
        }

        // GET /api/catalog/products
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
            => Ok(await _ctx.ItemsCatalogo.Where(i => i.Activo && i.Tipo == "Producto").ToListAsync());

        // GET /api/catalog/categorias
        [HttpGet("categorias")]
        public async Task<IActionResult> GetCategorias()
            => Ok(await _ctx.CategoriasServicio.Where(c => c.Activa).OrderBy(c => c.OrdenDisplay).ToListAsync());

        // GET /api/catalog/empleados/{categoriaId}
        [HttpGet("empleados/{categoriaId}")]
        public async Task<IActionResult> GetEmpleadosPorCategoria(long categoriaId)
        {
            var empleados = await _ctx.Empleados
                .Where(e => e.Activo)
                .Select(e => new { e.IdEmpleado, NombreCompleto = e.Nombres + " " + e.Apellidos, e.EmailEmpresarial })
                .ToListAsync();
            return Ok(empleados);
        }

        // POST /api/catalog  (solo Admin)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ItemCatalogo item)
        {
            _ctx.ItemsCatalogo.Add(item);
            await _ctx.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = item.IdItem }, item);
        }

        // PUT /api/catalog/{id}  (solo Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(long id, [FromBody] ItemCatalogo item)
        {
            if (id != item.IdItem) return BadRequest();
            _ctx.Entry(item).State = EntityState.Modified;
            await _ctx.SaveChangesAsync();
            return NoContent();
        }
    }
}
