using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LegalAnalyzer.Application.DTOs
{
    public class DocumentDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public string Status { get; set; } = "Pending"; // e.g., Pending, Analyzed, Error        
        public List<TagDto> Tags { get; set; } = new List<TagDto>();
        public List<KeywordDto> Keywords { get; set; } = new List<KeywordDto>();
        public string? ErrorMessage { get; set; } // For storing any error messages during analysis
        public string? AnalysisResult { get; set; } // For storing the result of the analysis, if applicable
        public string? Summary { get; set; } // For storing the summary of the document, if applicable
    }

    public class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class KeywordDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
}
}