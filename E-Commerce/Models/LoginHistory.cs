using E_Commerce.Models;

public class LoginHistory
{
    public int Id { get; set; }

    public string UserId { get; set; }
    public ApplicationUser User { get; set; }

    public DateTime LoginTime { get; set; }

    public string IpAddress { get; set; }

    public string UserAgent { get; set; }

    public bool IsSuccessful { get; set; }
}
