using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Resena")]
    public class Resena
    {
        [Key][Column("id_resena")] public long IdResena { get; set; }
        [Column("id_cliente")] public long IdCliente { get; set; }
        [Column("id_cita")] public long IdCita { get; set; }
        [Column("calificacion")] public byte Calificacion { get; set; }
        [Column("comentario")] public string? Comentario { get; set; }
        [Column("fecha")] public DateTime Fecha { get; set; } = DateTime.Now;
        [Column("visible")] public bool Visible { get; set; } = true;
        // Navegacion
        [ForeignKey("IdCliente")] public Cliente? Cliente { get; set; }
        [ForeignKey("IdCita")] public Cita? Cita { get; set; }
    }
}
