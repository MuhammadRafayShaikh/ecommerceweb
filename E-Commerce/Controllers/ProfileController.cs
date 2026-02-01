// Controllers/ProfileController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using E_Commerce.Models;
using E_Commerce.ViewModels;
using E_Commerce.Interfaces;
using E_Commerce.Services;
using Microsoft.EntityFrameworkCore;
using System.Text;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;


namespace E_Commerce.Controllers
{
    [Authorize]
    public class ProfileController : Controller
    {
        private string userId { get => User.FindFirstValue(ClaimTypes.NameIdentifier); }
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ProfileController> _logger;
        private readonly IBackgroundEmailQueue _emailQueue;
        private readonly EmailService _emailService;
        private readonly MyDbContext _context;

        public ProfileController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IWebHostEnvironment environment,
            ILogger<ProfileController> logger,
            EmailService emailService,
            IBackgroundEmailQueue emailQueue,
            MyDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _environment = environment;
            _logger = logger;
            _emailService = emailService;
            _emailQueue = emailQueue;
            _context = context;
        }

        // GET: Profile/Index
        public async Task<IActionResult> Index()
        {
            try
            {
                ViewData["totalOrders"] = await _context.Orders.CountAsync(x => x.UserId == userId);
                ViewData["totalCarts"] = await _context.Carts.CountAsync(x => x.UserId == userId);
                ViewData["totalReviews"] = await _context.ProductReviews.CountAsync(x => x.UserId == userId);
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return RedirectToAction("Login", "Account");
                }

                var model = new ProfileViewModel
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    UserName = user.UserName,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    Status = user.Status ? "Active" : "Inactive",
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed
                };

                // Get success message from TempData if exists
                if (TempData["SuccessMessage"] != null)
                {
                    ViewBag.SuccessMessage = TempData["SuccessMessage"];
                }

                if (TempData["ErrorMessage"] != null)
                {
                    ViewBag.ErrorMessage = TempData["ErrorMessage"];
                }

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading profile page");
                TempData["ErrorMessage"] = "An error occurred while loading your profile.";
                return RedirectToAction("Index", "Home");
            }
        }

        // GET: Profile/Edit
        public async Task<IActionResult> Edit()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return RedirectToAction("Login", "Account");
                }

                var model = new ProfileViewModel
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    UserName = user.UserName,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    Status = user.Status ? "Active" : "Inactive",
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed
                };

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading edit profile page");
                TempData["ErrorMessage"] = "An error occurred while loading the edit page.";
                return RedirectToAction("Index");
            }
        }

        // POST: Profile/Edit
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(ProfileViewModel model)
        {
            try
            {
                ModelState.Remove("Status");
                //return Json(ModelState);
               

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return RedirectToAction("Login", "Account");
                }

                // Check if email is being changed
                if (user.Email != model.Email)
                {
                    var emailExists = await _userManager.FindByEmailAsync(model.Email);
                    if (emailExists != null && emailExists.Id != user.Id)
                    {
                        ModelState.AddModelError("Email", "This email is already registered.");
                        return View(model);
                    }

                    user.Email = model.Email;
                    user.EmailConfirmed = false; // Require email verification
                }

                // Update other properties
                user.FirstName = model.FirstName;
                user.LastName = model.LastName;
                user.PhoneNumber = model.PhoneNumber;
                user.UserName = model.Email; // Set username same as email
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    // If email was changed, send verification email
                    if (!string.IsNullOrEmpty(user.Email) && user.Email != model.Email)
                    {
                        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                        var callbackUrl = Url.Action("ConfirmEmail", "Account",
                            new { userId = user.Id, token = token },
                            protocol: HttpContext.Request.Scheme);

                        // TODO: Send email verification email
                        // You can implement email sending here or use a service
                    }

                    TempData["SuccessMessage"] = "Profile updated successfully!";
                    return RedirectToAction("Index");
                }

                // If update failed, add errors
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile");
                ModelState.AddModelError(string.Empty, "An error occurred while updating your profile.");
                return View(model);
            }
        }

        // POST: Profile/ChangePassword
        [HttpPost]
        public async Task<IActionResult> ChangePassword(ProfileViewModel model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.CurrentPassword) ||
                    string.IsNullOrWhiteSpace(model.NewPassword))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Current password and new password are required."
                    });
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "User session expired. Please login again."
                    });
                }

                var result = await _userManager.ChangePasswordAsync(
                    user,
                    model.CurrentPassword,
                    model.NewPassword
                );

                if (result.Succeeded)
                {
                    await _signInManager.RefreshSignInAsync(user);

                    return Json(new
                    {
                        success = true,
                        message = "Password changed successfully."
                    });
                }

                // Identity errors
                return Json(new
                {
                    success = false,
                    message = result.Errors.FirstOrDefault()?.Description ?? "Password change failed."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");

                return Json(new
                {
                    success = false,
                    message = "An error occurred while changing your password."
                });
            }
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetLoginHistory(int days = 30, string status = "all", int page = 1, int pageSize = 10)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                IQueryable<LoginHistory> query = _context.LoginHistory
    .Where(lh => lh.UserId == userId);

                // Apply date filter
                if (days > 0 && days != 365) // "all" is represented by 0
                {
                    var dateFilter = DateTime.UtcNow.AddDays(-days);
                    query = query.Where(lh => lh.LoginTime >= dateFilter);
                }

                // Apply status filter
                if (status != "all")
                {
                    bool isSuccessful = status == "successful";
                    query = query.Where(lh => lh.IsSuccessful == isSuccessful);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                // Apply pagination
                var loginHistoryRaw = await query
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(lh => new
    {
        lh.Id,
        lh.LoginTime,
        lh.IpAddress,
        lh.UserAgent,
        lh.IsSuccessful
    })
    .ToListAsync();


                var loginHistory = loginHistoryRaw
    .Select(lh => new
    {
        lh.Id,
        LoginTime = lh.LoginTime.ToString("yyyy-MM-dd HH:mm:ss"),
        FriendlyTime = GetFriendlyTime(lh.LoginTime),
        lh.IpAddress,
        lh.UserAgent,
        DeviceInfo = GetDeviceInfo(lh.UserAgent),
        BrowserInfo = GetBrowserInfo(lh.UserAgent),
        lh.IsSuccessful,
        StatusText = lh.IsSuccessful ? "Successful" : "Failed",
        StatusClass = lh.IsSuccessful ? "status-success" : "status-failed"
    })
    .ToList();


                // Get statistics
                var stats = new
                {
                    TotalLogins = totalCount,
                    SuccessfulLogins = await query.CountAsync(lh => lh.IsSuccessful),
                    FailedLogins = await query.CountAsync(lh => !lh.IsSuccessful),
                    LastLogin = await query
                        .Where(lh => lh.IsSuccessful)
                        .OrderByDescending(lh => lh.LoginTime)
                        .Select(lh => lh.LoginTime.ToString("yyyy-MM-dd HH:mm:ss"))
                        .FirstOrDefaultAsync()
                };

                return Json(new
                {
                    Success = true,
                    Data = loginHistory,
                    Statistics = stats,
                    Pagination = new
                    {
                        CurrentPage = page,
                        TotalPages = totalPages,
                        TotalItems = totalCount,
                        PageSize = pageSize
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching login history");
                return Json(new { Success = false, Message = "Error loading login history" });
            }
        }

        private string GetFriendlyTime(DateTime loginTime)
        {
            var timeSpan = DateTime.UtcNow - loginTime;

            if (timeSpan.TotalMinutes < 1)
                return "Just now";
            if (timeSpan.TotalHours < 1)
                return $"{(int)timeSpan.TotalMinutes} minutes ago";
            if (timeSpan.TotalDays < 1)
                return $"{(int)timeSpan.TotalHours} hours ago";
            if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays} days ago";

            return loginTime.ToString("MMM dd, yyyy HH:mm");
        }

        private string GetDeviceInfo(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return "Unknown Device";

            if (userAgent.Contains("Mobile"))
                return "Mobile";
            if (userAgent.Contains("Tablet"))
                return "Tablet";
            if (userAgent.Contains("Windows"))
                return "Windows PC";
            if (userAgent.Contains("Mac"))
                return "Mac";
            if (userAgent.Contains("Linux"))
                return "Linux PC";

            return "Desktop";
        }

        private string GetBrowserInfo(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return "Unknown Browser";

            if (userAgent.Contains("Chrome"))
                return "Chrome";
            if (userAgent.Contains("Firefox"))
                return "Firefox";
            if (userAgent.Contains("Safari") && !userAgent.Contains("Chrome"))
                return "Safari";
            if (userAgent.Contains("Edge"))
                return "Edge";
            if (userAgent.Contains("Opera"))
                return "Opera";

            return "Browser";
        }

        [HttpGet]
        public async Task<IActionResult> ExportLoginHistory(
    string format,
    string period,
    string status)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var query = _context.LoginHistory
                .Where(x => x.UserId == user.Id);

            // 🔍 Filter: status
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                bool isSuccess = status == "success";
                query = query.Where(x => x.IsSuccessful == isSuccess);
            }

            // 🔍 Filter: period
            if (period == "7")
                query = query.Where(x => x.LoginTime >= DateTime.UtcNow.AddDays(-7));
            else if (period == "30")
                query = query.Where(x => x.LoginTime >= DateTime.UtcNow.AddDays(-30));

            var data = await query
                .OrderByDescending(x => x.LoginTime)
                .ToListAsync();

            return format switch
            {
                "csv" => ExportCsv(data),
                //"pdf" => ExportPdf(data),
                _ => BadRequest("Invalid format")
            };
        }

        private IActionResult ExportCsv(List<LoginHistory> data)
        {
            var sb = new StringBuilder();

            sb.AppendLine("Login Time,IP Address,Device,Status");

            foreach (var item in data)
            {
                sb.AppendLine(
                    $"{item.LoginTime}," +
                    $"{item.IpAddress}," +
                    $"\"{item.UserAgent}\"," +
                    $"{(item.IsSuccessful ? "Success" : "Failed")}"
                );
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());

            return File(
                bytes,
                "text/csv",
                "login-history.csv"
            );
        }

        // GET: Profile/ResendEmailVerification
        public async Task<IActionResult> ResendEmailVerification()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return RedirectToAction("Login", "Account");
                }

                if (user.EmailConfirmed)
                {
                    TempData["ErrorMessage"] = "Your email is already verified.";
                    return RedirectToAction("Index");
                }

                // Generate email confirmation token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var callbackUrl = Url.Action("ConfirmEmail", "Account",
                    new { userId = user.Id, token = token },
                    protocol: HttpContext.Request.Scheme);

                _emailQueue.QueueEmail(async token =>
                {
                    try
                    {
                        bool emailSent = await _emailService.SendEmailAsync
                        (
                            user.Email,
                            user.FirstName,
                            "Email Verification",
                            callbackUrl,
                            "verification.html"
                        );
                        if (emailSent)
                        {
                            //TempData["success"] = $"Email sent successfully to {user.Email}";
                        }
                        else
                        {
                            //TempData["error"] = $"Email to {user.Email} failed to send.";
                        }
                    }
                    catch (Exception ex)
                    {
                        //TempData["error"] = $"Unexpected error while sending email to {user.Email}: {ex.Message}";
                    }
                });

                TempData["SuccessMessage"] = "Verification email sent. Please check your inbox.";
                return RedirectToAction("Index");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending email verification");
                TempData["ErrorMessage"] = "An error occurred while resending the verification email.";
                return RedirectToAction("Index");
            }
        }

        // GET: Profile/DeleteAccount
        public IActionResult DeleteAccount()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> DeleteAccount(string confirmText)
        {
            try
            {
                if (confirmText != "DELETE")
                {
                    return Json(new
                    {
                        success = false,
                        message = "Please type DELETE to confirm account deletion."
                    });
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Json(new
                    {
                        success = false,
                        message = "User not found or already logged out."
                    });
                }

                // Soft delete
                user.Status = false;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    await _signInManager.SignOutAsync();

                    return Json(new
                    {
                        success = true,
                        message = "Your account has been deactivated successfully."
                    });
                }

                return Json(new
                {
                    success = false,
                    message = "Failed to deactivate account."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting account");

                return Json(new
                {
                    success = false,
                    message = "An error occurred while deleting your account."
                });
            }
        }


        // AJAX: Get user stats (for dashboard)
        [HttpGet]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Json(new { success = false, message = "User not found" });
                }

                // You can add more stats here based on your application
                var stats = new
                {
                    accountAge = (DateTime.UtcNow - user.CreatedAt).Days,
                    lastLogin = user.UpdatedAt?.ToString("MMM dd, yyyy") ?? "Never",
                    emailVerified = user.EmailConfirmed,
                    phoneVerified = user.PhoneNumberConfirmed
                };

                return Json(new { success = true, stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user stats");
                return Json(new { success = false, message = "Error loading statistics" });
            }
        }
    }
}