using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("MetodoPago")]
    public class MetodoPago
    {
        [Key][Column("id_metodo_pago")] public long IdMetodoPago { get; set; }
        [Column("codigo")] public string Codigo { get; set; } = string.Empty;
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("activo")] public bool Activo { get; set; } = true;
    }
}
