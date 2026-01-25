// Controllers/ReviewsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using E_Commerce.Models;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace E_Commerce.Controllers.AdminControllers
{
    [Authorize(Roles = "Admin")]
    public class ReviewsController : Controller
    {
        private readonly MyDbContext _context;

        public ReviewsController(MyDbContext context)
        {
            _context = context;
        }

        // GET: Reviews/Index
        public async Task<IActionResult> Index(string status = "all", string search = "", int page = 1, int pageSize = 10)
        {
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.Status = status;
            ViewBag.SearchTerm = search;

            var query = _context.ProductReviews
                .Include(r => r.Product)
                    .ThenInclude(x => x.ProductColors)
                        .ThenInclude(x => x.Images)
                .Include(r => r.User)
                .AsQueryable();

            // Apply status filter
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                if (Enum.TryParse<ProductReview.ReviewStatus>(status, true, out var reviewStatus))
                {
                    query = query.Where(r => r.Status == reviewStatus);
                }
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(r =>
                    r.ReviewText.Contains(search) ||
                    r.User.FirstName.Contains(search) ||
                    r.User.LastName.Contains(search) ||
                    r.Product.Name.Contains(search));
            }

            // Get total count for pagination
            var totalReviews = await query.CountAsync();
            ViewBag.TotalReviews = totalReviews;
            ViewBag.TotalPages = (int)Math.Ceiling(totalReviews / (double)pageSize);

            // Apply pagination
            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Get statistics
            ViewBag.PendingCount = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Pending);
            ViewBag.ApprovedCount = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Approved);
            ViewBag.RejectedCount = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Rejected);
            ViewBag.TotalCount = await _context.ProductReviews.CountAsync();

            return View(reviews);
        }

        // GET: Reviews/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var review = await _context.ProductReviews
                .Include(r => r.Product)
                    .ThenInclude(x => x.ProductColors)
                        .ThenInclude(x => x.Images)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound();
            }

            return PartialView("_ReviewDetails", review);
        }

        // POST: Reviews/Approve/5
        [HttpPost]
        public async Task<IActionResult> Approve(int id)
        {
            try
            {
                var review = await _context.ProductReviews
                    .Include(r => r.Product)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (review == null)
                {
                    return Json(new { success = false, message = "Review not found." });
                }

                review.Status = ProductReview.ReviewStatus.Approved;
                review.CreatedAt = DateTime.Now; // Update timestamp

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Review approved successfully!",
                    status = "Approved",
                    statusClass = "approved"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Reviews/Reject/5
        [HttpPost]
        public async Task<IActionResult> Reject(int id)
        {
            try
            {
                var review = await _context.ProductReviews.FindAsync(id);
                if (review == null)
                {
                    return Json(new { success = false, message = "Review not found." });
                }

                review.Status = ProductReview.ReviewStatus.Rejected;
                review.CreatedAt = DateTime.Now; // Update timestamp

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Review rejected successfully!",
                    status = "Rejected",
                    statusClass = "rejected"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Reviews/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var review = await _context.ProductReviews.FindAsync(id);
                if (review == null)
                {
                    return Json(new { success = false, message = "Review not found." });
                }

                _context.ProductReviews.Remove(review);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Review deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // POST: Reviews/BulkAction
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> BulkAction(string action, List<int> reviewIds)
        {
            if (reviewIds == null || !reviewIds.Any())
            {
                return Json(new { success = false, message = "No reviews selected." });
            }

            try
            {
                var reviews = await _context.ProductReviews
                    .Where(r => reviewIds.Contains(r.Id))
                    .ToListAsync();

                if (!reviews.Any())
                {
                    return Json(new { success = false, message = "No reviews found." });
                }

                switch (action.ToLower())
                {
                    case "approve":
                        foreach (var review in reviews)
                        {
                            review.Status = ProductReview.ReviewStatus.Approved;
                            review.CreatedAt = DateTime.Now;
                        }
                        break;

                    case "reject":
                        foreach (var review in reviews)
                        {
                            review.Status = ProductReview.ReviewStatus.Rejected;
                            review.CreatedAt = DateTime.Now;
                        }
                        break;

                    case "delete":
                        _context.ProductReviews.RemoveRange(reviews);
                        break;

                    default:
                        return Json(new { success = false, message = "Invalid action." });
                }

                await _context.SaveChangesAsync();

                var actionMessage = action.ToLower() switch
                {
                    "approve" => "approved",
                    "reject" => "rejected",
                    "delete" => "deleted",
                    _ => "processed"
                };

                return Json(new
                {
                    success = true,
                    message = $"{reviews.Count} reviews {actionMessage} successfully!"
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // GET: Reviews/GetStats
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                pending = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Pending),
                approved = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Approved),
                rejected = await _context.ProductReviews.CountAsync(r => r.Status == ProductReview.ReviewStatus.Rejected),
                total = await _context.ProductReviews.CountAsync(),
                today = await _context.ProductReviews.CountAsync(r => r.CreatedAt.Date == DateTime.Today),
                avgRating = await _context.ProductReviews
                    .Where(r => r.Status == ProductReview.ReviewStatus.Approved)
                    .AverageAsync(r => (double?)r.Rating) ?? 0
            };

            return Json(stats);
        }
    }
}