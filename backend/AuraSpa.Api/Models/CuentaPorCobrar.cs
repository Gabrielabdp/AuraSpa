using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("CuentaPorCobrar")]
    public class CuentaPorCobrar
    {
        [Key][Column("id_cxc")] public long IdCxc { get; set; }
        [Column("id_venta")] public long IdVenta { get; set; }
        [Column("id_cliente")] public long IdCliente { get; set; }
        [Column("monto_original", TypeName="decimal(18,2)")] public decimal MontoOriginal { get; set; }
        [Column("monto_abonado", TypeName="decimal(18,2)")] public decimal MontoAbonado { get; set; } = 0;
        [Column("fecha_vencimiento")] public DateTime FechaVencimiento { get; set; }
        [Column("estado")] public string Estado { get; set; } = "Pendiente";
        [Column("notas")] public string? Notas { get; set; }
        [Column("fecha_creacion")] public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [ForeignKey("IdVenta")] public Venta? Venta { get; set; }
        [ForeignKey("IdCliente")] public Cliente? Cliente { get; set; }
    }
}
