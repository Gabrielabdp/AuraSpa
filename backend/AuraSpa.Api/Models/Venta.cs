using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Venta")]
    public class Venta
    {
        [Key][Column("id_venta")] public long IdVenta { get; set; }
        [Column("numero_factura")] public string NumeroFactura { get; set; } = string.Empty;
        [Column("id_cliente")] public long? IdCliente { get; set; }
        [Column("id_usuario")] public long? IdUsuario { get; set; }
        [Column("id_sesion_caja")] public long? IdSesionCaja { get; set; }
        [Column("id_metodo_pago")] public long? IdMetodoPago { get; set; }
        [Column("id_cupon")] public long? IdCupon { get; set; }
        [Column("fecha")] public DateTime Fecha { get; set; } = DateTime.Now;
        [Column("subtotal", TypeName="decimal(18,2)")] public decimal Subtotal { get; set; }
        [Column("itbis", TypeName="decimal(18,2)")] public decimal Itbis { get; set; }
        [Column("descuento", TypeName="decimal(18,2)")] public decimal Descuento { get; set; }
        [Column("total", TypeName="decimal(18,2)")] public decimal Total { get; set; }
        [Column("condicion_pago")] public string CondicionPago { get; set; } = "Contado";
        [Column("tipo_venta")] public string TipoVenta { get; set; } = "POS";
        [Column("estado")] public string Estado { get; set; } = "Completada";
        public List<VentaDetalle> Detalles { get; set; } = new();
    }

    [Table("VentaDetalle")]
    public class VentaDetalle
    {
        [Key][Column("id_detalle")] public long IdDetalle { get; set; }
        [Column("id_venta")] public long IdVenta { get; set; }
        [Column("id_item")] public long IdItem { get; set; }
        [Column("id_empleado")] public long? IdEmpleado { get; set; }
        [Column("cantidad")] public int Cantidad { get; set; }
        [Column("precio_unitario", TypeName="decimal(18,2)")] public decimal PrecioUnitario { get; set; }
        [Column("descuento_linea", TypeName="decimal(18,2)")] public decimal DescuentoLinea { get; set; } = 0;
        [Column("subtotal", TypeName="decimal(18,2)")] public decimal Subtotal { get; set; }
        [ForeignKey("IdVenta")] public Venta? Venta { get; set; }
        [ForeignKey("IdItem")] public ItemCatalogo? Item { get; set; }
    }
}
