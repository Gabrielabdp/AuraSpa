using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Pais")]
    public class Pais
    {
        [Key][Column("id_pais")] public long IdPais { get; set; }
        [Column("codigo")] public string Codigo { get; set; } = string.Empty;
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
    }
}
