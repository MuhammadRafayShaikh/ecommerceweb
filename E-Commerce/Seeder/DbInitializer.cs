using E_Commerce.Models;
using E_Commerce.Services;
using Microsoft.EntityFrameworkCore;

namespace E_Commerce.Seeder
{
    public static class DbInitializer
    {
        public static async Task SeedSettingsAsync(MyDbContext myDbContext)
        {
            await myDbContext.Database.EnsureCreatedAsync();

            if (!await myDbContext.Settings.AnyAsync())
            {
                var settings = new Settings
                {
                    SmtpPassword = "siuymtzsjdocebzk"
                };

                await myDbContext.Settings.AddAsync(settings);
                await myDbContext.SaveChangesAsync();
            }
        }
    }

}
