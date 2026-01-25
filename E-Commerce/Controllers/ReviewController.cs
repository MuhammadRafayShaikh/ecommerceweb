// Controllers/ReviewController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using E_Commerce.Models;
//using E_Commerce.Data;
using System.ComponentModel.DataAnnotations;

namespace E_Commerce.Controllers
{
    public class ReviewController : Controller
    {
        private readonly MyDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReviewController(MyDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: Check if user can review a product
        public async Task<IActionResult> CanReviewProduct(int productId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(new { success = false, message = "User not authenticated" });

                // Check if user has already reviewed this product
                var existingReview = await _context.ProductReviews
                    .Where(r => r.ProductId == productId && r.UserId == userId)
                    .FirstOrDefaultAsync();
                if (existingReview != null)
                {
                    string message = $"You have already reviewed this product \n{(existingReview.Status == ProductReview.ReviewStatus.Pending ? "\n(Wait For Admin Approval)" : "")}";
                    return Json(new
                    {
                        success = false,
                        canReview = false,
                        message = message,
                        existingReview = new
                        {
                            rating = existingReview.Rating,
                            reviewText = existingReview.ReviewText,
                            fitFeedback = existingReview.FitFeedback,
                            createdAt = existingReview.CreatedAt.ToString("yyyy-MM-dd")
                        }
                    });
                }

                // Check if user has purchased the product with delivered status
                var hasPurchased = await _context.OrderItems
                    .Include(oi => oi.Order)
                    .Where(oi => oi.ProductId == productId &&
                           oi.Order.UserId == userId &&
                           oi.Order.Status == Order.OrderStatus.Delivered)
                    .AnyAsync();

                if (!hasPurchased)
                {
                    return Json(new
                    {
                        success = false,
                        canReview = false,
                        message = "You need to purchase and receive this product before reviewing"
                    });
                }

                return Json(new
                {
                    success = true,
                    canReview = true,
                    message = "You can review this product"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // GET: Get product reviews with pagination
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetProductReviews(int productId, int page = 1, int pageSize = 5)
        {
            try
            {
                var totalReviews = await _context.ProductReviews
                    .CountAsync(r => r.ProductId == productId && r.Status == ProductReview.ReviewStatus.Approved);

                var reviewsQuery = await _context.ProductReviews
                     .Include(r => r.User)
                     .Where(r => r.ProductId == productId && r.Status == ProductReview.ReviewStatus.Approved)
                     .OrderByDescending(r => r.CreatedAt)
                     .Skip((page - 1) * pageSize)
                     .Take(pageSize)
                     .ToListAsync();

                var reviews = reviewsQuery.Select(r => new
                {
                    id = r.Id,
                    userName = r.User.FirstName + " " + r.User.LastName,
                    userInitials = GetInitials(r.User.FirstName, r.User.LastName),
                    rating = r.Rating,
                    reviewText = r.ReviewText,
                    fitFeedback = r.FitFeedback,
                    createdAt = r.CreatedAt.ToString("MMMM dd, yyyy"),
                    timeAgo = GetTimeAgo(r.CreatedAt)
                }).ToList();


                // Get rating statistics
                var ratingStats = await _context.ProductReviews
                    .Where(r => r.ProductId == productId && r.Status == ProductReview.ReviewStatus.Approved)
                    .GroupBy(r => r.Rating)
                    .Select(g => new
                    {
                        rating = g.Key,
                        count = g.Count(),
                        percentage = (g.Count() * 100) / (double)totalReviews
                    })
                    .OrderByDescending(r => r.rating)
                    .ToListAsync();

                var averageRating = await _context.ProductReviews
                    .Where(r => r.ProductId == productId && r.Status == ProductReview.ReviewStatus.Approved)
                    .AverageAsync(r => (double?)r.Rating) ?? 0;

                return Json(new
                {
                    success = true,
                    reviews,
                    totalReviews,
                    averageRating = Math.Round(averageRating, 1),
                    ratingStats,
                    currentPage = page,
                    totalPages = (int)Math.Ceiling(totalReviews / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Submit a new review
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return Json(new { success = false, message = "Invalid data" });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Json(new { success = false, message = "User not authenticated" });

                // Check if user has already reviewed
                var existingReview = await _context.ProductReviews
                    .FirstOrDefaultAsync(r => r.ProductId == model.ProductId && r.UserId == userId);

                if (existingReview != null)
                    return Json(new { success = false, message = "You have already reviewed this product" });

                // Check if user has purchased and received the product
                var hasPurchased = await _context.OrderItems
                    .Include(oi => oi.Order)
                    .Where(oi => oi.ProductId == model.ProductId &&
                           oi.Order.UserId == userId &&
                           oi.Order.Status == Order.OrderStatus.Delivered)
                    .AnyAsync();

                if (!hasPurchased)
                    return Json(new { success = false, message = "You need to purchase and receive this product before reviewing" });

                var review = new ProductReview
                {
                    ProductId = model.ProductId,
                    UserId = userId,
                    Rating = model.Rating,
                    ReviewText = model.ReviewText,
                    FitFeedback = model.FitFeedback,
                    Status = ProductReview.ReviewStatus.Pending, // Admin approval required
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProductReviews.Add(review);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Review submitted successfully. It will be visible after admin approval.",
                    reviewId = review.Id
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // Helper methods
        private string GetInitials(string firstName, string lastName)
        {
            if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName))
                return "U";

            var firstInitial = !string.IsNullOrEmpty(firstName) ? firstName[0].ToString() : "";
            var lastInitial = !string.IsNullOrEmpty(lastName) ? lastName[0].ToString() : "";

            return (firstInitial + lastInitial).ToUpper();
        }

        private string GetTimeAgo(DateTime date)
        {
            var timeSpan = DateTime.UtcNow - date;

            if (timeSpan.TotalDays >= 365)
                return $"{(int)(timeSpan.TotalDays / 365)} year(s) ago";
            if (timeSpan.TotalDays >= 30)
                return $"{(int)(timeSpan.TotalDays / 30)} month(s) ago";
            if (timeSpan.TotalDays >= 7)
                return $"{(int)(timeSpan.TotalDays / 7)} week(s) ago";
            if (timeSpan.TotalDays >= 1)
                return $"{(int)timeSpan.TotalDays} day(s) ago";
            if (timeSpan.TotalHours >= 1)
                return $"{(int)timeSpan.TotalHours} hour(s) ago";
            if (timeSpan.TotalMinutes >= 1)
                return $"{(int)timeSpan.TotalMinutes} minute(s) ago";

            return "Just now";
        }
    }

    public class SubmitReviewModel
    {
        public int ProductId { get; set; }
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }
        [Required(ErrorMessage = "Review text is required")]
        [StringLength(1000, ErrorMessage = "Review cannot exceed 1000 characters")]
        public string ReviewText { get; set; }
        public string? FitFeedback { get; set; }
    }
}