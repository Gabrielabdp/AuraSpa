using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("TipoNCF")]
    public class TipoNCF
    {
        [Key][Column("id_tipo_ncf")] public long IdTipoNCF { get; set; }
        [Column("codigo")] public string Codigo { get; set; } = string.Empty;
        [Column("nombre")] public string Nombre { get; set; } = string.Empty;
        [Column("descripcion")] public string? Descripcion { get; set; }
        [Column("requiere_rnc")] public bool RequiereRNC { get; set; } = false;
        [Column("activo")] public bool Activo { get; set; } = true;
    }

    [Table("SecuenciaNCF")]
    public class SecuenciaNCF
    {
        [Key][Column("id_secuencia")] public long IdSecuencia { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("id_tipo_ncf")] public long IdTipoNCF { get; set; }
        [Column("prefijo")] public string Prefijo { get; set; } = string.Empty;
        [Column("numero_actual")] public long NumeroActual { get; set; } = 0;
        [Column("numero_hasta")] public long NumeroHasta { get; set; }
        [Column("fecha_vencimiento")] public DateOnly FechaVencimiento { get; set; }
        [Column("activa")] public bool Activa { get; set; } = true;
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
        [ForeignKey("IdTipoNCF")] public TipoNCF? TipoNCF { get; set; }
    }

    [Table("ComprobanteFiscal")]
    public class ComprobanteFiscal
    {
        [Key][Column("id_comprobante")] public long IdComprobante { get; set; }
        [Column("id_venta")] public long IdVenta { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("id_tipo_ncf")] public long IdTipoNCF { get; set; }
        [Column("numero_comprobante")] public string NumeroComprobante { get; set; } = string.Empty;
        [Column("rnc_cedula_receptor")] public string? RncCedulaReceptor { get; set; }
        [Column("nombre_receptor")] public string? NombreReceptor { get; set; }
        [Column("subtotal", TypeName = "decimal(18,2)")] public decimal Subtotal { get; set; }
        [Column("itbis", TypeName = "decimal(18,2)")] public decimal Itbis { get; set; }
        [Column("total", TypeName = "decimal(18,2)")] public decimal Total { get; set; }
        [Column("fecha_emision")] public DateTime FechaEmision { get; set; } = DateTime.Now;
        [Column("estado")] public string Estado { get; set; } = "Emitido";
        [Column("codigo_seguridad")] public string? CodigoSeguridad { get; set; }
        [Column("fecha_certificacion")] public DateTime? FechaCertificacion { get; set; }
        [ForeignKey("IdVenta")] public Venta? Venta { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
        [ForeignKey("IdTipoNCF")] public TipoNCF? TipoNCF { get; set; }
    }
}
