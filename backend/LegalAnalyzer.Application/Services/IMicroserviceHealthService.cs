using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LegalAnalyzer.Application.Services
{
    public interface IMicroserviceHealthService
    {
        Task<bool> IsOcrServiceHealthyAsync();
        Task<bool> IsLegalAnalysisServiceHealthyAsync();
        Task<Dictionary<string, object>> GetServiceStatusAsync();
    }
}