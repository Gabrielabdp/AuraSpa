using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuraSpa.Api.Data;
using AuraSpa.Api.DTOs;
using AuraSpa.Api.Helpers;
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

            var primerLogin = usuario.UltimoAcceso == null;

            usuario.IntentosFallidos = 0;
            usuario.BloqueadoHasta  = null;
            usuario.UltimoAcceso    = DateTime.Now;
            await _ctx.SaveChangesAsync();

            return Ok(new
            {
                token   = GenerateJwt(usuario),
                primerLogin,
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

            var numeroDoc = dto.NumeroDocumento ?? $"SN-{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}";

            if (!string.IsNullOrEmpty(dto.NumeroDocumento))
            {
                bool cedulaExiste = await _ctx.Clientes.AnyAsync(c => c.NumeroDocumento == numeroDoc);
                if (cedulaExiste)
                    return BadRequest("Esta cédula ya está registrada en el sistema.");
            }

            Cliente? referidor = null;
            if (!string.IsNullOrWhiteSpace(dto.CodigoReferido))
            {
                var codigoBuscado = dto.CodigoReferido.Trim().ToUpper();
                referidor = await _ctx.Clientes.FirstOrDefaultAsync(c => c.CodigoReferido == codigoBuscado);
            }

            var cliente = new Cliente
            {
                IdTipoDoc          = tipoCed.IdTipoDoc,
                NumeroDocumento    = numeroDoc,
                Nombres            = dto.Nombre,
                Apellidos          = dto.Apellido,
                Email              = dto.Email,
                Telefono           = dto.Telefono,
                Puntos             = PuntosCalculator.PuntosRegistro,
                CodigoReferido     = await GenerarCodigoReferidoUnicoAsync(),
                IdClienteReferidor = referidor?.IdCliente
            };
            _ctx.Clientes.Add(cliente);

            if (referidor != null) referidor.Puntos += PuntosCalculator.PuntosReferido;

            await _ctx.SaveChangesAsync();

            var usuario = new Usuario
            {
                Email          = dto.Email,
                ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Nombre         = dto.Nombre,
                NombreUsuario  = dto.Email,
                Apellido       = dto.Apellido,
                Telefono       = dto.Telefono,
                IdPerfil       = perfil.IdPerfil,
                IdCliente      = cliente.IdCliente
            };
            _ctx.Usuarios.Add(usuario);
            await _ctx.SaveChangesAsync();
            usuario.Perfil = perfil;

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
                    rol      = usuario.Perfil?.Nombre ?? "Cliente"
                }
            });
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

        // PUT /api/auth/cambiar-password — cambiar la propia contraseña
        [HttpPut("cambiar-password")]
        [Authorize]
        public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
        {
            var idUsuario = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var usuario   = await _ctx.Usuarios.FindAsync(idUsuario);
            if (usuario == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.ContrasenaHash))
                return BadRequest("La contraseña actual es incorrecta.");

            if (string.IsNullOrEmpty(dto.PasswordNueva) || dto.PasswordNueva.Length < 8)
                return BadRequest("La nueva contraseña debe tener al menos 8 caracteres.");

            usuario.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNueva);
            await _ctx.SaveChangesAsync();
            return Ok(new { message = "Contraseña actualizada correctamente." });
        }


        // GET /api/auth/clientes — lista de clientes (Admin/Cajero)
        [HttpGet("clientes")]
        [Authorize(Roles = "Admin,Cajero")]
        public async Task<IActionResult> GetClientes()
        {
            var clientes = await _ctx.Clientes
                .OrderByDescending(c => c.FechaRegistro)
                .Select(c => new {
                    c.IdCliente, c.Nombres, c.Apellidos, c.Email,
                    c.Telefono, c.NumeroDocumento, c.FechaRegistro
                })
                .ToListAsync();
            return Ok(clientes);
        }



        private async Task<string> GenerarCodigoReferidoUnicoAsync()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (0/O, 1/I)
            var rng = new Random();
            string codigo;
            do
            {
                codigo = new string(Enumerable.Range(0, 6).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
            } while (await _ctx.Clientes.AnyAsync(c => c.CodigoReferido == codigo));
            return codigo;
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
