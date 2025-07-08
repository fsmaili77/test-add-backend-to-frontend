using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Domain.Repositories;
using LegalAnalyzer.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;


namespace LegalAnalyzer.Infrastructure.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IDocumentRepository Documents { get; }
        Task<int> CompleteAsync();
    }
}