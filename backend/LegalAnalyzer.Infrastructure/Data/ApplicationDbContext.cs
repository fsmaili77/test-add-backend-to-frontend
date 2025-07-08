using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LegalAnalyzer.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Document>? Documents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure the Document entity
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Title).IsRequired().HasMaxLength(200);
            entity.Property(d => d.Content).IsRequired();
            entity.Property(d => d.Language).HasDefaultValue("en");
            entity.Property(d => d.UploadedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(d => d.Status).HasDefaultValue("Pending");
            
            entity.HasMany(d => d.Tags)
                .WithOne(t => t.Document)
                .HasForeignKey(t => t.DocumentId);
        });

        modelBuilder.Entity<DocumentTag>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
            });
    }

    /* public async Task<int> SaveChangesAsync()
    {
        return await base.SaveChangesAsync();
    }

    public override int SaveChanges()
    {
        return base.SaveChanges();
    } */
}
}
