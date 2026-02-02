using E_Commerce.Models.DbTables;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace E_Commerce.Models
{
    public class MyDbContext
        : IdentityDbContext<ApplicationUser>
    {
        public MyDbContext(DbContextOptions<MyDbContext> options)
            : base(options)
        {
        }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductColor> ProductColors { get; set; }
        public DbSet<Discount> Discounts { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<ProductVideo> ProductVideos { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderAddress> OrderAddress { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Settings> Settings { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }
        public DbSet<LoginHistory> LoginHistory { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<OrderCancellation> OrderCancellations { get; set; }
        //public DbSet<Newsletter> Newsletters { get; set; }


        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    base.OnModelCreating(modelBuilder);

        //    modelBuilder.Entity<Cart>()
        //        .HasOne(c => c.ProductColor)
        //        .WithMany()
        //        .HasForeignKey(c => c.ProductColorId)
        //        .OnDelete(DeleteBehavior.Restrict);
        //}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany()
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.ProductColor)
                .WithMany()
                .HasForeignKey(ci => ci.ProductColorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CartItem>()
                .Property(ci => ci.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.ProductColor)
                .WithMany()
                .HasForeignKey(oi => oi.ProductColorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.TotalPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Settings>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();

                entity.Property(e => e.StoreName).HasDefaultValue("Luxe Suits");
                entity.Property(e => e.Currency).HasDefaultValue("PKR");
                entity.Property(e => e.TaxPercentage).HasDefaultValue(16);
                entity.Property(e => e.ShippingCost).HasDefaultValue(200);
                entity.Property(e => e.SmtpPort).HasDefaultValue(587);
                entity.Property(e => e.SessionTimeout).HasDefaultValue(30);
                entity.Property(e => e.MaxLoginAttempts).HasDefaultValue(5);
                entity.Property(e => e.MaintenanceMode).HasDefaultValue(false);
                entity.Property(e => e.EnableTwoFactorAuth).HasDefaultValue(false);
            });

            modelBuilder.Entity<ProductReview>()
               .HasIndex(r => new { r.UserId, r.ProductId })
               .IsUnique();
        }



    }
}
