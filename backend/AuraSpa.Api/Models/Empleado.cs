using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace AuraSpa.Api.Models
{
    [Table("Empleado")]
    public class Empleado
    {
        [Key][Column("id_empleado")] public long IdEmpleado { get; set; }
        [Column("id_tipo_doc")] public long IdTipoDoc { get; set; }
        [Column("numero_documento")] public string NumeroDocumento { get; set; } = string.Empty;
        [Column("id_pais_doc")] public long? IdPaisDoc { get; set; }
        [Column("nombres")] public string Nombres { get; set; } = string.Empty;
        [Column("apellidos")] public string Apellidos { get; set; } = string.Empty;
        [Column("email_personal")] public string? EmailPersonal { get; set; }
        [Column("email_empresarial")] public string? EmailEmpresarial { get; set; }
        [Column("telefono")] public string? Telefono { get; set; }
        [Column("tipo_empleado")] public string TipoEmpleado { get; set; } = "Especialista";
        [Column("activo")] public bool Activo { get; set; } = true;
        [Column("fecha_ingreso")] public DateOnly FechaIngreso { get; set; } = DateOnly.FromDateTime(DateTime.Now);
        [Column("id_sucursal")] public long IdSucursal { get; set; }
        [ForeignKey("IdSucursal")] public Sucursal? Sucursal { get; set; }
    }
}
