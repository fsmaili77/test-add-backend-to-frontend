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
        public DbSet<Document> Documents { get; set; }
        public DbSet<DocumentTag> DocumentTags { get; set; }
        public DbSet<DocumentKeyword> DocumentKeywords { get; set; }

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

                // Configure one-to-many relationships for Tags and Keywords
                b.HasMany(d => d.Tags)
                 .WithOne()
                 .HasForeignKey(t => t.DocumentId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasMany(d => d.Keywords)
                 .WithOne()
                 .HasForeignKey(k => k.DocumentId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Configure ExtractedInfo as owned type (separate table)
                b.OwnsOne(d => d.ExtractedInfo, extractedInfo =>
                {
                    extractedInfo.ToTable("ExtractedInfoes");
                    extractedInfo.WithOwner().HasForeignKey("DocumentId");
                    extractedInfo.OwnsMany(ei => ei.Parties, p =>
                    {
                        p.ToTable("Parties");
                        p.Property(p => p.Name).IsRequired();
                        p.Property(p => p.Role).IsRequired();
                        p.Property(p => p.Type).IsRequired();
                    });
                    extractedInfo.OwnsMany(ei => ei.KeyDates, kd =>
                    {
                        kd.ToTable("KeyDates");
                        kd.Property(kd => kd.Date).IsRequired();
                        kd.Property(kd => kd.Description).IsRequired();
                    });
                    extractedInfo.OwnsMany(ei => ei.FinancialTerms, ft =>
                    {
                        ft.ToTable("FinancialTerms");
                        ft.Property(ft => ft.Term).IsRequired();
                        ft.Property(ft => ft.Amount).IsRequired();
                    });
                    extractedInfo.OwnsOne(ei => ei.RiskAssessment, ra =>
                    {
                        ra.ToTable("RiskAssessments");
                        ra.Property(ra => ra.Overall).IsRequired();
                        ra.OwnsMany(ra => ra.Factors, rf =>
                        {
                            rf.ToTable("RiskFactors");
                            rf.Property(rf => rf.Risk).IsRequired();
                            rf.Property(rf => rf.Factor).IsRequired();
                        });
                    });
                });
            });

            // Configure DocumentTag entity
            modelBuilder.Entity<DocumentTag>(b =>
            {
                b.ToTable("DocumentTags");
                b.HasKey(t => t.Id);
                b.Property(t => t.Name).IsRequired().HasMaxLength(100);
                b.Property(t => t.DocumentId).IsRequired();
                b.HasIndex(t => t.DocumentId);
            });

            // Configure DocumentKeyword entity
            modelBuilder.Entity<DocumentKeyword>(b =>
            {
                b.ToTable("DocumentKeywords");
                b.HasKey(k => k.Id);
                b.Property(k => k.Value).IsRequired();
                b.Property(k => k.DocumentId).IsRequired();
                b.HasIndex(k => k.DocumentId);
            });
        }
    }
}