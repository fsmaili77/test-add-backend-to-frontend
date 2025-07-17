using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Application.Services;
using Microsoft.AspNetCore.Mvc;
using LegalAnalyzer.Application.Requests;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using Xceed.Words.NET; // For DocX

namespace LegalAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var docs = await _documentService.GetAllDocumentsAsync();
            return Ok(docs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var doc = await _documentService.GetDocumentByIdAsync(id);
            return doc is null ? NotFound() : Ok(doc);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDocumentRequest request)
        {
            var id = await _documentService.CreateDocumentAsync(
                request.Title,
                request.Content,
                request.Language,
                request.FileType,
                request.FileSize
                );
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request)
        {
            await _documentService.UpdateDocumentAsync(id, request.Title, request.Content, request.Language);
            return NoContent();
        }        

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _documentService.DeleteDocumentAsync(id);
            return NoContent();
        }

        // POST /api/documents/upload — Upload a document

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(
            [FromForm] string title,
            [FromForm] string language,
            [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0 || string.IsNullOrEmpty(title))
            {
                return BadRequest("Invalid document data.");
            }

            string fileType = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
            string content = "";

            var tempFilePath = Path.GetTempFileName();
            using (var stream = System.IO.File.Create(tempFilePath))
            {
                await file.CopyToAsync(stream);
            }

            try
            {
                switch (fileType)
                {
                    case "pdf":
                        content = ExtractTextFromPdf(tempFilePath);
                        break;
                    case "docx":
                        content = ExtractTextFromDocx(tempFilePath);
                        break;
                    case "txt":
                        content = await System.IO.File.ReadAllTextAsync(tempFilePath);
                        break;
                    default:
                        return BadRequest("Unsupported file type.");
                }

                content = PostProcessExtractedContent(content);
            }
            finally
            {
                System.IO.File.Delete(tempFilePath);
            }

            var fileSize = file.Length;

            var id = await _documentService.CreateDocumentAsync(
                title: title,
                content: content,
                language: language,
                fileType: fileType,
                fileSize: fileSize
            );

            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        private string ExtractTextFromPdf(string filePath)
        {
            var sb = new StringBuilder();
            
            using (var pdf = PdfDocument.Open(filePath))
            {
                foreach (var page in pdf.GetPages())
                {
                    var text = page.Text;
                    
                    text = Regex.Replace(text, @"(\n\s*)+\n", "\n\n");
                    text = Regex.Replace(text, @"(?<=\w)\s+(?=[A-Z][a-z])", "\n\n");
                    
                    sb.AppendLine(text);
                    sb.AppendLine();
                }
            }
            
            return sb.ToString();
        }

        private string ExtractTextFromDocx(string filePath)
        {
            var sb = new StringBuilder();
            
            using (var doc = DocX.Load(filePath))
            {
                foreach (var paragraph in doc.Paragraphs)
                {
                    // Simplified heading detection
                    if (paragraph.StyleName != null && paragraph.StyleName.ToLower().Contains("heading"))
                    {
                        sb.AppendLine();
                        sb.AppendLine($"## {paragraph.Text.Trim()}");
                        sb.AppendLine();
                    }
                    else if (paragraph.IsListItem)
                    {
                        sb.AppendLine($"• {paragraph.Text.Trim()}");
                    }
                    else
                    {
                        sb.AppendLine(paragraph.Text.Trim());
                    }
                }
                
                foreach (var table in doc.Tables)
                {
                    sb.AppendLine("\n[TABLE START]");
                    foreach (var row in table.Rows)
                    {
                        foreach (var cell in row.Cells)
                        {
                            sb.Append(cell.Paragraphs[0].Text + "\t");
                        }
                        sb.AppendLine();
                    }
                    sb.AppendLine("[TABLE END]\n");
                }
            }
            
            return sb.ToString();
        }

        private string PostProcessExtractedContent(string content)
        {
            content = Regex.Replace(content, @"(\r\n|\n\r|\n)+", "\n");
            content = Regex.Replace(content, @"(\d+\.)\s*([A-Z][A-Za-z ]+)", "\n\n$1 $2\n");
            content = Regex.Replace(content, @"\s+([.,;:!?])", "$1");
            content = Regex.Replace(content, @"([a-z])\- ([a-z])", "$1$2");
            content = Regex.Replace(content, @"(?<=\n)\s*•\s*", "• ");
            content = Regex.Replace(content, @"\n{3,}", "\n\n");
            
            return content.Trim();
        }  

        // POST /api/documents/batch-upload — Upload multiple documents
        [HttpPost("batch-upload")]
        public async Task<IActionResult> BatchUploadDocuments(
            [FromForm] List<IFormFile> files,
            [FromForm] List<string> titles,
            [FromForm] List<string> languages)
        {
            if (files == null || !files.Any() || titles == null || languages == null ||
                files.Count != titles.Count || files.Count != languages.Count)
            {
                return BadRequest("Files, titles, and languages must be provided and have the same count.");
            }

            var ids = new List<Guid>();
            var errors = new List<string>();

            for (int i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var title = titles[i];
                var language = languages[i];

                if (file == null || file.Length == 0 || string.IsNullOrEmpty(title))
                {
                    errors.Add($"Skipped file {i + 1}: Invalid file or title");
                    continue;
                }

                string fileType = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
                string content = "";

                var tempFilePath = Path.GetTempFileName();
                using (var stream = System.IO.File.Create(tempFilePath))
                {
                    await file.CopyToAsync(stream);
                }

                try
                {
                    switch (fileType)
                    {
                        case "pdf":
                            content = ExtractTextFromPdf(tempFilePath);
                            break;
                        case "docx":
                            content = ExtractTextFromDocx(tempFilePath);
                            break;
                        case "txt":
                            content = await System.IO.File.ReadAllTextAsync(tempFilePath);
                            break;
                        default:
                            errors.Add($"Skipped file {i + 1} ({file.FileName}): Unsupported file type");
                            continue;
                    }

                    content = PostProcessExtractedContent(content);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error processing file {i + 1} ({file.FileName}): {ex.Message}");
                    continue;
                }
                finally
                {
                    System.IO.File.Delete(tempFilePath);
                }

                try
                {
                    var fileSize = file.Length;
                    var id = await _documentService.CreateDocumentAsync(
                        title: title,
                        content: content,
                        language: language,
                        fileType: fileType,
                        fileSize: fileSize
                    );
                    ids.Add(id);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error saving document {i + 1} ({title}): {ex.Message}");
                }
            }

            var result = new
            {
                SuccessCount = ids.Count,
                ErrorCount = errors.Count,
                DocumentIds = ids,
                Errors = errors
            };

            return ids.Count > 0 
                ? CreatedAtAction(nameof(GetAll), new { ids }, result)
                : BadRequest(result);
        }


        // POST /api/documents/{id}/analyze — Analyze a specific document
        [HttpPost("{id}/analyze")]
        public async Task<IActionResult> AnalyzeDocumentById(Guid id)
        {
            try
            {
                var analysisResult = await _documentService.AnalyzeDocumentAsync(id);
                return Ok(analysisResult);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Document with id {id} not found.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        // POST /api/documents/analyze — Analyze all documents
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeAllDocuments()
        {
            var analysisResults = await _documentService.AnalyzeAllDocumentsAsync();
            return Ok(analysisResults);
        }
        // POST /api/documents/{id}/summarize — Summarize a specific document
        [HttpPost("{id}/summarize")]
        public async Task<IActionResult> SummarizeDocumentById(Guid id)
        {
            try
            {
                var summaryResult = await _documentService.SummarizeDocumentAsync(id);
                return Ok(summaryResult);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Document with id {id} not found.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }

}