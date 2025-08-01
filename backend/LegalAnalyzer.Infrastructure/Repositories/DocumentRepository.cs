using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Domain.Entities;
using LegalAnalyzer.Domain.Repositories;
using LegalAnalyzer.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LegalAnalyzer.Infrastructure.Repositories
{
    public class DocumentRepository : IDocumentRepository
    {
        private readonly ApplicationDbContext _context;

        public DocumentRepository(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<Document>> GetAllAsync()
        {
            return await _context.Documents
                .Include(d => d.Tags)
                .Include(d => d.Keywords)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.Parties)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.KeyDates)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.FinancialTerms)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.RiskAssessment)
                .ThenInclude(ra => ra.Factors)
                .ToListAsync();
        }

        public async Task<Document?> GetByIdAsync(Guid id)
        {
            return await _context.Documents
                .Include(d => d.Tags)
                .Include(d => d.Keywords)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.Parties)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.KeyDates)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.FinancialTerms)
                .Include(d => d.ExtractedInfo)
                .ThenInclude(ei => ei.RiskAssessment)
                .ThenInclude(ra => ra.Factors)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<Document> AddAsync(Document document)
        {
            if (document == null)
            {
                throw new ArgumentNullException(nameof(document));
            }

            await _context.Documents.AddAsync(document);
            await _context.SaveChangesAsync();
            return document;
        }

        public async Task<Document> UpdateAsync(Document document)
        {
            if (document == null)
            {
                throw new ArgumentNullException(nameof(document));
            }

            _context.Documents.Update(document);
            await _context.SaveChangesAsync();
            return document;
        }

        public async Task DeleteAsync(Guid id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document != null)
            {
                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();
            }
        }
    }
}