using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Cliente")]
    public class Cliente
    {
        [Key][Column("id_cliente")] public long IdCliente { get; set; }
        [Column("id_tipo_doc")] public long IdTipoDoc { get; set; }
        [Column("numero_documento")] public string NumeroDocumento { get; set; } = string.Empty;
        [Column("id_pais_doc")] public long? IdPaisDoc { get; set; }
        [Column("nombres")] public string Nombres { get; set; } = string.Empty;
        [Column("apellidos")] public string Apellidos { get; set; } = string.Empty;
        [Column("fecha_nacimiento")] public DateOnly? FechaNacimiento { get; set; }
        [Column("genero")] public string? Genero { get; set; }
        [Column("email")] public string? Email { get; set; }
        [Column("telefono")] public string? Telefono { get; set; }
        [Column("telefono_alt")] public string? TelefonoAlt { get; set; }
        [Column("direccion")] public string? Direccion { get; set; }
        [Column("activo")] public bool Activo { get; set; } = true;
        [Column("fecha_registro")] public DateTime FechaRegistro { get; set; } = DateTime.Now;
        [Column("puntos")] public int Puntos { get; set; } = 0;
        [Column("codigo_referido")] public string? CodigoReferido { get; set; }
        [Column("id_cliente_referidor")] public long? IdClienteReferidor { get; set; }
        // Navegacion
        [ForeignKey("IdTipoDoc")] public TipoDocumento? TipoDocumento { get; set; }
        [ForeignKey("IdPaisDoc")] public Pais? Pais { get; set; }
    }
}
