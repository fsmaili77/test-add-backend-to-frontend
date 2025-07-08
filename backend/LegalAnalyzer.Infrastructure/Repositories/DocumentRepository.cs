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
        _context = context;
    }

    public async Task<IEnumerable<Document>> GetAllAsync()
    {
        return await _context.Documents.ToListAsync() 
               ?? Enumerable.Empty<Document>();
    }

    public async Task<Document?> GetByIdAsync(Guid id)
    {
        return await _context.Documents.FindAsync(id);
    }

    public async Task<Document> AddAsync(Document document)
    {
        if (document == null) throw new ArgumentNullException(nameof(document));
        
        _context.Documents.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

            //updated with its generated ID
    public async Task<Document> UpdateAsync(Document document)
    {
        if (document == null) throw new ArgumentNullException(nameof(document));
        
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