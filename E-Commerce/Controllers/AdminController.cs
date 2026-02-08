using E_Commerce.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace E_Commerce.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("Admin")]
    public class AdminController : Controller
    {
        private readonly ILogger<AdminController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MyDbContext _context;

        public AdminController(ILogger<AdminController> logger, UserManager<ApplicationUser> userManager, MyDbContext context)
        {
            _logger = logger;
            _userManager = userManager;
            _context = context;
        }
        [HttpGet("")]
        public IActionResult Index()
        {
            return View();
        }

        // GET: Admin/GetDashboardStats
        [HttpGet("GetDashboardStats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var today = DateTime.Today;
                var lastMonthStart = today.AddMonths(-1).AddDays(1 - today.Day);
                var lastMonthEnd = lastMonthStart.AddMonths(1).AddDays(-1);
                var currentMonthStart = new DateTime(today.Year, today.Month, 1);

                // Total Revenue (delivered orders only)
                var totalRevenue = await _context.Orders
                    .Where(o => o.Status == Order.OrderStatus.Delivered)
                    .SumAsync(o => o.GrandTotal);

                // Last month revenue for comparison
                var lastMonthRevenue = await _context.Orders
                    .Where(o => o.Status == Order.OrderStatus.Delivered &&
                               o.CreatedAt >= lastMonthStart && o.CreatedAt <= lastMonthEnd)
                    .SumAsync(o => o.GrandTotal);

                var currentMonthRevenue = await _context.Orders
                    .Where(o => o.Status == Order.OrderStatus.Delivered &&
                               o.CreatedAt >= currentMonthStart)
                    .SumAsync(o => o.GrandTotal);

                var revenueChange = lastMonthRevenue > 0 ?
                    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 100;

                // Total Orders
                var totalOrders = await _context.Orders.CountAsync();
                var lastMonthOrders = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= lastMonthStart && o.CreatedAt <= lastMonthEnd);
                var currentMonthOrders = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= currentMonthStart);

                var ordersChange = lastMonthOrders > 0 ?
                    ((currentMonthOrders - lastMonthOrders) / (double)lastMonthOrders * 100) : 100;

                // Total Customers
                var totalCustomers = await _context.Users.CountAsync();
                var lastMonthCustomers = await _context.Users
                    .CountAsync(u => u.CreatedAt >= lastMonthStart && u.CreatedAt <= lastMonthEnd);
                var currentMonthCustomers = await _context.Users
                    .CountAsync(u => u.CreatedAt >= currentMonthStart);

                var customersChange = lastMonthCustomers > 0 ?
                    ((currentMonthCustomers - lastMonthCustomers) / (double)lastMonthCustomers * 100) : 100;

                // Conversion Rate (sessions with orders / total sessions)
                // For simplicity, using orders per customer
                var conversionRate = totalCustomers > 0 ?
                    (totalOrders / (double)totalCustomers * 100) : 0;

                var lastMonthConversion = lastMonthCustomers > 0 ?
                    (lastMonthOrders / (double)lastMonthCustomers * 100) : 0;

                var conversionChange = lastMonthConversion > 0 ?
                    (conversionRate - lastMonthConversion) : conversionRate;

                return Ok(new
                {
                    totalRevenue = Math.Round(totalRevenue, 2),
                    revenueChange = Math.Round(revenueChange, 1),
                    totalOrders = totalOrders,
                    ordersChange = Math.Round(ordersChange, 1),
                    totalCustomers = totalCustomers,
                    customersChange = Math.Round(customersChange, 1),
                    conversionRate = Math.Round(conversionRate, 1),
                    conversionChange = Math.Round(conversionChange, 1)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                return StatusCode(500, new { message = "Error loading dashboard statistics" });
            }
        }

        // GET: Admin/GetRevenueData
        [HttpGet("GetRevenueData")]
        public async Task<IActionResult> GetRevenueData(int days = 7)
        {
            try
            {
                var endDate = DateTime.Today;
                var startDate = endDate.AddDays(-days + 1);

                // Create list of dates for the period
                var dateLabels = new List<string>();
                var revenueData = new List<decimal>();

                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    var nextDay = date.AddDays(1);
                    var dailyRevenue = await _context.Orders
                        .Where(o => o.Status == Order.OrderStatus.Delivered &&
                                   o.CreatedAt >= date && o.CreatedAt < nextDay)
                        .SumAsync(o => o.GrandTotal);

                    // Format label based on period
                    string label;
                    if (days <= 7)
                    {
                        label = date.ToString("ddd");
                    }
                    else if (days <= 31)
                    {
                        label = date.ToString("MMM dd");
                    }
                    else
                    {
                        label = date.ToString("MMM yyyy");
                    }

                    dateLabels.Add(label);
                    revenueData.Add(Math.Round(dailyRevenue, 2));
                }

                return Ok(new
                {
                    labels = dateLabels,
                    values = revenueData
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue data");
                return StatusCode(500, new { message = "Error loading revenue data" });
            }
        }

        // GET: Admin/GetCategorySales
        [HttpGet("GetCategorySales")]
        public async Task<IActionResult> GetCategorySales(string period = "current_month")
        {
            try
            {
                DateTime startDate, endDate = DateTime.Today;

                switch (period)
                {
                    case "last_month":
                        startDate = new DateTime(endDate.Year, endDate.Month, 1).AddMonths(-1);
                        endDate = startDate.AddMonths(1).AddDays(-1);
                        break;
                    case "current_year":
                        startDate = new DateTime(endDate.Year, 1, 1);
                        break;
                    default: // current_month
                        startDate = new DateTime(endDate.Year, endDate.Month, 1);
                        break;
                }

                // Get sales by category
                var categorySales = await _context.Orders
                    .Where(o => o.Status == Order.OrderStatus.Delivered &&
                               o.CreatedAt >= startDate && o.CreatedAt <= endDate)
                    .Join(_context.OrderItems,
                        order => order.Id,
                        item => item.OrderId,
                        (order, item) => new { order, item })
                    .Join(_context.Products,
                        combined => combined.item.ProductId,
                        product => product.Id,
                        (combined, product) => new { combined, product })
                    .Join(_context.Categories,
                        combined => combined.product.CategoryId,
                        category => category.Id,
                        (combined, category) => new
                        {
                            CategoryName = category.Name,
                            Revenue = combined.combined.item.TotalPrice
                        })
                    .GroupBy(x => x.CategoryName)
                    .Select(g => new
                    {
                        Category = g.Key,
                        Revenue = g.Sum(x => x.Revenue)
                    })
                    .OrderByDescending(x => x.Revenue)
                    .Take(8) // Top 8 categories
                    .ToListAsync();

                // If no categories found, get all active categories
                if (!categorySales.Any())
                {
                    categorySales = await _context.Categories
                        .Where(c => c.IsActive)
                        .Select(c => new
                        {
                            Category = c.Name,
                            Revenue = 0m
                        })
                        .Take(8)
                        .ToListAsync();
                }

                var totalRevenue = categorySales.Sum(x => x.Revenue);

                return Ok(new
                {
                    labels = categorySales.Select(x => x.Category).ToList(),
                    values = categorySales.Select(x => Math.Round(x.Revenue, 2)).ToList(),
                    total = Math.Round(totalRevenue, 2)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category sales");
                return StatusCode(500, new { message = "Error loading category data" });
            }
        }

        // GET: Admin/GetRecentOrders
        [HttpGet("GetRecentOrders")]
        public async Task<IActionResult> GetRecentOrders()
        {
            try
            {
                var recentOrders = await _context.Orders
                    .Include(o => o.User)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(10)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.GrandTotal,
                        o.Status,
                        o.CreatedAt,
                        User = new
                        {
                            o.User.Id,
                            o.User.FirstName,
                            o.User.Email
                        }
                    })
                    .ToListAsync();

                return Ok(recentOrders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent orders");
                return StatusCode(500, new { message = "Error loading recent orders" });
            }
        }

        [HttpGet("Orders")]
        public IActionResult Orders()
        {
            return View();
        }

        [HttpGet("Privacy")]
        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpGet("Error")]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
