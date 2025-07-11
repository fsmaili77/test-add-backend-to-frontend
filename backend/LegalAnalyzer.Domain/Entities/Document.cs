using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LegalAnalyzer.Domain.Entities
{
    public class Document
    {

        /* // Mock document data from the  frontend which would typically be fetched from a database or an API.
        This is a sample document structure that might be used in a legal document analysis application.
const mockDocuments = [
  {
    id: 1,
    name: "Commercial Lease Agreement - Downtown Office.pdf",
    type: "Contract",
    size: "2.4 MB",
    pages: 12,
    uploadDate: "2024-01-15",
    status: "Analyzed",
    content: `COMMERCIAL LEASE AGREEMENT
        */
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending"; // e.g., Pending, Analyzed, Error
        public string? Type { get; set; } // For document type
        public long? Size { get; set; } // For file size in bytes
        public int? AnalysisProgress { get; set; } // If you need progress tracking        
        public TimeSpan? AnalysisDuration { get; set; } // Duration of the analysis process
        public string? AnalysisResult { get; set; } // For storing the result of the analysis, if applicable
        public string? Summary { get; set; } // For storing the summary of the document, if applicable
        public ICollection<DocumentTag> Tags { get; set; } = new List<DocumentTag>(); // e.g., ["Contract", "Lease", "Commercial"]
        public ICollection<DocumentKeyword> Keywords { get; set; } = new List<DocumentKeyword>();
        public string? ErrorMessage { get; set; } // For storing any error messages during analysis        public string? Summary { get; set; } // For storing the summary of the document, if applicable

    }

    public class DocumentTag
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid DocumentId { get; set; }
        public Document Document { get; set; } = null!;
    }

    public class DocumentKeyword
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public Guid DocumentId { get; set; }
        public Document Document { get; set; } = null!;
    }
}