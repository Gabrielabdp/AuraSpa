using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Cita")]
    public class Cita
    {
        [Key][Column("id_cita")] public long IdCita { get; set; }
        [Column("id_cliente")] public long IdCliente { get; set; }
        [Column("id_empleado")] public long? IdEmpleado { get; set; }
        [Column("id_item")] public long IdItem { get; set; }
        [Column("id_cabina")] public long? IdCabina { get; set; }
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [Column("id_metodo_pago")] public long? IdMetodoPago { get; set; }
        [Column("fecha_hora")] public DateTime FechaHora { get; set; }
        [Column("duracion_minutos")] public int? DuracionMinutos { get; set; }
        [Column("precio_acordado", TypeName="decimal(18,2)")] public decimal? PrecioAcordado { get; set; }
        [Column("estado")] public string Estado { get; set; } = "Pendiente";
        [Column("notas")] public string? Notas { get; set; }
        [Column("fecha_creacion")] public DateTime FechaCreacion { get; set; } = DateTime.Now;
        // Campos por tipo de servicio
        [Column("tipo_facial")] public string? TipoFacial { get; set; }
        [Column("tipo_piel")] public string? TipoPiel { get; set; }
        [Column("tipo_masaje")] public string? TipoMasaje { get; set; }
        [Column("duracion_masaje_min")] public int? DuracionMasajeMin { get; set; }
        [Column("zona_depilacion")] public string? ZonaDepilacion { get; set; }
        [Column("metodo_depilacion")] public string? MetodoDepilacion { get; set; }
        [Column("subservicio_cejas")] public string? SubservicioCejas { get; set; }
        [Column("tiene_trabajo_anterior")] public bool? TieneTrabajoAnterior { get; set; }
        [Column("tipo_unias")] public string? TipoUnias { get; set; }
        [Column("incluye_remocion")] public bool? IncluyeRemocion { get; set; }
        [Column("tipo_servicio_pelo")] public string? TipoServicioPelo { get; set; }
        [Column("largo_cabello")] public string? LargoCabello { get; set; }
        // Navegacion
        [ForeignKey("IdCliente")] public Cliente? Cliente { get; set; }
        [ForeignKey("IdEmpleado")] public Empleado? Empleado { get; set; }
        [ForeignKey("IdItem")] public ItemCatalogo? Item { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
    }
}
