// LegalAnalyzer.Application/HealthChecks/MicroserviceHealthCheck.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading; // For CancellationToken
using Microsoft.Extensions.Diagnostics.HealthChecks;
using LegalAnalyzer.Application.Services;

namespace LegalAnalyzer.Application.HealthChecks
{
    public class MicroserviceHealthCheck : IHealthCheck
    {
        private readonly IMicroserviceHealthService _healthService;

        public MicroserviceHealthCheck(IMicroserviceHealthService healthService)
        {
            _healthService = healthService;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            var data = new Dictionary<string, object>();
            
            try
            {
                var ocrHealthy = await _healthService.IsOcrServiceHealthyAsync();
                var legalHealthy = await _healthService.IsLegalAnalysisServiceHealthyAsync();

                data["ocr_service"] = ocrHealthy;
                data["legal_analysis_service"] = legalHealthy;

                if (ocrHealthy && legalHealthy)
                {
                    return HealthCheckResult.Healthy("All microservices are healthy", data);
                }
                else if (ocrHealthy || legalHealthy)
                {
                    return HealthCheckResult.Degraded("Some microservices are unavailable");
                }
                else
                {
                    return HealthCheckResult.Unhealthy("All microservices are unavailable", data: data);
                }
            }
            catch (Exception ex)
            {
                return new HealthCheckResult(
                    status: HealthStatus.Unhealthy,
                    description: "Health check failed",
                    exception: ex,
                    data: data // Keep your dictionary here
                );
            }
            finally
            {
                // Log the health check result
                var overallStatus = data.ContainsKey("overall_status") ? data["overall_status"].ToString() : "unknown";
                Console.WriteLine($"Health Check Result: {overallStatus}");
            }
        }
    }
}