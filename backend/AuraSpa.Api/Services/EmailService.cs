using System.Text.RegularExpressions;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace AuraSpa.Api.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        public EmailService(IConfiguration configuration) => _configuration = configuration;

        public async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
        {
            var apiKey    = _configuration["SendGrid:ApiKey"];
            var fromEmail = _configuration["SendGrid:FromEmail"];
            var fromName  = _configuration["SendGrid:FromName"];

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, fromName);
            var to   = new EmailAddress(toEmail, toName);
            var msg  = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent: HtmlATexto(htmlContent), htmlContent: htmlContent);

            await client.SendEmailAsync(msg);
        }

        // Derivar una versión en texto plano a partir del HTML — un correo HTML sin
        // parte de texto plano es en sí una señal de spam para varios filtros.
        private static string HtmlATexto(string html)
        {
            var texto = Regex.Replace(html, "<br\\s*/?>|</p>|</div>", "\n", RegexOptions.IgnoreCase);
            texto = Regex.Replace(texto, "<[^>]+>", string.Empty);
            texto = System.Net.WebUtility.HtmlDecode(texto);
            texto = Regex.Replace(texto, "[ \\t]+", " ");
            texto = Regex.Replace(texto, "\n{3,}", "\n\n");
            return texto.Trim();
        }
    }
}
