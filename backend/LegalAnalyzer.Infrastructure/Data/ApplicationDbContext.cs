using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using LegalAnalyzer.Domain.Entities;

namespace LegalAnalyzer.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<Document> Documents { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Document>(b =>
            {
                b.Property(d => d.Id).ValueGeneratedOnAdd();
                b.Property(d => d.Title).IsRequired().HasMaxLength(200);
                b.Property(d => d.Content).IsRequired();
                b.Property(d => d.Language).IsRequired().HasDefaultValue("en");
                b.Property(d => d.Status).IsRequired().HasDefaultValue("Pending");
                b.Property(d => d.UploadedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Configure ExtractedInfo as owned types (separate tables)
                b.OwnsOne(d => d.ExtractedInfo, extractedInfo =>
                {
                    extractedInfo.WithOwner();
                    extractedInfo.OwnsMany(ei => ei.Parties, p =>
                    {
                        p.WithOwner();
                        p.Property(p => p.Name).IsRequired();
                        p.Property(p => p.Role).IsRequired();
                        p.Property(p => p.Type).IsRequired();
                    });
                    extractedInfo.OwnsMany(ei => ei.KeyDates, kd =>
                    {
                        kd.WithOwner();
                        kd.Property(kd => kd.Date).IsRequired();
                        kd.Property(kd => kd.Description).IsRequired();
                    });
                    extractedInfo.OwnsMany(ei => ei.FinancialTerms, ft =>
                    {
                        ft.WithOwner();
                        ft.Property(ft => ft.Term).IsRequired();
                        ft.Property(ft => ft.Amount).IsRequired();
                    });
                    extractedInfo.OwnsOne(ei => ei.RiskAssessment, ra =>
                    {
                        ra.WithOwner();
                        ra.Property(ra => ra.Overall).IsRequired();
                        ra.OwnsMany(ra => ra.Factors, rf =>
                        {
                            rf.WithOwner();
                            rf.Property(rf => rf.Risk).IsRequired();
                            rf.Property(rf => rf.Factor).IsRequired();
                        });
                    });
                });

                // Existing configurations for Tags and Keywords
                b.OwnsMany(d => d.Tags, t =>
                {
                    t.Property(t => t.Name).IsRequired().HasMaxLength(100);
                    t.WithOwner().HasForeignKey("DocumentId");
                });

                b.OwnsMany(d => d.Keywords, k =>
                {
                    k.Property(k => k.Value).IsRequired();
                    k.WithOwner().HasForeignKey("DocumentId");
                });
            });
        }
    }
}