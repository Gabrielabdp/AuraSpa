using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("SesionCaja")]
    public class SesionCaja
    {
        [Key][Column("id_sesion_caja")] public long IdSesionCaja { get; set; }
        [Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("fecha_apertura")] public DateTime FechaApertura { get; set; } = DateTime.Now;
        [Column("fecha_cierre")] public DateTime? FechaCierre { get; set; }
        [Column("monto_inicial", TypeName="decimal(18,2)")] public decimal MontoInicial { get; set; }
        [Column("monto_final", TypeName="decimal(18,2)")] public decimal? MontoFinal { get; set; }
        [Column("diferencia", TypeName="decimal(18,2)")] public decimal? Diferencia { get; set; }
        [Column("justificacion")] public string? Justificacion { get; set; }
        [Column("notas_apertura")] public string? NotasApertura { get; set; }
        [Column("estado")] public string Estado { get; set; } = "Abierta";
        [ForeignKey("IdUsuario")] public Usuario? Usuario { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
    }
}
