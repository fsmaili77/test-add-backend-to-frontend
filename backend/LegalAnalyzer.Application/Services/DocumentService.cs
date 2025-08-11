using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Domain.Entities;
using LegalAnalyzer.Domain.Repositories;
using System.Text.RegularExpressions;
using LegalAnalyzer.Application.Requests;
using LegalAnalyzer.Application.Services;
using Microsoft.Extensions.Logging;

namespace LegalAnalyzer.Application.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(IDocumentRepository documentRepository, ILogger<DocumentService> logger)
        {
            _documentRepository = documentRepository;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<IEnumerable<DocumentDto>> GetAllDocumentsAsync()
        {
            var documents = await _documentRepository.GetAllAsync();
            return documents.Select(d => MapToDto(d)).ToList();
        }

        public async Task<DocumentDto?> GetDocumentByIdAsync(Guid id)
        {
            var doc = await _documentRepository.GetByIdAsync(id);
            return doc == null ? null : MapToDto(doc);
        }

        public async Task<Guid> CreateDocumentAsync(string title, string content, string language, string fileType, long fileSize, string fileExtension)
        {
            var classification = fileType.ToLower() == "auto" ? AutoDetectClassification(content) : fileType.ToLower();

            var document = new LegalAnalyzer.Domain.Entities.Document
            {
                Id = Guid.NewGuid(),
                Title = title,
                Content = content,
                Language = language,
                Type = classification,
                FileExtension = fileExtension,
                Size = fileSize,
                UploadedAt = DateTime.UtcNow,
                Status = "Pending",
                ExtractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo() // <-- Fully qualified
            };

            await _documentRepository.AddAsync(document);
            return (await AnalyzeDocumentAsync(document.Id)).Id;
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

            var classification = request.FileType.ToLower() == "auto" ? AutoDetectClassification(request.Content) : request.FileType.ToLower();

            var document = new LegalAnalyzer.Domain.Entities.Document
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Content = request.Content,
                Language = request.Language ?? "en",
                Type = classification,
                FileExtension = request.FileExtension,
                Size = request.FileSize,
                UploadedAt = DateTime.UtcNow,
                Status = "Pending",
                ExtractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo() // Initialize non-nullable ExtractedInfo
            };

            await _documentRepository.AddAsync(document);
            await AnalyzeDocumentAsync(document.Id);
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

            document.Type = AutoDetectClassification(document.Content); 
            document.Status = "Analyzing";
            document.ExtractedInfo = ExtractInformation(document.Content);
            document.Status = "Analyzed";
            document.AnalysisResult = "Analysis completed successfully";
            document.AnalysisDuration = TimeSpan.FromSeconds(2);

            await _documentRepository.UpdateAsync(document);
            return MapToDto(document);
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

            document.Summary = "This is a summary of the document.";
            document.Status = "Summarized";
            await _documentRepository.UpdateAsync(document);

            return MapToDto(document);
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

                document.Type = AutoDetectClassification(document.Content);
                document.Status = "Analyzing";
                document.ExtractedInfo = ExtractInformation(document.Content);
                document.Status = "Analyzed";
                document.AnalysisResult = "Analysis completed successfully";
                document.AnalysisDuration = TimeSpan.FromSeconds(2);

                await _documentRepository.UpdateAsync(document);
                analysisResults.Add(MapToDto(document));
            }

            return analysisResults;
        }

        private string AutoDetectClassification(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return "other";

            content = content.ToLowerInvariant().Replace("\n", " ");

            var patterns = new Dictionary<string, string[]>
            {
                ["contract"] = new[]
                {
                    @"\bcontract\b",
                    @"\bagreement\b",
                    @"\bbetween\s+.*?\s+and\s+",
                    @"\bparties\b",
                    @"\bterms\s+and\s+conditions\b",
                    @"\bforce\s+majeure\b",
                    @"\bindemnification\b",
                    @"\bgoverning\s+law\b"
                },
                ["brief"] = new[]
                {
                    @"\bplaintiff\b",
                    @"\bdefendant\b",
                    @"\bstatement\s+of\s+facts\b",
                    @"\blegal\s+argument\b",
                    @"\bmemorandum\s+of\s+law\b",
                    @"\bmotion\s+to\s+(dismiss|suppress|compel)\b",
                    @"\bbrief\s+in\s+(support|opposition)\b"
                },
                ["regulation"] = new[]
                {
                    @"\bregulation\s+(no\.?\s*\d+|\d{4})\b",
                    @"\bact\s+(no\.?\s*\d+|\d{4})\b",
                    @"\blaw\s+(no\.?\s*\d+|\d{4})\b",
                    @"\bstatute\s+(no\.?\s*\d+|\d{4})\b",
                    @"\b\d+\s+u\.s\.c\.\s+§+\s*\d+\b",
                    @"\bsection\s+\d+(\([a-z0-9]+\))*\b",
                    @"\barticle\s+\d+(\([a-z0-9]+\))*\b",
                    @"\btitre\s+[ivx]+\b",
                    @"\bpublic\s+(notice|comment|disclosure|hearing)\b",
                    @"\bjudicial\s+review\b"
                },
                ["case-law"] = new[]
                {
                    @"\bcase\s+no\.?\s*\d{1,5}(-\d{1,5})?\b",
                    @"\b[0-9]+\s+f\.\s?[\d]+d\s+[0-9]+\b",
                    @"\bdecision\s+rendered\s+by\s+the\s+court\b",
                    @"\bholding\b",
                    @"\bdissenting\s+opinion\b",
                    @"\bprecedent\b",
                    @"\bjudgment\s+dated\s+\d{1,2}/\d{1,2}/\d{2,4}\b"
                }
            };


            var scores = new Dictionary<string, int>();
            foreach (var category in patterns.Keys)
            {
                int score = 0;
                foreach (var pattern in patterns[category])
                {
                    var matches = Regex.Matches(content, pattern, RegexOptions.IgnoreCase);
                    score += matches.Count;
                }
                // Boost contract score for key terms
                if (category == "contract" && Regex.IsMatch(content, @"\bcontract\b|\bagreement\b|\bbetween\b"))
                {
                    score += 5; // Increase weight for definitive contract terms
                }
                scores[category] = score;
            }

            var bestMatch = scores.OrderByDescending(kvp => kvp.Value).First();
            return bestMatch.Value > 0 ? bestMatch.Key : "other";
        }

        private LegalAnalyzer.Domain.Entities.ExtractedInfo ExtractInformation(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return new LegalAnalyzer.Domain.Entities.ExtractedInfo
                {
                    Parties = new List<LegalAnalyzer.Domain.Entities.Party>(),
                    KeyDates = new List<LegalAnalyzer.Domain.Entities.KeyDate>(),
                    FinancialTerms = new List<LegalAnalyzer.Domain.Entities.FinancialTerm>(),
                    RiskAssessment = new LegalAnalyzer.Domain.Entities.RiskAssessment
                    {
                        Overall = "Unknown",
                        Factors = new List<LegalAnalyzer.Domain.Entities.RiskFactor>()
                    }
                };
            }

            content = content.Replace("\n", " ").Trim();

            var extractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo
            {
                Parties = ExtractParties(content),
                KeyDates = ExtractKeyDates(content),
                FinancialTerms = ExtractFinancialTerms(content),
                RiskAssessment = ExtractRiskAssessment(content)
            };

            return extractedInfo;
        }

        private List<LegalAnalyzer.Domain.Entities.Party> ExtractParties(string content)
        {
            var parties = new List<LegalAnalyzer.Domain.Entities.Party>();
            
            try 
            {
                // Simplified pattern that looks for "BETWEEN" and "AND" patterns
                var partyPattern = @"BETWEEN:(.*?)(?:AND\s+([A-Z][A-Za-z\s.,-]+))";
                var matches = Regex.Matches(content, partyPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);

                foreach (Match match in matches)
                {
                    if (match.Groups.Count >= 2)
                    {
                        var betweenSection = match.Groups[1].Value.Trim();
                        var andSection = match.Groups.Count > 2 ? match.Groups[2].Value.Trim() : string.Empty;

                        // Process first party (from BETWEEN section)
                        if (!string.IsNullOrEmpty(betweenSection))
                        {
                            var nameMatch = Regex.Match(betweenSection, @"[A-Z][A-Za-z\s.,-]+");
                            if (nameMatch.Success)
                            {
                                parties.Add(CreateParty(nameMatch.Value, betweenSection));
                            }
                        }

                        // Process second party (from AND section)
                        if (!string.IsNullOrEmpty(andSection))
                        {
                            var nameMatch = Regex.Match(andSection, @"[A-Z][A-Za-z\s.,-]+");
                            if (nameMatch.Success)
                            {
                                parties.Add(CreateParty(nameMatch.Value, andSection));
                            }
                        }
                    }
                }
            }
            catch (RegexParseException ex)
            {
                _logger.LogError(ex, "Invalid regex pattern when extracting parties");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting parties");
            }

            return parties;
        }

        private LegalAnalyzer.Domain.Entities.Party CreateParty(string name, string context)
        {
            return new LegalAnalyzer.Domain.Entities.Party
            {
                Name = name.Trim(',', ' '),
                Role = context.Contains("Employer") ? "Employer" : 
                    context.Contains("Employee") ? "Employee" : "Party",
                Type = context.Contains("corporation") || context.Contains("Enterprise") ? 
                    "Organization" : "Individual"
            };
        }

        private List<LegalAnalyzer.Domain.Entities.KeyDate> ExtractKeyDates(string content)
        {
            var dates = new List<LegalAnalyzer.Domain.Entities.KeyDate>();
            var datePattern = @"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b";
            var matches = Regex.Matches(content, datePattern, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                dates.Add(new LegalAnalyzer.Domain.Entities.KeyDate
                {
                    Date = match.Groups[1].Value.Trim(),
                    Description = "Key date mentioned in the document"
                });
            }

            return dates;
        }

        private List<LegalAnalyzer.Domain.Entities.FinancialTerm> ExtractFinancialTerms(string content)
        {
            var terms = new List<LegalAnalyzer.Domain.Entities.FinancialTerm>();
            var financialPattern = @"\b(Salary|Payment|Fee|Compensation|Deposit|Amount)\s*[:]?[^$]*(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)";
            var matches = Regex.Matches(content, financialPattern, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                terms.Add(new LegalAnalyzer.Domain.Entities.FinancialTerm
                {
                    Term = match.Groups[1].Value.Trim(),
                    Amount = match.Groups[2].Value.Trim()
                });
            }

            return terms;
        }

        private LegalAnalyzer.Domain.Entities.RiskAssessment ExtractRiskAssessment(string content)
        {
            var riskFactors = new List<LegalAnalyzer.Domain.Entities.RiskFactor>();
            var overallRisk = "Low"; // Default value

            // Heuristic-based risk assessment
            if (content.Contains("Confidential Information"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Medium",
                    Factor = "Presence of confidential information"
                });
            }
            if (content.Contains("Termination"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Medium",
                    Factor = "Termination clauses present"
                });
            }
            if (content.Contains("Indemnification"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "High",
                    Factor = "Indemnification obligations"
                });
            }

            // Adjust overall risk based on factors
            if (riskFactors.Any(f => f.Risk == "High"))
            {
                overallRisk = "High";
            }
            else if (riskFactors.Any(f => f.Risk == "Medium"))
            {
                overallRisk = "Medium";
            }
            else if (riskFactors.Any())
            {
                overallRisk = "Low";
            }

            return new LegalAnalyzer.Domain.Entities.RiskAssessment
            {
                Overall = overallRisk,
                Factors = riskFactors
            };
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
                    RiskAssessment = document.ExtractedInfo.RiskAssessment != null ? new LegalAnalyzer.Application.DTOs.RiskAssessment
                    {
                        Overall = document.ExtractedInfo.RiskAssessment.Overall,
                        Factors = document.ExtractedInfo.RiskAssessment.Factors.Select(f => new LegalAnalyzer.Application.DTOs.RiskFactor
                        {
                            Risk = f.Risk,
                            Factor = f.Factor
                        }).ToList()
                    } : null
                }
            };
        }
    }
}