using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AuraSpa.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly IConfiguration _cfg;

        public AuthController(ApplicationDbContext ctx, IConfiguration cfg)
        { _ctx = ctx; _cfg = cfg; }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var usuario = await _ctx.Usuarios
                .Include(u => u.Perfil)
                .FirstOrDefaultAsync(u => u.Email == dto.Email || u.NombreUsuario == dto.Email);

            if (usuario == null || !usuario.Activo)
                return Unauthorized("Credenciales inválidas.");

            if (usuario.BloqueadoHasta.HasValue && usuario.BloqueadoHasta > DateTime.Now)
                return Unauthorized($"Cuenta bloqueada hasta {usuario.BloqueadoHasta:HH:mm}. Intenta más tarde.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.ContrasenaHash))
            {
                usuario.IntentosFallidos++;
                if (usuario.IntentosFallidos >= 5)
                    usuario.BloqueadoHasta = DateTime.Now.AddMinutes(15);
                await _ctx.SaveChangesAsync();
                return Unauthorized("Credenciales inválidas.");
            }

            usuario.IntentosFallidos = 0;
            usuario.BloqueadoHasta  = null;
            usuario.UltimoAcceso    = DateTime.Now;
            await _ctx.SaveChangesAsync();

            return Ok(new
            {
                token   = GenerateJwt(usuario),
                usuario = new
                {
                    id       = usuario.IdUsuario,
                    nombre   = usuario.Nombre,
                    apellido = usuario.Apellido,
                    email    = usuario.Email,
                    perfil   = usuario.Perfil?.Nombre ?? "Cliente",
                    // El frontend usará 'perfil' en vez de 'rol'
                    rol      = usuario.Perfil?.Nombre ?? "Cliente"
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _ctx.Usuarios.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("El email ya está registrado.");

            var perfil = await _ctx.Perfiles.FirstOrDefaultAsync(p => p.Nombre == dto.NombrePerfil)
                      ?? await _ctx.Perfiles.FirstOrDefaultAsync(p => p.Nombre == "Cliente");
            if (perfil == null) return BadRequest("Perfil no encontrado.");

            var tipoCed = await _ctx.TiposDocumento.FirstOrDefaultAsync(t => t.Codigo == "CED");
            if (tipoCed == null) return BadRequest("Base de datos no inicializada.");

            var cliente = new Cliente
            {
                IdTipoDoc       = tipoCed.IdTipoDoc,
                NumeroDocumento = dto.NumeroDocumento ?? "000-0000000-0",
                Nombres         = dto.Nombre,
                Apellidos       = dto.Apellido,
                Email           = dto.Email,
                Telefono        = dto.Telefono
            };
            _ctx.Clientes.Add(cliente);
            await _ctx.SaveChangesAsync();

            _ctx.Usuarios.Add(new Usuario
            {
                Email          = dto.Email,
                ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Nombre         = dto.Nombre,
                Apellido       = dto.Apellido,
                Telefono       = dto.Telefono,
                IdPerfil       = perfil.IdPerfil,
                IdCliente      = cliente.IdCliente
            });
            await _ctx.SaveChangesAsync();

            return Ok(new { message = "Usuario registrado exitosamente." });
        }

        // PUT /api/auth/perfil — editar datos propios
        [HttpPut("perfil")]
        [Authorize]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDto dto)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.Include(u => u.Cliente).FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
            if (usuario == null) return NotFound();
            usuario.Nombre   = dto.Nombre;
            usuario.Apellido = dto.Apellido;
            usuario.Telefono = dto.Telefono;
            if (usuario.Cliente != null) {
                usuario.Cliente.Nombres  = dto.Nombre;
                usuario.Cliente.Apellidos = dto.Apellido;
                usuario.Cliente.Telefono  = dto.Telefono;
            }
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Datos actualizados." });
        }

        private string GenerateJwt(Usuario usuario)
        {
            var key    = Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!);
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new(ClaimTypes.Name,  usuario.Nombre),
                new(ClaimTypes.Email, usuario.Email),
                new(ClaimTypes.Role,  usuario.Perfil?.Nombre ?? "Cliente")
            };
            var descriptor = new SecurityTokenDescriptor
            {
                Subject            = new ClaimsIdentity(claims),
                Expires            = DateTime.UtcNow.AddHours(8),
                Issuer             = _cfg["Jwt:Issuer"],
                Audience           = _cfg["Jwt:Audience"],
                SigningCredentials  = new SigningCredentials(
                    new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var handler = new JwtSecurityTokenHandler();
            return handler.WriteToken(handler.CreateToken(descriptor));
        }
    }
}
