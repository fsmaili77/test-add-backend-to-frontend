using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LegalAnalyzer.Domain.Entities
{
    public class Document
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending"; // e.g., Pending, Analyzed, Error
        public string? Type { get; set; } // Classification type: auto, contract, brief, regulation, case-law, other
        public string? FileExtension { get; set; } // File type: pdf, docx, txt
        public long? Size { get; set; } // For file size in bytes
        public int? AnalysisProgress { get; set; } // If you need progress tracking        
        public TimeSpan? AnalysisDuration { get; set; } // Duration of the analysis process
        public string? AnalysisResult { get; set; } // For storing the result of the analysis, if applicable
        public string? Summary { get; set; } // For storing the summary of the document, if applicable
        public string? ErrorMessage { get; set; } // For storing any error messages during analysis
        public ICollection<DocumentTag> Tags { get; set; } = new List<DocumentTag>(); // e.g., ["Contract", "Lease", "Commercial"]
        public ICollection<DocumentKeyword> Keywords { get; set; } = new List<DocumentKeyword>();
        public ExtractedInfo ExtractedInfo { get; set; } = new ExtractedInfo(); // Non-nullable, initialized
    }

    public class DocumentTag
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid DocumentId { get; set; } // Foreign key to Document
    }

    public class DocumentKeyword
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public Guid DocumentId { get; set; } // Foreign key to Document
    }

    public class ExtractedInfo
    {
        public List<Party> Parties { get; set; } = new List<Party>();
        public List<KeyDate> KeyDates { get; set; } = new List<KeyDate>();
        public List<FinancialTerm> FinancialTerms { get; set; } = new List<FinancialTerm>();
        public RiskAssessment? RiskAssessment { get; set; }
    }

    public class Party
    {
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class KeyDate
    {
        public string Date { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class FinancialTerm
    {
        public string Term { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
    }

    public class RiskAssessment
    {
        public string Overall { get; set; } = string.Empty;
        public List<RiskFactor> Factors { get; set; } = new List<RiskFactor>();
    }

    public class RiskFactor
    {
        public string Risk { get; set; } = string.Empty;
        public string Factor { get; set; } = string.Empty;
    }
}