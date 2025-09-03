using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
// LegalAnalyzer.Application/Services/MicroserviceHealthService.cs
using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.Net.Http; // For HttpClient
using Microsoft.Extensions.Http; // For IHttpClientFactory

namespace LegalAnalyzer.Application.Services
{
    public class MicroserviceHealthService : IMicroserviceHealthService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<MicroserviceHealthService> _logger;

        public MicroserviceHealthService(
            IHttpClientFactory httpClientFactory,
            ILogger<MicroserviceHealthService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<bool> IsOcrServiceHealthyAsync()
        {
            try
            {
                using var client = _httpClientFactory.CreateClient("OcrService");
                client.Timeout = TimeSpan.FromSeconds(10);
                
                var response = await client.GetAsync("health");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "OCR service health check failed");
                return false;
            }
        }

        public async Task<bool> IsLegalAnalysisServiceHealthyAsync()
        {
            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.BaseAddress = new Uri("http://localhost:8002/");
                client.Timeout = TimeSpan.FromSeconds(10);
                
                var response = await client.GetAsync("health");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Legal analysis service health check failed");
                return false;
            }
        }

        public async Task<Dictionary<string, object>> GetServiceStatusAsync()
        {
            var status = new Dictionary<string, object>();

            // Check OCR service
            var ocrHealthy = await IsOcrServiceHealthyAsync();
            status["ocr_service"] = new
            {
                healthy = ocrHealthy,
                url = "http://localhost:8001/",
                description = "Text extraction and OCR service"
            };

            // Check Legal Analysis service
            var legalHealthy = await IsLegalAnalysisServiceHealthyAsync();
            status["legal_analysis_service"] = new
            {
                healthy = legalHealthy,
                url = "http://localhost:8002/",
                description = "Advanced legal document analysis service"
            };

            // Overall status
            status["overall_status"] = ocrHealthy && legalHealthy ? "healthy" : "degraded";
            status["timestamp"] = DateTime.UtcNow;

            return status;
        }
    }
}