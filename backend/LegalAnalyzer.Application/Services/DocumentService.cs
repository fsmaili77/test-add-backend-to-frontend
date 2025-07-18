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
                FileExtension = d.FileExtension, // Add FileExtension to the response
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
                FileExtension = doc.FileExtension, // Add FileExtension to the response
                Size = doc.Size,
                AnalysisResult = doc.AnalysisResult,
                Summary = doc.Summary,
                ErrorMessage = doc.ErrorMessage,
                Tags = doc.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = doc.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
            };
        }

        public async Task<Guid> CreateDocumentAsync(string title, string content, string language, string fileType, long fileSize, string fileExtension)
        {
            var classification = fileType.ToLower() == "auto" ? await AutoDetectClassification(content) : fileType.ToLower();

            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                Language = language,
                Type = classification, // Use classification type
                FileExtension = fileExtension, // Store file extension
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

            var classification = request.FileType.ToLower() == "auto" ? await AutoDetectClassification(request.Content) : request.FileType.ToLower();

            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Content = request.Content,
                Language = request.Language ?? "en",
                Type = classification, // Use classification type
                FileExtension = request.FileExtension, // Store file extension
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
                Type = document.Type,
                FileExtension = document.FileExtension, // Add FileExtension
                Size = document.Size,
                AnalysisResult = document.AnalysisResult,
                Summary = document.Summary,
                ErrorMessage = document.ErrorMessage,
                AnalysisProgress = document.AnalysisProgress,
                AnalysisDuration = document.AnalysisDuration,
                Tags = document.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = document.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
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
                Type = document.Type,
                FileExtension = document.FileExtension, // Add FileExtension
                Size = document.Size,
                AnalysisResult = document.AnalysisResult,
                Summary = document.Summary,
                ErrorMessage = document.ErrorMessage,
                AnalysisProgress = document.AnalysisProgress,
                AnalysisDuration = document.AnalysisDuration,
                Tags = document.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = document.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
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
                    Status = "Analyzed",
                    Type = document.Type,
                    FileExtension = document.FileExtension, // Add FileExtension
                    Size = document.Size,
                    AnalysisResult = document.AnalysisResult,
                    Summary = document.Summary,
                    ErrorMessage = document.ErrorMessage,
                    AnalysisProgress = document.AnalysisProgress,
                    AnalysisDuration = document.AnalysisDuration,
                    Tags = document.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                    Keywords = document.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>()
                };

                analysisResults.Add(analysisResult);
            }

            return analysisResults;
        }

        private async Task<string> AutoDetectClassification(string content)
        {
            // Simple keyword-based classification (replace with NLP/ML model for better accuracy)
            if (string.IsNullOrEmpty(content)) return "other";

            content = content.ToLower();
            if (content.Contains("agreement") || content.Contains("contract"))
                return "contract";
            if (content.Contains("brief") || content.Contains("motion"))
                return "brief";
            if (content.Contains("regulation") || content.Contains("statute"))
                return "regulation";
            if (content.Contains("case law") || content.Contains("precedent"))
                return "case-law";
            return "other";
        }
    }
}