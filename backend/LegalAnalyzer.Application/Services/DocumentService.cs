using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Application.Requests;
using LegalAnalyzer.Domain.Entities;
using LegalAnalyzer.Domain.Repositories;
using System.Text.RegularExpressions;

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
            document.ExtractedInfo = ExtractInformation(document.Content);
            document.Status = "Analyzed";
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

                document.Status = "Analyzing";
                document.ExtractedInfo = ExtractInformation(document.Content);
                document.Status = "Analyzed";
                await _documentRepository.UpdateAsync(document);

                analysisResults.Add(MapToDto(document));
            }

            return analysisResults;
        }

        private string AutoDetectClassification(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return "other";

            content = content.ToLowerInvariant();

            var patterns = new Dictionary<string, string[]>
            {
                ["contract"] = new[]
                {
                    @"\bthis\s+agreement\b",
                    @"\bparty\s+of\s+the\s+first\s+part\b",
                    @"\bterms\s+and\s+conditions\b",
                    @"\bforce\s+majeure\b",
                    @"\bindemnification\b",
                    @"\btermination\s+clause\b",
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
                    @"\b(?:act|law|statute|code|regulation|ordinance|decree|directive|order)\s+(no\.?\s*\d+|\d{4}|\(.*?\))?",
                    @"\bthe\s+(?:[A-Z][a-z]+\s+){1,5}(Act|Law|Code|Statute|Regulation|Directive|Order)\b",
                    @"\b\d+\s+u\.s\.c\.\s+§+\s*\d+(\w+)?",
                    @"\bsection\s+\d+(\([a-z0-9]+\))*",
                    @"\barticle\s+\d+(\([a-z0-9]+\))*",
                    @"\btitre\s+[ivx]+\b",
                    @"\b(pursuant|subject)\s+to\s+(section|article)\s+\d+",
                    @"\bin\s+accordance\s+with\s+(section|law|article)\s+\d+",
                    @"\bshall\s+(not\s+)?(be|apply|include|constitute)\b",
                    @"\bthis\s+(act|regulation|code|law)\s+(applies|provides|establishes|defines)\b",
                    @"\bagency\s+(shall|must|may|is required to)\b",
                    @"\bjudicial\s+review\b",
                    @"\bpenalties?\s+(shall|may)\s+apply\b",
                    @"\bpublic\s+(notice|comment|disclosure|hearing)\b",
                    @"\b(exemptions?|rights?|obligations?)\s+(include|are)\b",
                    @"\b(conditions?|requirements?)\s+(for|under|of)\b"
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
            var partyPattern = @"(between\s+([A-Z][A-Za-z\s.,]+),\s*(a\s*[A-Za-z\s]+)\s*\((""[^""]+""),\s*and\s+([A-Z][A-Za-z\s.,]+),\s*(a\s*[A-Za-z\s]+)\s*\((""[^""]+"")\))";
            var matches = Regex.Matches(content, partyPattern, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                if (match.Groups.Count >= 8)
                {
                    parties.Add(new LegalAnalyzer.Domain.Entities.Party
                    {
                        Name = match.Groups[2].Value.Trim(),
                        Type = match.Groups[3].Value.Trim(),
                        Role = match.Groups[4].Value.Trim()
                    });
                    parties.Add(new LegalAnalyzer.Domain.Entities.Party
                    {
                        Name = match.Groups[5].Value.Trim(),
                        Type = match.Groups[6].Value.Trim(),
                        Role = match.Groups[7].Value.Trim()
                    });
                }
            }

            return parties;
        }

        private List<LegalAnalyzer.Domain.Entities.KeyDate> ExtractKeyDates(string content)
        {
            var dates = new List<LegalAnalyzer.Domain.Entities.KeyDate>();
            var datePattern = @"(\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b)([^.]+)";
            var matches = Regex.Matches(content, datePattern, RegexOptions.IgnoreCase);

            foreach (Match match in matches)
            {
                dates.Add(new LegalAnalyzer.Domain.Entities.KeyDate
                {
                    Date = match.Groups[1].Value.Trim(),
                    Description = match.Groups[2].Value.Trim()
                });
            }

            return dates;
        }

        private List<LegalAnalyzer.Domain.Entities.FinancialTerm> ExtractFinancialTerms(string content)
        {
            var terms = new List<LegalAnalyzer.Domain.Entities.FinancialTerm>();
            var financialPattern = @"(\b(?:Rent|Security\s+Deposit|Insurance\s+Coverage)\b)\s*:\s*[^$]*(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)";
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
            var overallRisk = "Medium"; // Default value

            // Simple heuristic-based risk assessment
            if (content.Contains("5 years") || content.Contains("five (5) years"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "High",
                    Factor = "Long-term commitment (5 years)"
                });
            }
            if (content.Contains("Security Deposit"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Medium",
                    Factor = "Security deposit amount"
                });
            }
            if (content.Contains("general office purposes"))
            {
                riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                {
                    Risk = "Low",
                    Factor = "Standard use restrictions"
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
                ExtractedInfo = document.ExtractedInfo != null ? new LegalAnalyzer.Application.DTOs.ExtractedInfo
                {
                    Parties = document.ExtractedInfo.Parties?.Select(p => new LegalAnalyzer.Application.DTOs.Party
                    {
                        Name = p.Name,
                        Role = p.Role,
                        Type = p.Type
                    }).ToList() ?? new List<LegalAnalyzer.Application.DTOs.Party>(),
                    KeyDates = document.ExtractedInfo.KeyDates?.Select(kd => new LegalAnalyzer.Application.DTOs.KeyDate
                    {
                        Date = kd.Date,
                        Description = kd.Description
                    }).ToList() ?? new List<LegalAnalyzer.Application.DTOs.KeyDate>(),
                    FinancialTerms = document.ExtractedInfo.FinancialTerms?.Select(ft => new LegalAnalyzer.Application.DTOs.FinancialTerm
                    {
                        Term = ft.Term,
                        Amount = ft.Amount
                    }).ToList() ?? new List<LegalAnalyzer.Application.DTOs.FinancialTerm>(),
                    RiskAssessment = document.ExtractedInfo.RiskAssessment != null ? new LegalAnalyzer.Application.DTOs.RiskAssessment
                    {
                        Overall = document.ExtractedInfo.RiskAssessment.Overall,
                        Factors = document.ExtractedInfo.RiskAssessment.Factors?.Select(f => new LegalAnalyzer.Application.DTOs.RiskFactor
                        {
                            Risk = f.Risk,
                            Factor = f.Factor
                        }).ToList() ?? new List<LegalAnalyzer.Application.DTOs.RiskFactor>()
                    } : null
                } : null
            };
        }
    }
}