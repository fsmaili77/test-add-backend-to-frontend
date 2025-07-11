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
                UploadedAt = d.UploadedAt,
                Status = d.Status,
                Type = d.Type,
                Size = d.Size,
                AnalysisResult = d.AnalysisResult,
                Summary = d.Summary,
                ErrorMessage = d.ErrorMessage,
                Tags = d.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = d.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
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
                UploadedAt = doc.UploadedAt,
                Status = doc.Status,
                Type = doc.Type,
                Size = doc.Size,
                AnalysisResult = doc.AnalysisResult,
                Summary = doc.Summary,
                ErrorMessage = doc.ErrorMessage,
                Tags = doc.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = doc.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
            };
        }

        public async Task<Guid> CreateDocumentAsync(string title, string content, string language, string fileType, long fileSize)
        {
            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                Language = language,
                Type = fileType,
                Size = fileSize,
                UploadedAt = DateTime.UtcNow,
                Status = "Pending"
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
                Type = request.FileType, 
                Size = request.FileSize, 
                UploadedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            await _documentRepository.AddAsync(document);
        }
        public async Task<DocumentDto> AnalyzeDocumentAsync(Guid id)
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

            return new DocumentDto
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                UploadedAt = document.UploadedAt,
                Status = document.Status,
                Summary = document.Summary,
                AnalysisResult = document.AnalysisResult,
                ErrorMessage = document.ErrorMessage
            };
        }
        public async Task<DocumentDto> SummarizeDocumentAsync(Guid id)
        {
            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
            {
                throw new KeyNotFoundException("Document not found");
            }
            if (document.Status != "Analyzed")
            {
                throw new InvalidOperationException("Document is not in a state that can be summarized.");
            }

            // Implement summarization logic here
            document.Summary = "This is a summary of the document.";
            document.Status = "Summarized";
            await _documentRepository.UpdateAsync(document);

            return new DocumentDto
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                UploadedAt = document.UploadedAt,
                Status = document.Status,
                Summary = document.Summary,
                AnalysisResult = document.AnalysisResult,
                ErrorMessage = document.ErrorMessage
            };
        }
        public async Task<IEnumerable<DocumentDto>> AnalyzeAllDocumentsAsync()
        {
            var documents = await _documentRepository.GetAllAsync();
            var analysisResults = new List<DocumentDto>();

            foreach (var document in documents)
            {
                if (document.Status != "Pending")
                {
                    continue;
                }

                document.Status = "Analyzing";
                await _documentRepository.UpdateAsync(document);

                // Implement analysis logic here
                var analysisResult = new DocumentDto
                {
                    Id = document.Id,
                    Title = document.Title,
                    Content = document.Content,
                    Language = document.Language,
                    UploadedAt = document.UploadedAt,
                    Status = "Analyzed"
                };

                analysisResults.Add(analysisResult);
            }

            return analysisResults;
        }
    }         
}