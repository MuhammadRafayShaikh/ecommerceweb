using System.Net.Mail;
using System.Net;
using E_Commerce.Models;
using E_Commerce.Migrations;
using System.Security.Claims;

namespace E_Commerce.Services
{
    public class EmailService
    {
        private readonly SettingsService _settingsService;
        public EmailService(SettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        public async Task<bool> SendEmailAsync(string email, string name, string subject, string link, string fileName)
        {
            try
            {
                Settings setting = await _settingsService.GetSettingsAsync();

                if (setting == null)
                    throw new Exception("Email settings are not configured.");

                // 👉 HTML FILE PATH
                string filePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "EmailTemplates",
                    fileName
                );

                string htmlBody = await File.ReadAllTextAsync(filePath);

                htmlBody = htmlBody.Replace("{{Name}}", name);
                htmlBody = htmlBody.Replace("{{Link}}", link);

                using var smtpClient = new SmtpClient(setting.SmtpServer)
                {
                    Port = setting.SmtpPort,
                    Credentials = new NetworkCredential(
                        setting.SmtpUsername,
                        setting.SmtpPassword),
                    EnableSsl = true,
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(setting.SmtpUsername),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);

                return true;
            }
            catch (SmtpException ex)
            {
                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

    }
}
