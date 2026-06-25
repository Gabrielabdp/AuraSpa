using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("ItemCatalogo")]
    public class ItemCatalogo
    {
        [Key][Column("id_item")] public long IdItem { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("descripcion")] public string Descripcion { get; set; } = string.Empty;
        [Column("precio_base", TypeName="decimal(18,2)")] public decimal PrecioBase { get; set; }
        [Column("tipo")] public string Tipo { get; set; } = "Servicio";
        [Column("imagen_url")] public string? ImagenUrl { get; set; }
        [Column("id_categoria")] public long? IdCategoria { get; set; }
        [Column("duracion_minutos")] public int? DuracionMinutos { get; set; }
        [Column("precio_variable")] public bool PrecioVariable { get; set; } = false;
        [Column("itbis_aplica")] public bool ItbisAplica { get; set; } = true;
        [Column("activo")] public bool Activo { get; set; } = true;
        [ForeignKey("IdCategoria")] public CategoriaServicio? Categoria { get; set; }
    }
}
