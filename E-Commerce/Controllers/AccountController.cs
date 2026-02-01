using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using E_Commerce.Models;
using System.Security.Claims;
using E_Commerce.Services;
using E_Commerce.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Encodings.Web;
using System.Text;
using E_Commerce.Models.ViewModels;
using static System.Runtime.InteropServices.JavaScript.JSType;
using E_Commerce.Migrations;
namespace E_Commerce.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly MyDbContext _context;

        private readonly IBackgroundEmailQueue _emailQueue;
        private readonly EmailService _emailService;
        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            EmailService emailService,
            IBackgroundEmailQueue emailQueue,
            MyDbContext context
            )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;

            _emailService = emailService;
            _emailQueue = emailQueue;

            _context = context;

        }

        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // Check if email already exists
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                TempData["error"] = "Email already registered";
                ModelState.AddModelError("", "Email already registered.");
                return View(model);
            }

            var user = new ApplicationUser
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                Email = model.Email,
                UserName = model.Email,
                PhoneNumber = model.PhoneNumber,
                Status = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync("User"))
                {
                    await _roleManager.CreateAsync(new IdentityRole("User"));
                }

                await _userManager.AddToRoleAsync(user, "User");

                await _signInManager.SignInAsync(user, isPersistent: false);

                _emailQueue.QueueEmail(async token =>
                {
                    try
                    {
                        bool emailSent = await _emailService.SendEmailAsync
                        (
                            user.Email,
                            user.FirstName,
                            "Successfully Registration",
                            "https://luxesuit.com/support",
                            "registration.html"
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


                return RedirectToAction("Index", "Home");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error.Description);
            }

            return View(model);
        }

        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            //await _emailService.SendEmailAsync("aptechrafay2@gmail.com", "xyz");
            //return Json(ModelState);
            //return Json(returnUrl);
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                TempData["error"] = "Invalid email or password";
                ModelState.AddModelError("", "Invalid email or password");
                return View(model);
            }

            var result = await _signInManager.PasswordSignInAsync(
                user,
                model.Password,
                isPersistent: model.RememberMe,
                lockoutOnFailure: false
            );
            if (result.Succeeded)
            {
                //var user = await _userManager.FindByEmailAsync(model.Email);

                var loginHistory = new LoginHistory
                {
                    UserId = user.Id,
                    LoginTime = DateTime.UtcNow,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    IsSuccessful = true
                };

                _context.LoginHistory.Add(loginHistory);
                await _context.SaveChangesAsync();
                if (await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    return RedirectToAction("Index", "Admin");
                }

                return RedirectToAction("Index", "Home");
            }
            else
            {
                if (user != null)
                {
                    _context.LoginHistory.Add(new LoginHistory
                    {
                        UserId = user.Id,
                        LoginTime = DateTime.UtcNow,
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        IsSuccessful = false
                    });

                    await _context.SaveChangesAsync();
                }
                TempData["error"] = "Invalid email or password";
                ModelState.AddModelError("", "Invalid email or password");
            }

            return View(model);
        }

        [HttpPost]
        public IActionResult GoogleLogin(string returnUrl = null)
        {
            var redirectUrl = Url.Action("GoogleResponse", "Account", new { ReturnUrl = returnUrl });
            var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
            return Challenge(properties, "Google");
        }

        public async Task<IActionResult> GoogleResponse(string returnUrl = null)
        {
            var info = await _signInManager.GetExternalLoginInfoAsync();

            if (info == null)
                return RedirectToAction("Login");

            // Already registered?
            var signInResult = await _signInManager.ExternalLoginSignInAsync(
                info.LoginProvider,
                info.ProviderKey,
                isPersistent: false);

            if (signInResult.Succeeded)
                return RedirectToLocal(returnUrl);

            // New user
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName);
            var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname);

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user);

            if (result.Succeeded)
            {
                await _userManager.AddLoginAsync(user, info);
                await _userManager.AddToRoleAsync(user, "User");

                await _signInManager.SignInAsync(user, isPersistent: false);
                return RedirectToLocal(returnUrl);
            }

            return RedirectToAction("Login");
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction("Index", "Home");
        }

        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded) return View("EmailConfirmed");

            return View("Error");
        }

        // GET: /Account/ForgotPassword
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        // POST: /Account/ForgotPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value.Errors.Count > 0)
                    .SelectMany(x => x.Value.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return Json(new
                {
                    success = false,
                    message = errors.FirstOrDefault()
                });
            }


            try
            {
                var user = await _userManager.FindByEmailAsync(model.Email);

                // Don't reveal that the user does not exist or is not confirmed
                if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
                {
                    // Still return success to prevent email enumeration
                    //TempData["SuccessMessage"] = "If your email is registered, you will receive a password reset link shortly.";
                    //return RedirectToAction("ForgotPasswordConfirmation");
                    return Json(new
                    {
                        success = false,
                        message = "If your email is registered, you will receive a password reset link shortly.",
                        url = "/Account/ForgotPasswordConfirmation"
                    });
                }

                // Generate password reset token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);

                // Encode the token for URL safety
                var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                // Create reset link
                var callbackUrl = Url.Action(
                    action: "ResetPassword",
                    controller: "Account",
                    values: new
                    {
                        email = model.Email,
                        token = encodedToken
                    },
                    protocol: Request.Scheme);

                // Send email
                await SendPasswordResetEmail(user.Email, callbackUrl);

                //TempData["SuccessMessage"] = "Password reset link has been sent to your email.";
                return Json(new { success = true, message = "Password reset link has been sent to your email." });
                //return RedirectToAction("ForgotPasswordConfirmation");
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in ForgotPassword");
                //TempData["ErrorMessage"] = "An error occurred while processing your request. Please try again.";
                //return View(model);
                return Json(new { success = false, message = $"Error occurred: {ex.Message}" });

            }
        }

        // GET: /Account/ForgotPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        // POST: /Account/ResendResetLink
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResendResetLink(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);

                if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
                {
                    // Don't reveal user existence
                    return Json(new { success = true });
                }

                // Generate new token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                var callbackUrl = Url.Action(
                    action: "ResetPassword",
                    controller: "Account",
                    values: new
                    {
                        email = user.Email,
                        token = encodedToken
                    },
                    protocol: Request.Scheme);

                await SendPasswordResetEmail(user.Email, callbackUrl);

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in ResendResetLink");
                return Json(new { success = false, message = "Failed to resend reset link" });
            }
        }

        // GET: /Account/ResetPassword
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(string email, string token)
        {
            if (email == null || token == null)
            {
                TempData["ErrorMessage"] = "Invalid password reset link.";
                return RedirectToAction("Login");
            }

            try
            {
                // Decode the token
                var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));

                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    TempData["ErrorMessage"] = "Invalid password reset link.";
                    return RedirectToAction("Login");
                }

                // Verify token is valid
                var isValid = await _userManager.VerifyUserTokenAsync(
                    user,
                    _userManager.Options.Tokens.PasswordResetTokenProvider,
                    "ResetPassword",
                    decodedToken);

                if (!isValid)
                {
                    TempData["ErrorMessage"] = "This password reset link has expired or is invalid.";
                    return RedirectToAction("Login");
                }

                var model = new ResetPasswordViewModel
                {
                    Email = email,
                    Token = decodedToken
                };

                return View("ForgotPassword", model);
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in ResetPassword GET");
                TempData["ErrorMessage"] = "Invalid password reset link.";
                return RedirectToAction("Login");
            }
        }

        // POST: /Account/ResetPassword
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                var error = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .FirstOrDefault()?.ErrorMessage;

                return Json(new { success = false, message = error });
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Json(new { success = true });
            }

            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(model.Token)
            );

            var result = await _userManager.ResetPasswordAsync(
                user,
                decodedToken,
                model.NewPassword
            );

            if (result.Succeeded)
            {
                return Json(new { success = true });
            }

            return Json(new
            {
                success = false,
                message = result.Errors.FirstOrDefault()?.Description
            });
        }


        // GET: /Account/ResetPasswordConfirmation
        [HttpGet]
        [AllowAnonymous]
        public IActionResult ResetPasswordConfirmation()
        {
            return View();
        }

        private async Task SendPasswordResetEmail(string email, string resetLink)
        {
            var subject = "Reset Your Password - Elegant Suits";

            var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #5d4037, #b76e79); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f5f2; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #b76e79; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                    .note {{ background: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class='content'>
                        <h2>Hello,</h2>
                        <p>We received a request to reset your password for your Elegant Suits account.</p>
                        <p>Click the button below to reset your password:</p>
                        
                        <p style='text-align: center;'>
                            <a href='{HtmlEncoder.Default.Encode(resetLink)}' class='button'>
                                Reset Password
                            </a>
                        </p>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #b76e79;'>{resetLink}</p>
                        
                        <div class='note'>
                            <strong>Important:</strong> This password reset link will expire in 24 hours and can only be used once.
                            If you didn't request this reset, you can safely ignore this email.
                        </div>
                        
                        <p>Best regards,<br>The Elegant Suits Team</p>
                    </div>
                </div>
            </body>
            </html>";
            _emailQueue.QueueEmail(async token =>
            {
                await _emailService.SendEmailAsync(email, subject, body);
            });

        }

        private async Task SendPasswordResetConfirmationEmail(string email)
        {
            var subject = "Password Reset Successful - Elegant Suits";

            var body = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f5f2; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .success-icon {{ font-size: 48px; color: #4CAF50; text-align: center; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Password Reset Successful</h1>
                    </div>
                    <div class='content'>
                        <div class='success-icon'>✓</div>
                        <h2>Password Updated Successfully!</h2>
                        <p>Your Elegant Suits account password has been successfully reset.</p>
                        
                        <p><strong>If you made this change:</strong> You can now login with your new password.</p>
                        <p><strong>If you didn't make this change:</strong> Please contact our support team immediately at support@elegantsuits.com.</p>
                        
                        <div style='background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;'>
                            <strong>Security Tip:</strong> For better security, avoid reusing passwords across different websites and consider enabling two-factor authentication.
                        </div>
                        
                        <p>Best regards,<br>The Elegant Suits Team</p>
                    </div>
                </div>
            </body>
            </html>";

            await _emailService.SendEmailAsync(email, subject, body);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }


    }
}