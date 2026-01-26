using E_Commerce.Models;
using Microsoft.EntityFrameworkCore;

namespace E_Commerce.Services
{
    public class GetCategories
    {
        private readonly MyDbContext _context;
        public GetCategories(MyDbContext context)
        {
            _context = context;
        }

        public async Task<List<Category>> GetCategoriesAsync()
        {
            return await _context.Categories
                        .Where(c => c.IsActive)
                        .OrderBy(c => c.Name)
                        .ToListAsync();
        }
    }
}
