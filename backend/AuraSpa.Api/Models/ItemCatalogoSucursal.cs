using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("ItemCatalogoSucursal")]
    public class ItemCatalogoSucursal
    {
        [Key][Column("id_item_sucursal")] public long IdItemSucursal { get; set; }
        [Column("id_item")]        public long IdItem      { get; set; }
        [Column("id_sucursal")]    public long IdSucursal  { get; set; }
        [Column("precio_override", TypeName = "decimal(18,2)")] public decimal? PrecioOverride { get; set; }
        [Column("stock")]          public int?  Stock      { get; set; }
        [Column("stock_minimo")]   public int   StockMinimo { get; set; } = 5;
        [Column("disponible")]     public bool  Disponible { get; set; } = true;
        [ForeignKey("IdItem")]     public ItemCatalogo? Item     { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal?     Sucursal { get; set; }
    }
}
