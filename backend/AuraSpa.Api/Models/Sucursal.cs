using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Sucursal")]
    public class Sucursal
    {
        [Key][Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("direccion")] public string Direccion { get; set; } = string.Empty;
        [Column("telefono")] public string? Telefono { get; set; }
        [Column("email_contacto")] public string? EmailContacto { get; set; }
        [Column("activa")] public bool Activa { get; set; } = true;
        [Column("horario_apertura")] public TimeOnly? HorarioApertura { get; set; }
        [Column("horario_cierre")] public TimeOnly? HorarioCierre { get; set; }
        [Column("fecha_creacion")] public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}
