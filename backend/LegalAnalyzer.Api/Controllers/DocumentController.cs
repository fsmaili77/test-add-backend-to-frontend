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
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace LegalAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly ILogger<DocumentController> _logger;
        private readonly HttpClient _httpClient;

        public DocumentController(IDocumentService documentService, ILogger<DocumentController> logger, HttpClient httpClient)
        {
            _documentService = documentService;
            _logger = logger;
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://localhost:8000/");
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
                request.FileSize,
                request.FileExtension
            );
            var doc = await _documentService.GetDocumentByIdAsync(id);
            return CreatedAtAction(nameof(GetById), new { id }, doc);
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

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(
            [FromForm] string title,
            [FromForm] string language,
            [FromForm] string classification,
            [FromForm] bool enableOCR,
            [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0 || string.IsNullOrEmpty(title))
            {
                return BadRequest("Invalid document data.");
            }

            var validClassifications = new[] { "auto", "contract", "brief", "regulation", "case-law", "other" };
            if (!validClassifications.Contains(classification.ToLower()))
            {
                return BadRequest("Invalid classification type.");
            }

            string fileExtension = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
            string content = "";

            string tempFilePath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.{fileExtension}");
            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                {
                    await file.CopyToAsync(stream);
                }

                switch (fileExtension)
                {
                    case "pdf":
                        content = enableOCR ? await ExtractTextFromPdfWithOCR(tempFilePath, file.FileName) : ExtractTextFromPdf(tempFilePath);
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
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                }
            }

            var fileSize = file.Length;

            var id = await _documentService.CreateDocumentAsync(
                title: title,
                content: content,
                language: language,
                fileType: classification.ToLower(),
                fileSize: fileSize,
                fileExtension: fileExtension
            );

            var doc = await _documentService.GetDocumentByIdAsync(id);
            return CreatedAtAction(nameof(GetById), new { id }, doc);
        }

        [HttpPost("batch-upload")]
        public async Task<IActionResult> BatchUploadDocuments(
            [FromForm] List<IFormFile> files,
            [FromForm] List<string> titles,
            [FromForm] List<string> languages,
            [FromForm] List<string> classifications,
            [FromForm] bool enableOCR)
        {
            if (files == null || !files.Any() || titles == null || languages == null || classifications == null ||
                files.Count != titles.Count || files.Count != languages.Count || files.Count != classifications.Count)
            {
                return BadRequest("Files, titles, languages, and classifications must be provided and have the same count.");
            }

            var validClassifications = new[] { "auto", "contract", "brief", "regulation", "case-law", "other" };
            var ids = new List<Guid>();
            var errors = new List<string>();

            for (int i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var title = titles[i];
                var language = languages[i];
                var classification = classifications[i];

                if (file == null || file.Length == 0 || string.IsNullOrEmpty(title))
                {
                    errors.Add($"Skipped file {i + 1}: Invalid file or title");
                    continue;
                }

                if (!validClassifications.Contains(classification.ToLower()))
                {
                    errors.Add($"Skipped file {i + 1} ({file.FileName}): Invalid classification type");
                    continue;
                }

                string fileExtension = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
                string content = "";

                string tempFilePath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.{fileExtension}");
                try
                {
                    using (var stream = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                    {
                        await file.CopyToAsync(stream);
                    }

                    switch (fileExtension)
                    {
                        case "pdf":
                            content = enableOCR ? await ExtractTextFromPdfWithOCR(tempFilePath, file.FileName) : ExtractTextFromPdf(tempFilePath);
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
                    if (System.IO.File.Exists(tempFilePath))
                    {
                        System.IO.File.Delete(tempFilePath);
                    }
                }

                try
                {
                    var fileSize = file.Length;
                    var id = await _documentService.CreateDocumentAsync(
                        title: title,
                        content: content,
                        language: language,
                        fileType: classification.ToLower(),
                        fileSize: fileSize,
                        fileExtension: fileExtension
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

        private string ExtractTextFromPdf(string filePath)
        {
            var sb = new StringBuilder();
            using (var pdf = UglyToad.PdfPig.PdfDocument.Open(filePath))
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
            return sb.ToString().Trim();
        }

        private async Task<string> ExtractTextFromPdfWithOCR(string filePath, string originalFileName)
        {
            try
            {
                _logger.LogInformation("Starting OCR for {FilePath}", filePath);

                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                using (var content = new MultipartFormDataContent())
                {
                    content.Add(new StreamContent(stream), "file", originalFileName);
                    var response = await _httpClient.PostAsync("extract-text", content);
                    response.EnsureSuccessStatusCode();
                    var result = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
                    _logger.LogInformation("Completed OCR for {FilePath}", filePath);
                    return result?["text"] ?? "[OCR Error: No text returned]";
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "OCR service request failed for {FilePath}", filePath);
                return $"OCR Error: Service request failed - {ex.Message}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OCR failed for {FilePath}", filePath);
                return $"OCR Error: {ex.Message}";
            }
        }

        private string ExtractTextFromDocx(string filePath)
        {
            try
            {
                _logger.LogInformation("Extracting text from DOCX: {FilePath}", filePath);
                var sb = new StringBuilder();
                using (var doc = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(filePath, false))
                {
                    var body = doc.MainDocumentPart.Document.Body;
                    foreach (var element in body.Elements())
                    {
                        if (element is DocumentFormat.OpenXml.Wordprocessing.Paragraph paragraph)
                        {
                            var style = paragraph.ParagraphProperties?.ParagraphStyleId?.Val?.Value;
                            var text = paragraph.InnerText.Trim();
                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                if (style != null && style.ToLower().Contains("heading"))
                                {
                                    sb.AppendLine();
                                    sb.AppendLine($"## {text}");
                                    sb.AppendLine();
                                }
                                else
                                {
                                    sb.AppendLine(text);
                                }
                            }
                        }
                        else if (element is DocumentFormat.OpenXml.Wordprocessing.Table table)
                        {
                            sb.AppendLine("\n[TABLE START]");
                            foreach (var row in table.Elements<DocumentFormat.OpenXml.Wordprocessing.TableRow>())
                            {
                                foreach (var cell in row.Elements<DocumentFormat.OpenXml.Wordprocessing.TableCell>())
                                {
                                    var cellText = string.Join(" ", cell.Descendants<DocumentFormat.OpenXml.Wordprocessing.Text>().Select(t => t.Text));
                                    sb.Append(cellText + "\t");
                                }
                                sb.AppendLine();
                            }
                            sb.AppendLine("[TABLE END]\n");
                        }
                    }
                }
                var result = sb.ToString().Trim();
                if (string.IsNullOrWhiteSpace(result))
                {
                    _logger.LogWarning("No text extracted from DOCX: {FilePath}", filePath);
                    return "[DOCX Error: No text extracted]";
                }
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract text from DOCX: {FilePath}", filePath);
                return $"DOCX Error: {ex.Message}";
            }
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

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeAllDocuments()
        {
            var analysisResults = await _documentService.AnalyzeAllDocumentsAsync();
            return Ok(analysisResults);
        }

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