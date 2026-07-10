using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("ProductoApartado")]
    public class ProductoApartado
    {
        [Key][Column("id_apartado")] public long IdApartado { get; set; }
        [Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("id_item")] public long IdItem { get; set; }
        [Column("cantidad")] public int Cantidad { get; set; }
        [Column("precio_unitario", TypeName="decimal(18,2)")] public decimal PrecioUnitario { get; set; }
        [Column("subtotal", TypeName="decimal(18,2)")] public decimal Subtotal { get; set; }
        [Column("itbis", TypeName="decimal(18,2)")] public decimal Itbis { get; set; }
        [Column("total", TypeName="decimal(18,2)")] public decimal Total { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("estado")] public string Estado { get; set; } = "Pendiente";
        [Column("fecha_reserva")] public DateTime FechaReserva { get; set; } = DateTime.Now;
        [Column("notas")] public string? Notas { get; set; }
        // Navegacion
        [ForeignKey("IdUsuario")] public Usuario? Usuario { get; set; }
        [ForeignKey("IdItem")] public ItemCatalogo? Item { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
    }
}
