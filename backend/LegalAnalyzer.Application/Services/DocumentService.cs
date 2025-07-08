using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Domain.Entities;
using LegalAnalyzer.Domain.Repositories;
using LegalAnalyzer.Application.Requests;


namespace LegalAnalyzer.Application.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _documentRepository;

        public DocumentService(IDocumentRepository documentRepository)
        {
            _documentRepository = documentRepository;
        }

        public async Task<IEnumerable<DocumentDto>> GetAllDocumentsAsync()
        {
            var documents = await _documentRepository.GetAllAsync();
            return documents.Select(d => new DocumentDto
            {
                Id = d.Id,
                Title = d.Title,
                Content = d.Content,
                Language = d.Language,
                UploadedAt = d.UploadedAt
            });
        }

        public async Task<DocumentDto?> GetDocumentByIdAsync(Guid id)
        {
            var doc = await _documentRepository.GetByIdAsync(id);
            if (doc == null) return null;

            return new DocumentDto
            {
                Id = doc.Id,
                Title = doc.Title,
                Content = doc.Content,
                Language = doc.Language,
                UploadedAt = doc.UploadedAt
            };
        }

        public async Task<Guid> CreateDocumentAsync(string title, string content, string language)
        {
            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                Language = language
            };

            await _documentRepository.AddAsync(document);
            return document.Id;
        }

        public async Task UpdateDocumentAsync(Guid id, string title, string content, string language)
        {
            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null) throw new KeyNotFoundException("Document not found");

            document.Title = title;
            document.Content = content;
            document.Language = language;

            await _documentRepository.UpdateAsync(document);
        }

        public async Task DeleteDocumentAsync(Guid id)
        {
            await _documentRepository.DeleteAsync(id);
        }
        public async Task UploadDocumentAsync(CreateDocumentRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Content))
            {
                throw new ArgumentException("Invalid document data.");
            }

            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Content = request.Content,
                Language = request.Language ?? "en",
                UploadedAt = DateTime.UtcNow
            };

            await _documentRepository.AddAsync(document);
        }
        public async Task AnalyzeDocumentAsync(Guid id)
        {
            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
            {
                throw new KeyNotFoundException("Document not found");
            }
            if (document.Status != "Pending")
            {
                throw new InvalidOperationException("Document is not in a state that can be analyzed.");
            }

            document.Status = "Analyzing";
            await _documentRepository.UpdateAsync(document);

        }
        // Placeholder for document analysis logic
        // This could involve calling an external service or running a local analysis algorithm
    }     
}