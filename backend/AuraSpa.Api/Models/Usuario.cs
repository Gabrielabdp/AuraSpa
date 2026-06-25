using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Usuario")]
    public class Usuario
    {
        [Key][Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("email")] public string Email { get; set; } = string.Empty;
        [Column("nombre_usuario")] public string? NombreUsuario { get; set; }
        [Column("contrasena_hash")] public string ContrasenaHash { get; set; } = string.Empty;
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("apellido")] public string Apellido { get; set; } = string.Empty;
        [Column("telefono")] public string? Telefono { get; set; }
        [Column("id_perfil")] public long IdPerfil { get; set; }
        [Column("id_cliente")] public long? IdCliente { get; set; }
        [Column("id_empleado")] public long? IdEmpleado { get; set; }
        [Column("activo")] public bool Activo { get; set; } = true;
        [Column("verificado")] public bool Verificado { get; set; } = false;
        [Column("intentos_fallidos")] public short IntentosFallidos { get; set; } = 0;
        [Column("bloqueado_hasta")] public DateTime? BloqueadoHasta { get; set; }
        [Column("fecha_registro")] public DateTime FechaRegistro { get; set; } = DateTime.Now;
        [Column("ultimo_acceso")] public DateTime? UltimoAcceso { get; set; }
        // Navegacion
        [ForeignKey("IdPerfil")] public Perfil? Perfil { get; set; }
        [ForeignKey("IdCliente")] public Cliente? Cliente { get; set; }
        [ForeignKey("IdEmpleado")] public Empleado? Empleado { get; set; }
    }
}
