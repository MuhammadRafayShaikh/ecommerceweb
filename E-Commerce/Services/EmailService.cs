using System.Net.Mail;
using System.Net;
using E_Commerce.Models;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;

namespace E_Commerce.Services
{
    public class EmailService
    {
        private readonly SettingsService _settingsService;
        private readonly IConfiguration _configuration;

        public EmailService(SettingsService settingsService, IConfiguration configuration)
        {
            _settingsService = settingsService;
            _configuration = configuration;
        }

        // Method 1: Send email with HTML template file
        public async Task<bool> SendEmailWithTemplateAsync(string email, string subject, string templateFileName, Dictionary<string, string> templateData)
        {
            try
            {
                Settings setting = await _settingsService.GetSettingsAsync();

                if (setting == null)
                    throw new Exception("Email settings are not configured.");

                // HTML FILE PATH
                string filePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "EmailTemplates",
                    templateFileName
                );

                if (!File.Exists(filePath))
                    throw new FileNotFoundException($"Template file not found: {templateFileName}");

                string htmlBody = await File.ReadAllTextAsync(filePath);

                // Replace template placeholders
                foreach (var data in templateData)
                {
                    htmlBody = htmlBody.Replace($"{{{{{data.Key}}}}}", data.Value);
                }

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
                    From = new MailAddress(setting.SmtpUsername, "Elegant Stitch"),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                return false;
            }
        }

        // Method 2: Send email with direct HTML content (for backward compatibility)
        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                Settings setting = await _settingsService.GetSettingsAsync();

                if (setting == null)
                    throw new Exception("Email settings are not configured.");

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
                    From = new MailAddress(setting.SmtpUsername, "Elegant Stitch"),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                return false;
            }
        }

        // Method 3: For password reset and other existing functionality
        public async Task<bool> SendEmailAsync(string email, string name, string subject, string link, string fileName)
        {
            var templateData = new Dictionary<string, string>
            {
                { "Name", name },
                { "Link", link }
            };

            return await SendEmailWithTemplateAsync(email, subject, fileName, templateData);
        }
    }
}