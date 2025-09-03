// LegalAnalyzer.Application/Services/DocumentService.cs - Enhanced with microservice integration
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
        private readonly ILegalAnalysisService? _legalAnalysisService;

        public DocumentService(
            IDocumentRepository documentRepository, 
            ILogger<DocumentService> logger,
            ILegalAnalysisService? legalAnalysisService = null)
        {
            _documentRepository = documentRepository;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _legalAnalysisService = legalAnalysisService;
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
            var classification = fileType.ToLower() == "auto" ? AutoDetectClassification(content) : MapClassificationType(fileType.ToLower());

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
                ExtractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo()
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

            var classification = request.FileType.ToLower() == "auto" ? AutoDetectClassification(request.Content) : MapClassificationType(request.FileType.ToLower());

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
                ExtractedInfo = new LegalAnalyzer.Domain.Entities.ExtractedInfo()
            };

            await _documentRepository.AddAsync(document);
            await AnalyzeDocumentAsync(document.Id);
        }

        public async Task<DocumentDto> AnalyzeDocumentWithFallbackAsync(Guid id, bool useAdvancedAnalysis = true)
        {
            if (useAdvancedAnalysis && _legalAnalysisService != null)
            {
                try
                {
                    _logger.LogInformation("Attempting advanced analysis for document {DocumentId}", id);
                    return await _legalAnalysisService.AnalyzeDocumentByIdAsync(id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Advanced analysis failed for document {DocumentId}, falling back to basic analysis", id);
                }
            }

            _logger.LogInformation("Using basic analysis for document {DocumentId}", id);
            return await AnalyzeDocumentAsync(id);
        }

        public async Task<DocumentDto> AnalyzeDocumentAsync(Guid id)
        {
            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
            {
                throw new KeyNotFoundException("Document not found");
            }

            if (document.Status != "Pending" && document.Status != "Error")
            {
                throw new InvalidOperationException("Document is not in a state that can be analyzed.");
            }

            try
            {
                _logger.LogInformation("Starting basic analysis for document {DocumentId}", id);
                
                document.Type = AutoDetectClassification(document.Content);
                document.Status = "Analyzing";

                var startTime = DateTime.UtcNow;
                document.ExtractedInfo = ExtractInformation(document.Content);
                var endTime = DateTime.UtcNow;

                document.Status = "Analyzed";
                document.AnalysisResult = "Basic analysis completed successfully";
                document.AnalysisDuration = endTime - startTime;
                document.Summary = GenerateBasicSummary(document.Content, document.Type);

                await _documentRepository.UpdateAsync(document);
                
                _logger.LogInformation("Completed basic analysis for document {DocumentId}", id);
                return MapToDto(document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Analysis failed for document {DocumentId}", id);
                document.Status = "Error";
                document.ErrorMessage = ex.Message;
                await _documentRepository.UpdateAsync(document);
                throw;
            }
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

            // Enhanced summary generation
            document.Summary = GenerateAdvancedSummary(document.Content, document.Type);
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
                if (document.Status == "Pending" || document.Status == "Error")
                {
                    try
                    {
                        var result = await AnalyzeDocumentAsync(document.Id);
                        analysisResults.Add(result);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to analyze document {DocumentId}", document.Id);
                        // Continue with other documents
                    }
                }
            }

            return analysisResults;
        }

        // Enhanced classification with mapping to microservice types
        private string MapClassificationType(string type)
        {
            return type switch
            {
                "case-law" => "case_law",
                "case_law" => "case_law", 
                _ => type
            };
        }

        // Enhanced auto-detection
        private string AutoDetectClassification(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return "other";
            
            content = content.ToLowerInvariant().Replace("\n", " ");

            var patterns = new Dictionary<string, (string[] keywords, int weight)>
            {
                ["contract"] = (new[]
                {
                    @"\bcontract\b", @"\bagreement\b", @"\bbetween\s+.*?\s+and\s+",
                    @"\bparties\b", @"\bterms\s+and\s+conditions\b", @"\bforce\s+majeure\b",
                    @"\bindemnification\b", @"\bgoverning\s+law\b", @"\bwhereas\b",
                    @"\bconsideration\b", @"\btermination\b", @"\bbreach\b"
                }, 1),
                
                ["brief"] = (new[]
                {
                    @"\bplaintiff\b", @"\bdefendant\b", @"\bstatement\s+of\s+facts\b",
                    @"\blegal\s+argument\b", @"\bmemorandum\s+of\s+law\b",
                    @"\bmotion\s+to\s+(dismiss|suppress|compel)\b", @"\bbrief\s+in\s+(support|opposition)\b",
                    @"\brespectfully\s+submits\b", @"\bhonor(able)?\s+court\b"
                }, 1),
                
                ["regulation"] = (new[]
                {
                    @"\bregulation\s+(no\.?\s*\d+|\d{4})\b", @"\bact\s+(no\.?\s*\d+|\d{4})\b",
                    @"\blaw\s+(no\.?\s*\d+|\d{4})\b", @"\bstatute\s+(no\.?\s*\d+|\d{4})\b",
                    @"\b\d+\s+u\.s\.c\.\s+§+\s*\d+\b", @"\bsection\s+\d+(\([a-z0-9]+\))*\b",
                    @"\bcfr\b", @"\bfederal\s+register\b", @"\bcompliance\b"
                }, 1),
                
                ["case_law"] = (new[]
                {
                    @"\bcase\s+no\.?\s*\d{1,5}(-\d{1,5})?\b", @"\b[0-9]+\s+f\.\s?[\d]+d\s+[0-9]+\b",
                    @"\bdecision\s+rendered\s+by\s+the\s+court\b", @"\bholding\b",
                    @"\bdissenting\s+opinion\b", @"\bprecedent\b", @"\bv\.\b", @"\bversus\b",
                    @"\bcourt\s+held\b", @"\bopinion\s+of\s+the\s+court\b", @"\bjudgment\b"
                }, 1)
            };

            var scores = new Dictionary<string, double>();
            
            foreach (var (category, (keywords, weight)) in patterns)
            {
                double score = 0;
                foreach (var pattern in keywords)
                {
                    try
                    {
                        var matches = Regex.Matches(content, pattern, RegexOptions.IgnoreCase);
                        score += matches.Count * weight;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error in pattern matching for category {Category}", category);
                    }
                }

                // Apply bonus scoring for strong indicators
                if (category == "contract" && (content.Contains("agreement") || content.Contains("contract")))
                {
                    score += 5;
                }
                else if (category == "brief" && content.Contains("honorable court"))
                {
                    score += 5;
                }
                else if (category == "case_law" && Regex.IsMatch(content, @"\b\w+\s+v\.\s+\w+\b"))
                {
                    score += 5;
                }

                scores[category] = score;
            }

            var bestMatch = scores.OrderByDescending(kvp => kvp.Value).FirstOrDefault();
            return bestMatch.Value > 0 ? bestMatch.Key : "other";
        }

        // Enhanced information extraction
        private LegalAnalyzer.Domain.Entities.ExtractedInfo ExtractInformation(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return CreateEmptyExtractedInfo();
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

        private LegalAnalyzer.Domain.Entities.ExtractedInfo CreateEmptyExtractedInfo()
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

        // Enhanced party extraction
        private List<LegalAnalyzer.Domain.Entities.Party> ExtractParties(string content)
        {
            var parties = new List<LegalAnalyzer.Domain.Entities.Party>();
            
            try
            {
                // Multiple patterns for better party extraction
                var patterns = new[]
                {
                    @"BETWEEN:(.*?)(?:AND\s+([A-Z][A-Za-z\s.,-]+))",
                    @"(?:plaintiff|defendant|petitioner|respondent)(?:,\s+)?([A-Z][A-Za-z\s.,-]+)",
                    @"([A-Z][A-Za-z\s&]+(?:Corporation|Company|LLC|Inc|Ltd|Co)\.?)",
                    @"(?:party|parties)(?:\s+of\s+the\s+first\s+part)?(?:,\s+)?([A-Z][A-Za-z\s.,-]+)"
                };

                foreach (var pattern in patterns)
                {
                    var matches = Regex.Matches(content, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    foreach (Match match in matches)
                    {
                        if (match.Groups.Count >= 2)
                        {
                            for (int i = 1; i < match.Groups.Count; i++)
                            {
                                var groupValue = match.Groups[i].Value.Trim();
                                if (!string.IsNullOrEmpty(groupValue))
                                {
                                    parties.Add(CreateParty(groupValue, match.Value));
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting parties from content");
            }

            return parties.DistinctBy(p => p.Name).Take(10).ToList();
        }

        private LegalAnalyzer.Domain.Entities.Party CreateParty(string name, string context)
        {
            name = name.Trim(',', ' ', '"', '\'');
            
            return new LegalAnalyzer.Domain.Entities.Party
            {
                Name = name,
                Role = DeterminePartyRole(context),
                Type = DeterminePartyType(name, context)
            };
        }

        private string DeterminePartyRole(string context)
        {
            var contextLower = context.ToLower();
            if (contextLower.Contains("plaintiff") || contextLower.Contains("petitioner")) return "Plaintiff";
            if (contextLower.Contains("defendant") || contextLower.Contains("respondent")) return "Defendant";
            if (contextLower.Contains("employer")) return "Employer";
            if (contextLower.Contains("employee")) return "Employee";
            if (contextLower.Contains("buyer") || contextLower.Contains("purchaser")) return "Buyer";
            if (contextLower.Contains("seller") || contextLower.Contains("vendor")) return "Seller";
            if (contextLower.Contains("lessor") || contextLower.Contains("landlord")) return "Lessor";
            if (contextLower.Contains("lessee") || contextLower.Contains("tenant")) return "Lessee";
            return "Party";
        }

        private string DeterminePartyType(string name, string context)
        {
            var nameLower = name.ToLower();
            var contextLower = context.ToLower();
            
            if (nameLower.Contains("corporation") || nameLower.Contains("company") || 
                nameLower.Contains("llc") || nameLower.Contains("inc") || 
                nameLower.Contains("ltd") || nameLower.Contains("co.") ||
                contextLower.Contains("corporation") || contextLower.Contains("enterprise"))
                return "Organization";
            
            if (contextLower.Contains("government") || contextLower.Contains("state") || 
                contextLower.Contains("federal") || contextLower.Contains("agency"))
                return "Government";
                
            return "Individual";
        }

        private List<LegalAnalyzer.Domain.Entities.KeyDate> ExtractKeyDates(string content)
        {
            var dates = new List<LegalAnalyzer.Domain.Entities.KeyDate>();
            
            var datePatterns = new[]
            {
                (@"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b", "Full Date"),
                (@"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", "Numeric Date"),
                (@"\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b", "Month Year"),
                (@"(?:effective|start|commencement|termination|expiration|execution)\s+date:?\s*([^\n,]{5,30})", "Specific Date Type")
            };

            foreach (var (pattern, dateType) in datePatterns)
            {
                try
                {
                    var matches = Regex.Matches(content, pattern, RegexOptions.IgnoreCase);
                    foreach (Match match in matches)
                    {
                        var dateValue = match.Groups[1].Value.Trim();
                        if (!string.IsNullOrEmpty(dateValue) && dateValue.Length > 3)
                        {
                            dates.Add(new LegalAnalyzer.Domain.Entities.KeyDate
                            {
                                Date = dateValue,
                                Description = $"{dateType} mentioned in document"
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error extracting dates with pattern: {Pattern}", pattern);
                }
            }

            return dates.DistinctBy(d => d.Date).Take(10).ToList();
        }

        private List<LegalAnalyzer.Domain.Entities.FinancialTerm> ExtractFinancialTerms(string content)
        {
            var terms = new List<LegalAnalyzer.Domain.Entities.FinancialTerm>();
            
            var financialPatterns = new[]
            {
                (@"\b(Salary|Payment|Fee|Compensation|Deposit|Amount|Cost|Price|Fine|Penalty)\s*[:]?[^$]*(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)", "Monetary Amount"),
                (@"(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(per|annually|monthly|yearly|daily|hourly)", "Recurring Payment"),
                (@"\b(\d+(?:\.\d{2})?)\s*percent|\b(\d+(?:\.\d{2})?)%", "Percentage"),
                (@"\b(interest\s+rate|apr|annual\s+percentage\s+rate)\s*[:]?\s*(\d+(?:\.\d{2})?%?)", "Interest Rate")
            };

            foreach (var (pattern, termType) in financialPatterns)
            {
                try
                {
                    var matches = Regex.Matches(content, pattern, RegexOptions.IgnoreCase);
                    foreach (Match match in matches)
                    {
                        var term = match.Groups[1].Value.Trim();
                        var amount = match.Groups.Count > 2 ? match.Groups[2].Value.Trim() : match.Groups[1].Value.Trim();
                        
                        if (!string.IsNullOrEmpty(term) && !string.IsNullOrEmpty(amount))
                        {
                            terms.Add(new LegalAnalyzer.Domain.Entities.FinancialTerm
                            {
                                Term = string.IsNullOrEmpty(term) ? termType : term,
                                Amount = amount
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error extracting financial terms with pattern: {Pattern}", pattern);
                }
            }

            return terms.DistinctBy(t => new { t.Term, t.Amount }).Take(15).ToList();
        }

        private LegalAnalyzer.Domain.Entities.RiskAssessment ExtractRiskAssessment(string content)
        {
            var riskFactors = new List<LegalAnalyzer.Domain.Entities.RiskFactor>();
            var contentLower = content.ToLower();

            // Define risk indicators with their risk levels
            var riskIndicators = new Dictionary<string, (string level, string description)>
            {
                ["confidential"] = ("Medium", "Contains confidential information clauses"),
                ["indemnification"] = ("High", "Contains indemnification obligations"),
                ["termination"] = ("Medium", "Contains termination clauses"),
                ["penalty"] = ("Medium", "Contains penalty provisions"),
                ["breach"] = ("High", "References breach conditions"),
                ["liability"] = ("High", "Contains liability provisions"),
                ["dispute"] = ("Medium", "Contains dispute resolution clauses"),
                ["arbitration"] = ("Medium", "Requires arbitration for disputes"),
                ["non-compete"] = ("High", "Contains non-compete restrictions"),
                ["intellectual property"] = ("Medium", "Contains IP provisions"),
                ["force majeure"] = ("Low", "Contains force majeure clauses"),
                ["warranty"] = ("Medium", "Contains warranty provisions"),
                ["damages"] = ("High", "References damages or compensation"),
                ["criminal"] = ("High", "Contains references to criminal matters"),
                ["regulatory"] = ("Medium", "Subject to regulatory requirements")
            };

            foreach (var (keyword, (level, description)) in riskIndicators)
            {
                if (contentLower.Contains(keyword))
                {
                    riskFactors.Add(new LegalAnalyzer.Domain.Entities.RiskFactor
                    {
                        Risk = level,
                        Factor = description
                    });
                }
            }

            // Determine overall risk based on factors
            string overallRisk = "Low";
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

        private string GenerateBasicSummary(string content, string? documentType)
        {
            if (string.IsNullOrWhiteSpace(content))
                return "No content available for summary.";

            try
            {
                var sentences = content.Split(new[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
                                      .Select(s => s.Trim())
                                      .Where(s => s.Length > 20 && s.Length < 500)
                                      .Take(20)
                                      .ToList();

                if (!sentences.Any())
                    return content.Length > 200 ? content.Substring(0, 200) + "..." : content;

                // Select key sentences based on document type
                var keyWords = GetKeyWordsForDocumentType(documentType);
                var scoredSentences = sentences.Select(s => new
                {
                    Sentence = s,
                    Score = keyWords.Sum(kw => s.ToLower().Contains(kw) ? 1 : 0)
                }).OrderByDescending(s => s.Score).Take(3).Select(s => s.Sentence);

                var summary = string.Join(". ", scoredSentences);
                return summary.Length > 500 ? summary.Substring(0, 500) + "..." : summary + ".";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating basic summary for document type: {DocumentType}", documentType);
                return content.Length > 200 ? content.Substring(0, 200) + "..." : content;
            }
        }

        private string GenerateAdvancedSummary(string content, string? documentType)
        {
            // This could be enhanced with more sophisticated NLP techniques
            var basicSummary = GenerateBasicSummary(content, documentType);
            
            // Add document type specific context
            var prefix = documentType switch
            {
                "contract" => "Contract Summary: ",
                "brief" => "Legal Brief Summary: ",
                "case_law" => "Case Law Summary: ",
                "regulation" => "Regulation Summary: ",
                _ => "Document Summary: "
            };

            return prefix + basicSummary;
        }

        private string[] GetKeyWordsForDocumentType(string? documentType)
        {
            return documentType switch
            {
                "contract" => new[] { "agreement", "party", "term", "obligation", "payment", "termination" },
                "brief" => new[] { "court", "plaintiff", "defendant", "argument", "relief", "motion" },
                "case_law" => new[] { "held", "court", "opinion", "precedent", "ruling", "judgment" },
                "regulation" => new[] { "section", "requirement", "compliance", "penalty", "violation", "standard" },
                _ => new[] { "important", "significant", "key", "main", "primary", "essential" }
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