// Controllers/ContactController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using E_Commerce.Models.DbTables;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Collections.Generic;
using E_Commerce.Models;

namespace E_Commerce.Controllers.AdminControllers
{
    [Authorize(Roles = "Admin")]
    public class AdminContactController : Controller
    {
        private readonly MyDbContext _context;

        public AdminContactController(MyDbContext context)
        {
            _context = context;
        }

        // GET: Contact/Index
        public async Task<IActionResult> Index(string status = "all", string search = "", int page = 1, int pageSize = 15)
        {
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.Status = status;
            ViewBag.SearchTerm = search;

            var query = _context.Contacts.AsQueryable();

            // Apply status filter
            switch (status.ToLower())
            {
                case "unread":
                    query = query.Where(c => !c.IsRead);
                    break;
                case "read":
                    query = query.Where(c => c.IsRead && !c.IsResponded);
                    break;
                case "responded":
                    query = query.Where(c => c.IsResponded);
                    break;
                case "urgent":
                    // Mark as urgent if message contains urgent keywords or subject contains urgent
                    query = query.Where(c =>
                        c.Message.ToLower().Contains("urgent") ||
                        c.Message.ToLower().Contains("asap") ||
                        c.Message.ToLower().Contains("important") ||
                        c.Subject.ToLower().Contains("urgent") ||
                        c.Subject.ToLower().Contains("important"));
                    break;
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c =>
                    c.FullName.Contains(search) ||
                    c.Email.Contains(search) ||
                    c.Phone.Contains(search) ||
                    c.Subject.Contains(search) ||
                    c.Message.Contains(search));
            }

            // Get total count for pagination
            var totalContacts = await query.CountAsync();
            ViewBag.TotalContacts = totalContacts;
            ViewBag.TotalPages = (int)Math.Ceiling(totalContacts / (double)pageSize);

            // Apply pagination and ordering
            var contacts = await query
                .OrderByDescending(c => c.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Get statistics
            ViewBag.UnreadCount = await _context.Contacts.CountAsync(c => !c.IsRead);
            ViewBag.ReadCount = await _context.Contacts.CountAsync(c => c.IsRead && !c.IsResponded);
            ViewBag.RespondedCount = await _context.Contacts.CountAsync(c => c.IsResponded);
            ViewBag.TotalCount = await _context.Contacts.CountAsync();
            ViewBag.TodayCount = await _context.Contacts.CountAsync(c => c.SubmittedAt.Date == DateTime.UtcNow.Date);
            ViewBag.UrgentCount = await _context.Contacts.CountAsync(c =>
                c.Message.ToLower().Contains("urgent") ||
                c.Message.ToLower().Contains("asap") ||
                c.Message.ToLower().Contains("important") ||
                c.Subject.ToLower().Contains("urgent") ||
                c.Subject.ToLower().Contains("important"));

            return View("~/Views/AdminContact/Index.cshtml",contacts);
        }

        // GET: Contact/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);

            if (contact == null)
            {
                return NotFound();
            }

            // Mark as read when viewing details
            if (!contact.IsRead)
            {
                contact.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return PartialView("_ContactDetails", contact);
        }

        // POST: Contact/MarkAsRead/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var contact = await _context.Contacts.FindAsync(id);
                if (contact == null)
                {
                    return Json(new { success = false, message = "Contact message not found." });
                }

                contact.IsRead = true;
                contact.SubmittedAt = DateTime.UtcNow; // Update timestamp
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Marked as read successfully!",
                    read = true
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Contact/MarkAsResponded/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkAsResponded(int id)
        {
            try
            {
                var contact = await _context.Contacts.FindAsync(id);
                if (contact == null)
                {
                    return Json(new { success = false, message = "Contact message not found." });
                }

                contact.IsResponded = true;
                contact.IsRead = true;
                contact.SubmittedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Marked as responded successfully!",
                    responded = true
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Contact/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var contact = await _context.Contacts.FindAsync(id);
                if (contact == null)
                {
                    return Json(new { success = false, message = "Contact message not found." });
                }

                _context.Contacts.Remove(contact);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Contact message deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Contact/BulkAction
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> BulkAction(string action, List<int> contactIds)
        {
            if (contactIds == null || !contactIds.Any())
            {
                return Json(new { success = false, message = "No messages selected." });
            }

            try
            {
                var contacts = await _context.Contacts
                    .Where(c => contactIds.Contains(c.Id))
                    .ToListAsync();

                if (!contacts.Any())
                {
                    return Json(new { success = false, message = "No messages found." });
                }

                switch (action.ToLower())
                {
                    case "read":
                        foreach (var contact in contacts)
                        {
                            contact.IsRead = true;
                            contact.SubmittedAt = DateTime.UtcNow;
                        }
                        break;

                    case "responded":
                        foreach (var contact in contacts)
                        {
                            contact.IsResponded = true;
                            contact.IsRead = true;
                            contact.SubmittedAt = DateTime.UtcNow;
                        }
                        break;

                    case "delete":
                        _context.Contacts.RemoveRange(contacts);
                        break;

                    default:
                        return Json(new { success = false, message = "Invalid action." });
                }

                await _context.SaveChangesAsync();

                var actionMessage = action.ToLower() switch
                {
                    "read" => "marked as read",
                    "responded" => "marked as responded",
                    "delete" => "deleted",
                    _ => "processed"
                };

                return Json(new
                {
                    success = true,
                    message = $"{contacts.Count} messages {actionMessage} successfully!"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Contact/QuickReply
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> QuickReply(int id, string replyMessage)
        {
            try
            {
                var contact = await _context.Contacts.FindAsync(id);
                if (contact == null)
                {
                    return Json(new { success = false, message = "Contact message not found." });
                }

                if (string.IsNullOrEmpty(replyMessage))
                {
                    return Json(new { success = false, message = "Reply message is required." });
                }

                // Here you would implement actual email sending logic
                // For example using MailKit or System.Net.Mail

                // Simulate email sending
                bool emailSent = true; // Replace with actual email sending logic

                if (emailSent)
                {
                    contact.IsResponded = true;
                    contact.IsRead = true;
                    contact.SubmittedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return Json(new
                    {
                        success = true,
                        message = "Reply sent successfully!",
                        responded = true
                    });
                }
                else
                {
                    return Json(new { success = false, message = "Failed to send reply." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // GET: Contact/GetStats
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                unread = await _context.Contacts.CountAsync(c => !c.IsRead),
                read = await _context.Contacts.CountAsync(c => c.IsRead && !c.IsResponded),
                responded = await _context.Contacts.CountAsync(c => c.IsResponded),
                total = await _context.Contacts.CountAsync(),
                today = await _context.Contacts.CountAsync(c => c.SubmittedAt.Date == DateTime.UtcNow.Date),
                urgent = await _context.Contacts.CountAsync(c =>
                    c.Message.ToLower().Contains("urgent") ||
                    c.Message.ToLower().Contains("asap") ||
                    c.Message.ToLower().Contains("important") ||
                    c.Subject.ToLower().Contains("urgent") ||
                    c.Subject.ToLower().Contains("important"))
            };

            return Json(stats);
        }
    }
}