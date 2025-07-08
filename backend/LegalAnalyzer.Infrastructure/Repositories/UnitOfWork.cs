using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Domain.Repositories;
using LegalAnalyzer.Domain.Interfaces;
using LegalAnalyzer.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace LegalAnalyzer.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    private IDocumentRepository? _documentRepository;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IDocumentRepository Documents => _documentRepository ??= new DocumentRepository(_context);

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
}