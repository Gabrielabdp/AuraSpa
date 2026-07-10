namespace AuraSpa.Api.Helpers
{
    public static class PuntosCalculator
    {
        public const decimal PesosPorPunto = 10m;
        public const int PuntosRegistro = 50;
        public const int PuntosReferido = 150;
        public const int PuntosResena   = 25;

        public static int PorMonto(decimal monto) => (int)(monto / PesosPorPunto);
    }
}
