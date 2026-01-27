using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_Commerce.Models.DbTables
{
    public class Contact
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [Required]
        [StringLength(100)]
        public string Subject { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Message { get; set; }


        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public bool IsResponded { get; set; } = false;
    }
}