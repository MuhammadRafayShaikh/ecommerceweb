using E_Commerce.Interfaces;
using E_Commerce.Migrations;
using E_Commerce.Models;
using E_Commerce.Models.DbTables;
using E_Commerce.Models.ViewModels;
using E_Commerce.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace E_Commerce.Controllers
{
    public class ContactController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ContactController> _logger;
        private readonly MyDbContext _context;
        private readonly IBackgroundEmailQueue _emailQueue;
        private readonly EmailService _emailService;
        private readonly SettingsService _settingsService;

        public ContactController(
            IConfiguration configuration,
            ILogger<ContactController> logger,
            MyDbContext context,
            IBackgroundEmailQueue emailQueue,
            EmailService emailService,
            SettingsService settingsService)
        {
            _configuration = configuration;
            _logger = logger;
            _context = context;
            _emailQueue = emailQueue;
            _emailService = emailService;
            _settingsService = settingsService;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Contact(ContactViewModel model)
        {
            if (!ModelState.IsValid)
            {
                //return View("Index", model);
                return Json(new { success = false });
            }

            try
            {

                // Save to database
                var contact = new Contact
                {
                    FullName = model.FullName,
                    Email = model.Email,
                    Phone = model.Phone,
                    Subject = model.Subject,
                    Message = model.Message,
                    SubmittedAt = DateTime.UtcNow
                };

                await _context.Contacts.AddAsync(contact);
                await _context.SaveChangesAsync();

                // Send email notifications
                await SendEmailNotifications(model, contact.Id);

                // Send response to user
                TempData["SuccessMessage"] = "Thank you for contacting us! We'll get back to you within 24 hours.";

                //return RedirectToAction("Index");
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing contact form");
                TempData["ErrorMessage"] = "An error occurred while processing your request. Please try again later.";
                //return View("Index", model);
                return Json(new { success = false   });
            }
        }

        private async Task SendEmailNotifications(ContactViewModel model, int contactId)
        {
            try
            {
                Settings setting = await _settingsService.GetSettingsAsync();
                // Email to admin
                var adminTemplateData = new Dictionary<string, string>
        {
            { "ContactId", contactId.ToString() },
            { "FullName", model.FullName },
            { "Email", model.Email },
            { "Phone", model.Phone ?? "Not provided" },
            { "Subject", model.Subject },
            { "Message", model.Message },
            { "SubmittedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") },
            { "DashboardLink", "https://yourdashboard.com/contacts/" + contactId }
        };

                _emailQueue.QueueEmail(async token =>
                {
                    await _emailService.SendEmailWithTemplateAsync(
                    setting.SenderEmail,
                    $"New Contact Form: {model.Subject}",
                    "ContactAdmin.html",
                    adminTemplateData
                );
                });



                // Auto-reply to user
                var userTemplateData = new Dictionary<string, string>
        {
            { "FullName", model.FullName },
            { "Subject", model.Subject },
            { "ContactId", contactId.ToString("D6") },
            { "SubmittedAt", DateTime.UtcNow.ToString("MMMM dd, yyyy hh:mm tt") }
        };

                _emailQueue.QueueEmail(async token =>
                {
                    await _emailService.SendEmailWithTemplateAsync(
                    model.Email,
                    "Thank You for Contacting Elegant Stitch",
                    "ContactUserAutoReply.html",
                    userTemplateData
                );
                });


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email notifications");
                // Don't throw - we don't want email failures to prevent form submission
            }
        }


        [HttpGet]
        public async Task<IActionResult> GetContactStats()
        {
            try
            {
                var stats = new
                {
                    TotalMessages = await _context.Contacts.CountAsync(),
                    UnreadMessages = await _context.Contacts.CountAsync(c => !c.IsRead),
                    TodayMessages = await _context.Contacts
                        .CountAsync(c => c.SubmittedAt.Date == DateTime.UtcNow.Date),
                    AverageResponseTime = 24 // Hours
                };

                return Json(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting contact stats");
                return StatusCode(500, new { error = "Error retrieving statistics" });
            }
        }
    }
}