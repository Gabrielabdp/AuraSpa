using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Notificacion")]
    public class Notificacion
    {
        [Key][Column("id_notificacion")] public long IdNotificacion { get; set; }
        [Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("id_cita")] public long? IdCita { get; set; }
        [Column("id_orden")] public long? IdOrden { get; set; }
        [Column("tipo")] public string Tipo { get; set; } = "Sistema";
        [Column("titulo")] public string Titulo { get; set; } = string.Empty;
        [Column("mensaje")] public string Mensaje { get; set; } = string.Empty;
        [Column("canal")] public string Canal { get; set; } = "Sistema";
        [Column("leida")] public bool Leida { get; set; } = false;
        [Column("fecha_envio")] public DateTime FechaEnvio { get; set; } = DateTime.Now;
        [Column("fecha_lectura")] public DateTime? FechaLectura { get; set; }
        [Column("url_accion")] public string? UrlAccion { get; set; }
    }
}
