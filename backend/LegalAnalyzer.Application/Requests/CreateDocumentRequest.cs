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
        public string FileType { get; set; } = "text/plain"; // Default file type
        public long FileSize { get; set; } = 0; // Default file size
    
    }
}