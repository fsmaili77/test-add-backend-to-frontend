using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using Microsoft.AspNetCore.Http;
using System.Net.Http;

namespace LegalAnalyzer.Application.Services
{
    public interface ILegalAnalysisService
    {
        Task<DocumentDto> AnalyzeDocumentWithMicroserviceAsync(Guid documentId, IFormFile file);
        Task<DocumentDto> AnalyzeDocumentByIdAsync(Guid documentId);
        Task<IEnumerable<DocumentDto>> AnalyzeAllDocumentsAsync();
    }
}