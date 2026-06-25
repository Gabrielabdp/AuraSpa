using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Perfil")]
    public class Perfil
    {
        [Key][Column("id_perfil")] public long IdPerfil { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("descripcion")] public string? Descripcion { get; set; }
        [Column("activo")] public bool Activo { get; set; } = true;
    }
}
