namespace AuraSpa.Api.DTOs
{
    public class LoginDto
    {
        public string Email    { get; set; } = string.Empty; // acepta email o nombre_usuario
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string  Nombre          { get; set; } = string.Empty;
        public string  Apellido        { get; set; } = string.Empty;
        public string  Email           { get; set; } = string.Empty;
        public string  Password        { get; set; } = string.Empty;
        public string  NombrePerfil    { get; set; } = "Cliente";
        public string? NumeroDocumento { get; set; }
        public string? Telefono        { get; set; }
        public string? CodigoReferido  { get; set; }
    }

    public class CrearCitaDto
    {
        public long    IdItem              { get; set; }
        public long    IdSucursal          { get; set; }
        public long?   IdEmpleado          { get; set; }
        public long?   IdCabina            { get; set; }
        public long?   IdMetodoPago        { get; set; }
        public DateTime FechaHora          { get; set; }
        public string?  Notas              { get; set; }
        public string?  TipoFacial         { get; set; }
        public string?  TipoPiel           { get; set; }
        public string?  TipoMasaje         { get; set; }
        public int?     DuracionMasajeMin  { get; set; }
        public string?  ZonaDepilacion     { get; set; }
        public string?  MetodoDepilacion   { get; set; }
        public string?  SubservicioCejas   { get; set; }
        public bool?    TieneTrabajoAnterior { get; set; }
        public string?  TipoUnias          { get; set; }
        public bool?    IncluyeRemocion    { get; set; }
        public string?  TipoServicioPelo   { get; set; }
        public string?  LargoCabello       { get; set; }
    }

    public class VentaDto
    {
        public long?  IdCliente    { get; set; }
        public long?  IdSesionCaja { get; set; }
        public long?  IdMetodoPago { get; set; }
        public string CondicionPago { get; set; } = "Contado";
        public List<VentaDetalleDto> Detalles { get; set; } = new();
    }

    public class VentaDetalleDto
    {
        public long    IdItem          { get; set; }
        public long?   IdEmpleado      { get; set; }
        public int     Cantidad        { get; set; }
        public decimal PrecioUnitario  { get; set; }
        public decimal DescuentoLinea  { get; set; } = 0;
    }

    public class RecuperarContrasenaDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class RestablecerContrasenaDto
    {
        public string Token         { get; set; } = string.Empty;
        public string NuevaPassword { get; set; } = string.Empty;
    }

    public class CrearReservaDto
    {
        public long    IdSucursal { get; set; }
        public string? Notas      { get; set; }
        public List<ReservaItemDto> Productos { get; set; } = new();
    }

    public class ReservaItemDto
    {
        public long    IdItem         { get; set; }
        public int     Cantidad       { get; set; }
        public decimal PrecioUnitario { get; set; }
    }

    public class ReprogramarCitaDto
    {
        public DateTime FechaHora { get; set; }
    }
}

    public class ActualizarPerfilDto
    {
        public string Nombre   { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? Telefono { get; set; }
    }
