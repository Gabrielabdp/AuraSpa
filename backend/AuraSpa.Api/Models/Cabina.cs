using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Cabina")]
    public class Cabina
    {
        [Key][Column("id_cabina")] public long IdCabina { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("id_categoria")] public long? IdCategoria { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("activa")] public bool Activa { get; set; } = true;
    }
}
