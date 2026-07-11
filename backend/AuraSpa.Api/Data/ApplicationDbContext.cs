using Microsoft.EntityFrameworkCore;
using AuraSpa.Api.Models;

namespace AuraSpa.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Catálogos
        public DbSet<TipoDocumento>    TiposDocumento     { get; set; }
        public DbSet<Pais>             Paises             { get; set; }
        public DbSet<Sucursal>         Sucursales         { get; set; }
        public DbSet<Perfil>           Perfiles           { get; set; }
        public DbSet<MetodoPago>       MetodosPago        { get; set; }
        public DbSet<CategoriaServicio> CategoriasServicio { get; set; }
        // Personas
        public DbSet<Cliente>          Clientes           { get; set; }
        public DbSet<Empleado>         Empleados          { get; set; }
        public DbSet<Usuario>          Usuarios           { get; set; }
        // Catálogo servicios
        public DbSet<ItemCatalogo>     ItemsCatalogo      { get; set; }
        public DbSet<Cabina>           Cabinas            { get; set; }
        // Citas
        public DbSet<Cita>             Citas              { get; set; }
        public DbSet<Resena>           Resenas            { get; set; }
        public DbSet<ProductoApartado> ProductosApartados { get; set; }
        // Ventas y caja
        public DbSet<SesionCaja>       SesionesCaja       { get; set; }
        public DbSet<Venta>            Ventas             { get; set; }
        public DbSet<VentaDetalle>     VentasDetalle      { get; set; }
        // Comprobantes fiscales
        public DbSet<TipoNCF>          TiposNCF           { get; set; }
        public DbSet<SecuenciaNCF>     SecuenciasNCF      { get; set; }
        public DbSet<ComprobanteFiscal> ComprobantesFiscales { get; set; }
        // Inventario
        public DbSet<Proveedor>        Proveedores        { get; set; }
        public DbSet<OrdenCompra>      OrdenesCompra      { get; set; }
        public DbSet<OrdenCompraDetalle> OrdenesCompraDetalle { get; set; }
        public DbSet<MovimientoInventario> MovimientosInventario { get; set; }
        // Notificaciones
        public DbSet<Notificacion>        Notificaciones        { get; set; }
        public DbSet<ItemCatalogoSucursal> ItemsCatalogoSucursal { get; set; }
        public DbSet<CuentaPorCobrar>      CuentasPorCobrar      { get; set; }
        public DbSet<DiaBloqueado>         DiasBloqueados        { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Venta>()
                .HasMany(v => v.Detalles)
                .WithOne(d => d.Venta)
                .HasForeignKey(d => d.IdVenta)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<OrdenCompra>()
                .HasMany(o => o.Detalles)
                .WithOne(d => d.OrdenCompra)
                .HasForeignKey(d => d.IdOrdenCompra)
                .OnDelete(DeleteBehavior.NoAction);

            // Columnas calculadas de SQL Server — solo lectura
            modelBuilder.Entity<Venta>()
                .Property(v => v.NumeroFactura).IsRequired();
        }
    }
}
