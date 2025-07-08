using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Domain.Entities;
using Microsoft.EntityFrameworkCore;


namespace LegalAnalyzer.Domain.Repositories
{
    public interface IDocumentRepository
    {
        Task<IEnumerable<Document>> GetAllAsync();
        Task<Document?> GetByIdAsync(Guid id);
        Task<Document> AddAsync(Document document);
        Task<Document> UpdateAsync(Document document);
        Task DeleteAsync(Guid id);
        
    }
}