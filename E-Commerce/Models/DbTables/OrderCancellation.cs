namespace E_Commerce.Models.DbTables
{
    public class OrderCancellation
    {
        public int Id { get; set; }

        // Relation
        public int OrderId { get; set; }
        public Order Order { get; set; }

        // Who cancelled
        public CancellationBy CancelledBy { get; set; }

        // Optional reason
        public string? Reason { get; set; }

        // Retry payment allowed?
        public bool AllowRetryPayment { get; set; }

        public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
    }

    public enum CancellationBy
    {
        User,
        Admin,
        System
    }
}
