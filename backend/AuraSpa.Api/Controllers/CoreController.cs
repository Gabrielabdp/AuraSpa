using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CoreController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        public CoreController(ApplicationDbContext ctx) => _ctx = ctx;

        // ── SUCURSALES ──────────────────────────────────────────
        // GET /api/core/sucursales
        [HttpGet("sucursales")]
        public async Task<IActionResult> GetSucursales()
            => Ok(await _ctx.Sucursales
                .Where(s => s.Activa)
                .OrderBy(s => s.Nombre)
                .Select(s => new { id = s.IdSucursal, s.Nombre, s.Direccion, s.Telefono, activo = s.Activa })
                .ToListAsync());

        // POST /api/core/sucursales
        [HttpPost("sucursales")]
        public async Task<IActionResult> CrearSucursal([FromBody] SucursalDto dto)
        {
            var sucursal = new Sucursal { Nombre = dto.Nombre, Direccion = dto.Direccion, Telefono = dto.Telefono };
            _ctx.Sucursales.Add(sucursal);
            await _ctx.SaveChangesAsync();
            return Ok(new { id = sucursal.IdSucursal, sucursal.Nombre, sucursal.Direccion, sucursal.Telefono, activo = sucursal.Activa });
        }

        // PUT /api/core/sucursales/{id}
        [HttpPut("sucursales/{id}")]
        public async Task<IActionResult> EditarSucursal(long id, [FromBody] SucursalDto dto)
        {
            var sucursal = await _ctx.Sucursales.FindAsync(id);
            if (sucursal == null) return NotFound();

            sucursal.Nombre    = dto.Nombre;
            sucursal.Direccion = dto.Direccion;
            sucursal.Telefono  = dto.Telefono;
            await _ctx.SaveChangesAsync();

            return Ok(new { id = sucursal.IdSucursal, sucursal.Nombre, sucursal.Direccion, sucursal.Telefono, activo = sucursal.Activa });
        }

        // DELETE /api/core/sucursales/{id}  (soft delete)
        [HttpDelete("sucursales/{id}")]
        public async Task<IActionResult> DesactivarSucursal(long id)
        {
            var sucursal = await _ctx.Sucursales.FindAsync(id);
            if (sucursal == null) return NotFound();

            sucursal.Activa = false;
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Sucursal desactivada." });
        }

        // ── PERFILES ────────────────────────────────────────────
        // GET /api/core/perfiles
        [HttpGet("perfiles")]
        public async Task<IActionResult> GetPerfiles()
            => Ok(await _ctx.Perfiles
                .OrderBy(p => p.Nombre)
                .Select(p => new { id = p.IdPerfil, p.Nombre, p.Descripcion })
                .ToListAsync());

        // ── USUARIOS ────────────────────────────────────────────
        // GET /api/core/usuarios
        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
            => Ok(await _ctx.Usuarios
                .Include(u => u.Perfil)
                .OrderBy(u => u.Nombre)
                .Select(u => new { id = u.IdUsuario, u.Nombre, u.Apellido, u.Email, perfil = u.Perfil!.Nombre, activo = u.Activo })
                .ToListAsync());

        // PUT /api/core/usuarios/{id}/toggle
        [HttpPut("usuarios/{id}/toggle")]
        public async Task<IActionResult> ToggleUsuario(long id)
        {
            var usuario = await _ctx.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            usuario.Activo = !usuario.Activo;
            await _ctx.SaveChangesAsync();

            return Ok(new { id = usuario.IdUsuario, activo = usuario.Activo });
        }

        // ── EMPLEADOS ───────────────────────────────────────────
        // GET /api/core/empleados
        [HttpGet("empleados")]
        public async Task<IActionResult> GetEmpleados()
        {
            var empleados = await _ctx.Empleados
                .Include(e => e.Sucursal)
                .Where(e => e.Activo)
                .OrderBy(e => e.Nombres)
                .ToListAsync();

            var idsEmpleados = empleados.Select(e => e.IdEmpleado).ToList();
            var emailPorEmpleado = await _ctx.Usuarios
                .Where(u => u.IdEmpleado != null && idsEmpleados.Contains(u.IdEmpleado.Value))
                .ToDictionaryAsync(u => u.IdEmpleado!.Value, u => u.Email);

            var resultado = empleados.Select(e => new
            {
                id            = e.IdEmpleado,
                e.Nombres,
                e.Apellidos,
                documento     = e.NumeroDocumento,
                tipoEmpleado  = e.TipoEmpleado,
                e.Telefono,
                sucursal      = e.Sucursal != null ? e.Sucursal.Nombre : "",
                idSucursal    = e.IdSucursal,
                emailUsuario  = emailPorEmpleado.GetValueOrDefault(e.IdEmpleado)
            });

            return Ok(resultado);
        }

        // POST /api/core/empleados
        [HttpPost("empleados")]
        public async Task<IActionResult> CrearEmpleado([FromBody] EmpleadoDto dto)
        {
            var empleado = new Empleado
            {
                Nombres         = dto.Nombres,
                Apellidos       = dto.Apellidos,
                IdTipoDoc       = 1, // Cédula de Identidad Dominicana
                NumeroDocumento = dto.NumeroDocumento,
                TipoEmpleado    = dto.TipoEmpleado,
                Telefono        = dto.Telefono,
                IdSucursal      = dto.IdSucursal
            };
            _ctx.Empleados.Add(empleado);
            await _ctx.SaveChangesAsync();

            return Ok(new { id = empleado.IdEmpleado, empleado.Nombres, empleado.Apellidos });
        }

        // PUT /api/core/empleados/{id}
        [HttpPut("empleados/{id}")]
        public async Task<IActionResult> EditarEmpleado(long id, [FromBody] EmpleadoDto dto)
        {
            var empleado = await _ctx.Empleados.FindAsync(id);
            if (empleado == null) return NotFound();

            empleado.Nombres         = dto.Nombres;
            empleado.Apellidos       = dto.Apellidos;
            empleado.NumeroDocumento = dto.NumeroDocumento;
            empleado.TipoEmpleado    = dto.TipoEmpleado;
            empleado.Telefono        = dto.Telefono;
            empleado.IdSucursal      = dto.IdSucursal;
            await _ctx.SaveChangesAsync();

            return Ok(new { id = empleado.IdEmpleado, empleado.Nombres, empleado.Apellidos });
        }
    }
}
