using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("CategoriaServicio")]
    public class CategoriaServicio
    {
        [Key][Column("id_categoria")] public long IdCategoria { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("descripcion")] public string? Descripcion { get; set; }
        [Column("icono_url")] public string? IconoUrl { get; set; }
        [Column("orden_display")] public short OrdenDisplay { get; set; }
        [Column("activa")] public bool Activa { get; set; } = true;
    }
}
