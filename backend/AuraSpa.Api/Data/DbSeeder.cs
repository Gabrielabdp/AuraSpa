using AuraSpa.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AuraSpa.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext ctx)
        {
            // La base de datos ya fue creada con SSMS y el seed data SQL.
            // Este seeder solo verifica la conexión y no inserta nada.
            try
            {
                var puedeConectar = await ctx.Database.CanConnectAsync();
                if (puedeConectar)
                    Console.WriteLine("[AuraSpa] ✓ Conexión a AuraSpaDB establecida.");
                else
                    Console.WriteLine("[AuraSpa] ✗ No se pudo conectar a AuraSpaDB. Verifica SSMS.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuraSpa] Error de BD: {ex.Message}");
            }
        }
    }
}
