namespace AuraSpa.Api.DTOs
{
    public class SucursalDto
    {
        public string  Nombre    { get; set; } = string.Empty;
        public string  Direccion { get; set; } = string.Empty;
        public string? Telefono  { get; set; }
    }

    public class EmpleadoDto
    {
        public string  Nombres         { get; set; } = string.Empty;
        public string  Apellidos       { get; set; } = string.Empty;
        public string  NumeroDocumento { get; set; } = string.Empty;
        public string  TipoEmpleado    { get; set; } = "Especialista";
        public string? Telefono        { get; set; }
        public long    IdSucursal      { get; set; }
    }
}
