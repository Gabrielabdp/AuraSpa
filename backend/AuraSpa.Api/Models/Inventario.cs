using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Proveedor")]
    public class Proveedor
    {
        [Key][Column("id_proveedor")] public long IdProveedor { get; set; }
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("rnc")] public string? Rnc { get; set; }
        [Column("contacto")] public string? Contacto { get; set; }
        [Column("telefono")] public string? Telefono { get; set; }
        [Column("email")] public string? Email { get; set; }
        [Column("direccion")] public string? Direccion { get; set; }
        [Column("activo")] public bool Activo { get; set; } = true;
        [Column("fecha_registro")] public DateTime FechaRegistro { get; set; } = DateTime.Now;
    }

    [Table("OrdenCompra")]
    public class OrdenCompra
    {
        [Key][Column("id_orden_compra")] public long IdOrdenCompra { get; set; }
        [Column("numero_orden")] public string NumeroOrden { get; set; } = string.Empty;
        [Column("id_proveedor")] public long IdProveedor { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("fecha_emision")] public DateTime FechaEmision { get; set; } = DateTime.Now;
        [Column("fecha_esperada")] public DateOnly? FechaEsperada { get; set; }
        [Column("fecha_recepcion")] public DateTime? FechaRecepcion { get; set; }
        [Column("subtotal", TypeName = "decimal(18,2)")] public decimal Subtotal { get; set; }
        [Column("itbis", TypeName = "decimal(18,2)")] public decimal Itbis { get; set; }
        [Column("total", TypeName = "decimal(18,2)")] public decimal Total { get; set; }
        [Column("estado")] public string Estado { get; set; } = "Pendiente";
        [Column("notas")] public string? Notas { get; set; }
        [ForeignKey("IdProveedor")] public Proveedor? Proveedor { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
        [ForeignKey("IdUsuario")] public Usuario? Usuario { get; set; }
        public List<OrdenCompraDetalle> Detalles { get; set; } = new();
    }

    [Table("OrdenCompraDetalle")]
    public class OrdenCompraDetalle
    {
        [Key][Column("id_oc_detalle")] public long IdOcDetalle { get; set; }
        [Column("id_orden_compra")] public long IdOrdenCompra { get; set; }
        [Column("id_item")] public long IdItem { get; set; }
        [Column("cantidad_pedida")] public int CantidadPedida { get; set; }
        [Column("cantidad_recibida")] public int CantidadRecibida { get; set; } = 0;
        [Column("precio_unitario", TypeName = "decimal(18,2)")] public decimal PrecioUnitario { get; set; }
        [Column("subtotal", TypeName = "decimal(18,2)")] public decimal Subtotal { get; set; }
        [ForeignKey("IdOrdenCompra")] public OrdenCompra? OrdenCompra { get; set; }
        [ForeignKey("IdItem")] public ItemCatalogo? Item { get; set; }
    }

    [Table("MovimientoInventario")]
    public class MovimientoInventario
    {
        [Key][Column("id_movimiento_inv")] public long IdMovimientoInv { get; set; }
        [Column("id_item")] public long IdItem { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("id_orden_compra")] public long? IdOrdenCompra { get; set; }
        [Column("id_venta")] public long? IdVenta { get; set; }
        [Column("id_usuario")] public long IdUsuario { get; set; }
        [Column("tipo")] public char Tipo { get; set; } // E S A
        [Column("cantidad")] public int Cantidad { get; set; }
        [Column("stock_antes")] public int StockAntes { get; set; }
        [Column("stock_despues")] public int StockDespues { get; set; }
        [Column("concepto")] public string Concepto { get; set; } = string.Empty;
        [Column("fecha_hora")] public DateTime FechaHora { get; set; } = DateTime.Now;
        [ForeignKey("IdItem")] public ItemCatalogo? Item { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
    }
}
