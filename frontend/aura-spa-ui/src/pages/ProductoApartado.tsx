import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, MapPin, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

const ProductoApartado: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const producto = location.state?.producto || 'Producto seleccionado';
  const precio = location.state?.precio || 0;
  const referencia = `APRT-${Math.floor(Math.random() * 9000) + 1000}`;
  const fechaHoy = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });

  const descargarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // ── HEADER NAVY ──────────────────────────────────
    doc.setFillColor(31, 45, 61);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo AURA Spa
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('AURA', margin, 22);
    const auraWidth = doc.getTextWidth('AURA');
    doc.setTextColor(151, 138, 221);
    doc.text(' Spa', margin + auraWidth, 22);

    // Subtítulo header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Comprobante de Reserva', margin, 32);
    doc.text('AuraSpa Piantini — Sucursal Principal', margin, 39);

    // Referencia derecha
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 200);
    doc.text('No. Referencia', pageWidth - margin, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(151, 138, 221);
    doc.text(referencia, pageWidth - margin, 30, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(`Emitido: ${fechaHoy}`, pageWidth - margin, 38, { align: 'right' });

    // Línea decorativa
    doc.setDrawColor(151, 138, 221);
    doc.setLineWidth(0.8);
    doc.line(margin, 50, pageWidth - margin, 50);

    let y = 62;

    // ── SECCIÓN: INFORMACIÓN DEL CLIENTE ────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Información del Cliente', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);

    y += 12;
    const nombreCompleto = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim() || 'Cliente AuraSpa';

    const clienteData: [string, string][] = [
      ['Nombre:', nombreCompleto],
      ['Correo:', user?.email ?? '—'],
      ['Telefono:', user?.telefono ?? '—'],
    ];

    clienteData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 35, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // ── SECCIÓN: DETALLES DEL PRODUCTO ──────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Detalles del Producto', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);

    y += 12;

    const productoData: [string, string][] = [
      ['Producto:', producto],
      ['Precio:', `RD$ ${precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`],
      ['Sucursal de retiro:', 'AuraSpa Piantini — Sucursal Principal'],
      ['Fecha de reserva:', fechaHoy],
    ];

    productoData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 45, 61);
      doc.text(value, margin + 40, y);
      y += 9;
    });

    y += 8;
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // ── ESTADO ───────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 45, 61);
    doc.text('Estado de la Reserva', margin, y);
    doc.setDrawColor(220, 215, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Estado:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 45, 61);
    doc.text('Apartado — Pendiente de pago en caja', margin + 35, y);

    y += 18;

    // ── LÍNEA FINAL ──────────────────────────────────
    doc.setDrawColor(151, 138, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(`${referencia} — Comprobante generado el ${fechaHoy}`, pageWidth / 2, y, { align: 'center' });
    doc.text('Presenta este comprobante en caja para retirar tu producto.', pageWidth / 2, y + 7, { align: 'center' });

    // ── FOOTER ───────────────────────────────────────
    doc.setFillColor(31, 45, 61);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text('www.auraspa.com  |  contacto@auraspa.com  |  809-000-0000', pageWidth / 2, pageHeight - 4, { align: 'center' });

    doc.save(`comprobante-producto-${referencia}.pdf`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--aura-beige)', padding: '40px 20px' }}>
      <div className="card-aura animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '50px', borderRadius: '30px', textAlign: 'center' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #86efac' }}>
            <CheckCircle size={44} color="#22c55e" />
          </div>
        </div>

        <h2 style={{ color: 'var(--aura-navy)', fontWeight: 'bold', marginBottom: '8px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          ¡Reserva confirmada!
        </h2>
        <p style={{ color: 'var(--aura-gray)', fontSize: '0.95rem', marginBottom: '35px' }}>
          Tu producto ha sido reservado. Pasa por la sucursal para completar tu compra.
        </p>

        <div style={{ background: '#f8f6ff', borderRadius: '20px', padding: '25px', marginBottom: '25px', textAlign: 'left' }}>
          <p style={{ color: 'var(--aura-lavender)', fontWeight: '600', marginBottom: '16px', fontSize: '0.9rem' }}>
            🛍️ Resumen de tu reserva
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShoppingBag size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Producto</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>{producto}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={16} color="var(--aura-lavender)" />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--aura-gray)' }}>Retiro en</span>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--aura-navy)', margin: 0 }}>AuraSpa Piantini — Sucursal Principal</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#f0ecff', border: '1px solid var(--aura-lavender)', borderRadius: '20px', padding: '18px 25px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px', textAlign: 'left' }}>
  <span style={{ fontSize: '1.4rem' }}>🛍️</span>
  <div>
    <p style={{ fontWeight: '700', color: 'var(--aura-navy)', margin: '0 0 4px', fontSize: '0.9rem', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Tu reserva está lista</p>
    <p style={{ color: 'var(--aura-gray)', margin: 0, fontSize: '0.83rem', lineHeight: '1.5' }}>
      Pasa por la sucursal y presenta tu comprobante en caja. El total a pagar es <strong>RD$ {precio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>.
    </p>
  </div>
</div>

        <button onClick={descargarPDF} style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '50px', border: '2px solid #6B5B93', background: '#f0ecff', color: '#6B5B93', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <Download size={18} /> Descargar comprobante
        </button>

        <button className="btn-AuraSpa" onClick={() => navigate('/catalog')} style={{ width: '100%', padding: '15px', fontSize: '1rem', marginBottom: '12px' }}>
          Seguir comprando
        </button>

        <button onClick={() => navigate('/')} style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: '50px', border: '2px solid var(--aura-lavender)', background: 'transparent', color: 'var(--aura-lavender)', fontWeight: '700', cursor: 'pointer' }}>
          Ir al inicio
        </button>

      </div>
    </div>
  );
};

export default ProductoApartado;
