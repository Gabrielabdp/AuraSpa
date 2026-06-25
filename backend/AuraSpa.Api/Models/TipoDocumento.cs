using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("TipoDocumento")]
    public class TipoDocumento
    {
        [Key][Column("id_tipo_doc")] public long IdTipoDoc { get; set; }
        [Column("codigo")] public string Codigo { get; set; } = string.Empty;
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("descripcion")] public string? Descripcion { get; set; }
        [Column("longitud_min")] public short? LongitudMin { get; set; }
        [Column("longitud_max")] public short? LongitudMax { get; set; }
        [Column("solo_numeros")] public bool SoloNumeros { get; set; }
        [Column("requiere_pais")] public bool RequierePais { get; set; }
        [Column("activo")] public bool Activo { get; set; } = true;
    }
}
