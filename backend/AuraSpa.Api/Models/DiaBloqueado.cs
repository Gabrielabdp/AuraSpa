using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("DiaBloqueado")]
    public class DiaBloqueado
    {
        [Key][Column("id_dia_bloqueado")] public long IdDiaBloqueado { get; set; }
        [Column("fecha")] public DateTime Fecha { get; set; }
        [Column("motivo")] public string Motivo { get; set; } = string.Empty;
        [Column("activo")] public bool Activo { get; set; } = true;
        [Column("fecha_creacion")] public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}
