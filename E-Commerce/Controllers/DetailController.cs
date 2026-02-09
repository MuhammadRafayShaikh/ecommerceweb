using E_Commerce.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace E_Commerce.Controllers
{
    public class DetailController : Controller
    {
        private readonly MyDbContext _myDbContext;
        private string userId { get { return User.FindFirstValue(ClaimTypes.NameIdentifier); } }
        public DetailController(MyDbContext myDbContext)
        {
            _myDbContext = myDbContext;
        }
        public async Task<IActionResult> Index(int id)
        {
            Product product = await _myDbContext.Products
                .Include(x => x.Category)
                .Include(x => x.ProductColors)
                    .ThenInclude(x => x.Images)
                .Include(x => x.Discount)
                .Include(x => x.Videos)
                .Include(x => x.Reviews)
                .Where(x => x.Id == id)
                .FirstOrDefaultAsync();
            List<Product> relatedProducts = await _myDbContext.Products
                .Include(x => x.Category)
                .Include(x => x.ProductColors)
                    .ThenInclude(x => x.Images)
                .Where(x => x.Category.Id == product.Category.Id && x.Id != id)
                .OrderByDescending(x => x.Id)
                .Take(4)
                .ToListAsync();
            ViewData["relatedProducts"] = relatedProducts;

            ViewData["AverageRating"] = product.AverageRating;
            ViewData["TotalReviews"] = product.TotalReviews;
            var baseQuery = _myDbContext.OrderItems
                .Where(x => x.Order.UserId == userId && x.ProductId == id);

            ViewData["isPurchasedProduct"] = await baseQuery
                .AnyAsync(x => x.Order.Status == Order.OrderStatus.Confirmed);

            ViewData["isDeliveredProduct"] = await baseQuery
                .AnyAsync(x => x.Order.Status == Order.OrderStatus.Delivered);

            ViewData["notAlreadyReview"] = await _myDbContext.ProductReviews.AnyAsync(x => x.UserId == userId && x.ProductId == id);

            ViewData["waitForAdmin"] = await _myDbContext.ProductReviews.AnyAsync(x => x.UserId == userId && x.ProductId == id && x.Status == ProductReview.ReviewStatus.Pending);

            bool isProductInCart = await _myDbContext.CartItems.AnyAsync(x => x.Cart.UserId == userId && x.ProductId == id);

            ViewData["isProductInCart"] = isProductInCart;

            return View(product);
        }

        [HttpGet]
        public IActionResult GetColorData(int colorId)
        {
            try
            {
                var color = _myDbContext.ProductColors
                    .Include(c => c.Images)
                    .FirstOrDefault(c => c.Id == colorId);

                if (color == null)
                {
                    return Json(new { success = false, message = "Color not found" });
                }

                var imageUrls = color.Images
                    .Select(img => Url.Content($"~/ProductImages/{img.ImagePath}"))
                    .ToList();

                var sizes = color.Sizes;

                return Json(new
                {
                    success = true,
                    images = imageUrls,
                    sizes = sizes
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
