using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LegalAnalyzer.Application.DTOs;
using LegalAnalyzer.Application.Services;
using Microsoft.AspNetCore.Mvc;
using LegalAnalyzer.Application.Requests;

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
                request.Title, request.Content, request.Language);
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

        // POST /api/documents — Upload a new document
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] CreateDocumentRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Content))
            {
                return BadRequest("Invalid document data.");
            }

            var id = await _documentService.CreateDocumentAsync(
                request.Title, request.Content, request.Language);
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        // POST /api/documents/batch — Upload multiple documents
        [HttpPost("batch")]
        public async Task<IActionResult> UploadDocuments([FromBody] List<CreateDocumentRequest> requests)
        {
            if (requests == null || !requests.Any())
            {
                return BadRequest("No documents provided.");
            }

            var ids = new List<Guid>();
            foreach (var request in requests)
            {
                var id = await _documentService.CreateDocumentAsync(
                    request.Title, request.Content, request.Language);
                ids.Add(id);
            }

            return CreatedAtAction(nameof(GetAll), new { ids }, ids);
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