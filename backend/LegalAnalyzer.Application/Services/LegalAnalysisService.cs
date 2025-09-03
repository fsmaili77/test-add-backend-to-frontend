// LegalAnalyzer.Application/Services/LegalAnalysisService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Domain.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text;
using LegalAnalyzer.Application.Models;
using System.Net.Http;
using System.IO;

namespace LegalAnalyzer.Application.Services
{
    public class LegalAnalysisService : ILegalAnalysisService
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly HttpClient _httpClient;
        private readonly ILogger<LegalAnalysisService> _logger;

        public LegalAnalysisService(
            IDocumentRepository documentRepository,
            IHttpClientFactory httpClientFactory,
            ILogger<LegalAnalysisService> logger)
        {
            _documentRepository = documentRepository;
            _httpClient = httpClientFactory.CreateClient("LegalDocAnalysisService");
            _logger = logger;

            // Configure HttpClient for legal analysis microservice
            // _httpClient.BaseAddress = new Uri("http://localhost:8002/");
            // _httpClient.Timeout = TimeSpan.FromMinutes(10); // Long timeout for analysis
        }

        public async Task<DocumentDto> AnalyzeDocumentWithMicroserviceAsync(Guid documentId, IFormFile file)
        {
            var document = await _documentRepository.GetByIdAsync(documentId);
            if (document == null)
            {
                throw new KeyNotFoundException($"Document with ID {documentId} not found");
            }

            try
            {
                _logger.LogInformation("Starting microservice analysis for document {DocumentId}", documentId);

                // Prepare file for microservice
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                using var content = new MultipartFormDataContent();
                content.Add(new StreamContent(memoryStream), "file", file.FileName);

                // Call the legal analysis microservice
                var response = await _httpClient.PostAsync("analyze-document", content);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var analysisResult = JsonSerializer.Deserialize<MicroserviceAnalysisResult>(responseContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                if (analysisResult != null)
                {
                    // Update document with microservice results
                    await UpdateDocumentWithMicroserviceResults(document, analysisResult);
                    _logger.LogInformation("Successfully analyzed document {DocumentId} with microservice", documentId);
                }
                else
                {
                    _logger.LogWarning("Received null analysis result for document {DocumentId}", documentId);
                }

                return MapToDto(document);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Microservice request failed for document {DocumentId}", documentId);
                throw new InvalidOperationException($"Legal analysis service unavailable: {ex.Message}", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Microservice request timed out for document {DocumentId}", documentId);
                throw new InvalidOperationException("Legal analysis service timed out", ex);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to deserialize microservice response for document {DocumentId}", documentId);
                throw new InvalidOperationException("Invalid response from legal analysis service", ex);
            }
        }

        public async Task<DocumentDto> AnalyzeDocumentByIdAsync(Guid documentId)
        {
            var document = await _documentRepository.GetByIdAsync(documentId);
            if (document == null)
            {
                throw new KeyNotFoundException($"Document with ID {documentId} not found");
            }

            // Create a temporary file from document content for microservice analysis
            var tempFileName = $"{document.Id}_{document.FileExtension ?? "txt"}";
            var tempPath = Path.Combine(Path.GetTempPath(), tempFileName);

            try
            {
                await File.WriteAllTextAsync(tempPath, document.Content);

                using var fileStream = new FileStream(tempPath, FileMode.Open, FileAccess.Read);
                using var content = new MultipartFormDataContent();
                content.Add(new StreamContent(fileStream), "file", tempFileName);

                var response = await _httpClient.PostAsync("analyze-document", content);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var analysisResult = JsonSerializer.Deserialize<MicroserviceAnalysisResult>(responseContent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                if (analysisResult != null)
                {
                    await UpdateDocumentWithMicroserviceResults(document, analysisResult);
                }

                return MapToDto(document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to analyze document {DocumentId} with microservice", documentId);
                throw;
            }
            finally
            {
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                }
            }
        }

        public async Task<IEnumerable<DocumentDto>> AnalyzeAllDocumentsAsync()
        {
            var documents = await _documentRepository.GetAllAsync();
            var results = new List<DocumentDto>();

            foreach (var document in documents)
            {
                if (document.Status == "Pending")
                {
                    try
                    {
                        var result = await AnalyzeDocumentByIdAsync(document.Id);
                        results.Add(result);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to analyze document {DocumentId}", document.Id);
                        // Continue with other documents
                    }
                }
            }

            return results;
        }

        private async Task UpdateDocumentWithMicroserviceResults(
            LegalAnalyzer.Domain.Entities.Document document,
            MicroserviceAnalysisResult result)
        {
            // Update basic document properties
            document.Type = result.DocumentClassification;
            document.Status = "Analyzed";
            document.Language = result.Language ?? document.Language;
            document.Summary = result.Summary;
            document.AnalysisResult = "Advanced analysis completed successfully";

            // Create new ExtractedInfo from microservice results
            var extractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo();

            // Map parties from all analysis types
            var allParties = new List<string>();

            if (result.ContractAnalysis?.Parties != null)
                allParties.AddRange(result.ContractAnalysis.Parties);
            if (result.BriefAnalysis?.Parties != null)
                allParties.AddRange(result.BriefAnalysis.Parties);
            if (result.CaseLawAnalysis?.Parties != null)
                allParties.AddRange(result.CaseLawAnalysis.Parties);
            if (result.RegulationAnalysis?.Parties != null)
                allParties.AddRange(result.RegulationAnalysis.Parties);

            extractedInfo.Parties = allParties
                .Distinct()
                .Select(p => new LegalAnalyzer.Domain.Entities.Party
                {
                    Name = p,
                    Role = "Party",
                    Type = "Entity"
                })
                .ToList();

            // Map key dates from contract analysis
            if (result.ContractAnalysis?.KeyDates != null)
            {
                extractedInfo.KeyDates = result.ContractAnalysis.KeyDates
                    .Select(kd => new LegalAnalyzer.Domain.Entities.KeyDate
                    {
                        Date = kd.ContainsKey("date") ? kd["date"] : kd.FirstOrDefault().Value ?? "",
                        Description = kd.ContainsKey("type") ? kd["type"] : "Contract date"
                    })
                    .ToList();
            }

            // Map financial terms from contract analysis
            if (result.ContractAnalysis?.PaymentTerms != null)
            {
                extractedInfo.FinancialTerms = result.ContractAnalysis.PaymentTerms
                    .Select(pt => new LegalAnalyzer.Domain.Entities.FinancialTerm
                    {
                        Term = "Payment",
                        Amount = pt
                    })
                    .ToList();
            }

            // Create risk assessment based on document content
            var riskFactors = new List<LegalAnalyzer.Domain.Entities.RiskFactor>();
            string overallRisk = "Low";

            // Analyze termination clauses for risk
            if (result.ContractAnalysis?.TerminationClauses?.Any() == true)
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Medium",
                    Factor = "Contract contains termination clauses"
                });
                overallRisk = "Medium";
            }

            // Analyze legal issues for risk
            if (result.BriefAnalysis?.LegalIssues?.Any() == true)
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "High",
                    Factor = "Document contains legal issues"
                });
                overallRisk = "High";
            }

            // Analyze regulatory requirements for risk
            if (result.RegulationAnalysis?.Requirements?.Any() == true)
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Medium",
                    Factor = "Document contains regulatory requirements"
                });
                if (overallRisk == "Low") overallRisk = "Medium";
            }

            extractedInfo.RiskAssessment = new LegalAnalyzer.Domain.Entities.RiskAssessment
            {
                Overall = overallRisk,
                Factors = riskFactors
            };

            document.ExtractedInfo = extractedInfo;
            await _documentRepository.UpdateAsync(document);
        }

        private DocumentDto MapToDto(LegalAnalyzer.Domain.Entities.Document document)
        {
            return new DocumentDto
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                UploadedAt = document.UploadedAt,
                Status = document.Status,
                Type = document.Type,
                FileExtension = document.FileExtension,
                Size = document.Size,
                AnalysisResult = document.AnalysisResult,
                Summary = document.Summary,
                ErrorMessage = document.ErrorMessage,
                AnalysisProgress = document.AnalysisProgress,
                AnalysisDuration = document.AnalysisDuration,
                Tags = document.Tags?.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList() ?? new List<TagDto>(),
                Keywords = document.Keywords?.Select(k => new KeywordDto { Id = k.Id, Value = k.Value }).ToList() ?? new List<KeywordDto>(),
                ExtractedInfo = new LegalAnalyzer.Application.DTOs.ExtractedInfo
                {
                    Parties = document.ExtractedInfo.Parties.Select(p => new LegalAnalyzer.Application.DTOs.Party
                    {
                        Name = p.Name,
                        Role = p.Role,
                        Type = p.Type
                    }).ToList(),
                    KeyDates = document.ExtractedInfo.KeyDates.Select(kd => new LegalAnalyzer.Application.DTOs.KeyDate
                    {
                        Date = kd.Date,
                        Description = kd.Description
                    }).ToList(),
                    FinancialTerms = document.ExtractedInfo.FinancialTerms.Select(ft => new LegalAnalyzer.Application.DTOs.FinancialTerm
                    {
                        Term = ft.Term,
                        Amount = ft.Amount
                    }).ToList(),
                    RiskAssessment = new LegalAnalyzer.Application.DTOs.RiskAssessment
                    {
                        Overall = document.ExtractedInfo.RiskAssessment.Overall,
                        Factors = document.ExtractedInfo.RiskAssessment.Factors.Select(f => new LegalAnalyzer.Application.DTOs.RiskFactor
                        {
                            Risk = f.Risk,
                            Factor = f.Factor
                        }).ToList()
                    }
                }
            };
        }
    }
}