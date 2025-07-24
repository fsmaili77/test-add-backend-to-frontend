using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LegalAnalyzer.Application.Requests
{
    public class CreateDocumentRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public string FileType { get; set; } = string.Empty;
        public string Classification { get; set; } = string.Empty; // Classification type (auto, contract, brief, regulation, case-law, other)
        public long FileSize { get; set; }
        public string FileExtension { get; set; } = string.Empty; // File type (pdf, docx, txt)
    
    }
}