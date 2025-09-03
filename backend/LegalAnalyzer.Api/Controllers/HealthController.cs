using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
// LegalAnalyzer.Api/Controllers/HealthController.cs - New controller for health checks
using Microsoft.AspNetCore.Mvc;
using LegalAnalyzer.Application.Services;
using Microsoft.Extensions.Logging;

namespace LegalAnalyzer.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IMicroserviceHealthService _healthService;
        private readonly ILogger<HealthController> _logger;

        public HealthController(
            IMicroserviceHealthService healthService,
            ILogger<HealthController> logger)
        {
            _healthService = healthService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                var status = await _healthService.GetServiceStatusAsync();
                var isHealthy = status["overall_status"].ToString() == "healthy";
                
                return isHealthy ? Ok(status) : StatusCode(503, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new { error = "Health check failed", message = ex.Message });
            }
        }

        [HttpGet("detailed")]
        public async Task<IActionResult> GetDetailedHealth()
        {
            var result = new
            {
                backend_service = new
                {
                    status = "healthy",
                    version = "1.0.0",
                    timestamp = DateTime.UtcNow
                },
                dependencies = await _healthService.GetServiceStatusAsync()
            };

            return Ok(result);
        }
    }
}