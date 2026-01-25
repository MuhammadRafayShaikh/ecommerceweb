namespace E_Commerce.Models
{
    public class ProductReview
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public string UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        public int Rating { get; set; }
        // 1 to 5

        public string ReviewText { get; set; } = null!;

        public string? FitFeedback { get; set; }
        // Perfect / Tight / Loose

        public ReviewStatus Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public enum ReviewStatus
        {
            Pending = 0,
            Approved = 1,
            Rejected = 2
        }

    }

}
