using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Application.Requests;
using LegalAnalyzer.Domain.Entities;


namespace LegalAnalyzer.Application.Services
{
    public interface IDocumentService
    {
        Task<IEnumerable<DocumentDto>> GetAllDocumentsAsync();
        Task<DocumentDto?> GetDocumentByIdAsync(Guid id);
        Task<Guid> CreateDocumentAsync(string title, string content, string language, string fileType, long fileSize);
        Task UpdateDocumentAsync(Guid id, string title, string content, string language);
        Task DeleteDocumentAsync(Guid id);
        Task UploadDocumentAsync(CreateDocumentRequest request);
        Task<DocumentDto> AnalyzeDocumentAsync(Guid id);
        Task<DocumentDto> SummarizeDocumentAsync(Guid id);
        //Analyze all documents
        Task<IEnumerable<DocumentDto>> AnalyzeAllDocumentsAsync();

}
}