// LegalAnalyzer.Application/Models/MicroserviceAnalysisResult.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace LegalAnalyzer.Application.Models
{
    public class MicroserviceAnalysisResult
    {
        [JsonPropertyName("metadata")]
        public DocumentMetadata? Metadata { get; set; }

        [JsonPropertyName("document_classification")]
        public string DocumentClassification { get; set; } = string.Empty;

        [JsonPropertyName("confidence_score")]
        public double ConfidenceScore { get; set; }

        [JsonPropertyName("extracted_text")]
        public string ExtractedText { get; set; } = string.Empty;

        [JsonPropertyName("contract_analysis")]
        public ContractAnalysis? ContractAnalysis { get; set; }

        [JsonPropertyName("brief_analysis")]
        public BriefAnalysis? BriefAnalysis { get; set; }

        [JsonPropertyName("case_law_analysis")]
        public CaseLawAnalysis? CaseLawAnalysis { get; set; }

        [JsonPropertyName("regulation_analysis")]
        public RegulationAnalysis? RegulationAnalysis { get; set; }

        [JsonPropertyName("key_entities")]
        public List<EntityExtraction> KeyEntities { get; set; } = new List<EntityExtraction>();

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("language")]
        public string Language { get; set; } = string.Empty;

        [JsonPropertyName("ai_summary")]
        public string AiSummary { get; set; } = string.Empty;
    }

    public class DocumentMetadata
    {
        [JsonPropertyName("filename")]
        public string Filename { get; set; } = string.Empty;

        [JsonPropertyName("document_type")]
        public string DocumentType { get; set; } = string.Empty;

        [JsonPropertyName("mime_type")]
        public string MimeType { get; set; } = string.Empty;

        [JsonPropertyName("word_count")]
        public int WordCount { get; set; }

        [JsonPropertyName("page_count")]
        public int? PageCount { get; set; }

        [JsonPropertyName("processing_time")]
        public double ProcessingTime { get; set; }

        [JsonPropertyName("processed_at")]
        public DateTime ProcessedAt { get; set; }
    }

    public class ContractAnalysis
    {
        [JsonPropertyName("parties")]
        public List<string> Parties { get; set; } = new List<string>();

        [JsonPropertyName("key_dates")]
        public List<Dictionary<string, string>> KeyDates { get; set; } = new List<Dictionary<string, string>>();

        [JsonPropertyName("obligations")]
        public List<string> Obligations { get; set; } = new List<string>();

        [JsonPropertyName("termination_clauses")]
        public List<string> TerminationClauses { get; set; } = new List<string>();

        [JsonPropertyName("governing_law")]
        public string? GoverningLaw { get; set; }

        [JsonPropertyName("dispute_resolution")]
        public string? DisputeResolution { get; set; }

        [JsonPropertyName("payment_terms")]
        public List<string> PaymentTerms { get; set; } = new List<string>();
    }

    public class BriefAnalysis
    {
        [JsonPropertyName("parties")]
        public List<string> Parties { get; set; } = new List<string>();

        [JsonPropertyName("case_citations")]
        public List<string> CaseCitations { get; set; } = new List<string>();

        [JsonPropertyName("legal_issues")]
        public List<string> LegalIssues { get; set; } = new List<string>();

        [JsonPropertyName("arguments")]
        public List<string> Arguments { get; set; } = new List<string>();

        [JsonPropertyName("relief_sought")]
        public List<string> ReliefSought { get; set; } = new List<string>();

        [JsonPropertyName("jurisdiction")]
        public string? Jurisdiction { get; set; }
    }

    public class CaseLawAnalysis
    {
        [JsonPropertyName("parties")]
        public List<string> Parties { get; set; } = new List<string>();

        [JsonPropertyName("case_name")]
        public string? CaseName { get; set; }

        [JsonPropertyName("court")]
        public string? Court { get; set; }

        [JsonPropertyName("date_decided")]
        public string? DateDecided { get; set; }

        [JsonPropertyName("citations")]
        public List<string> Citations { get; set; } = new List<string>();

        [JsonPropertyName("holding")]
        public string? Holding { get; set; }

        [JsonPropertyName("key_facts")]
        public List<string> KeyFacts { get; set; } = new List<string>();

        [JsonPropertyName("legal_principles")]
        public List<string> LegalPrinciples { get; set; } = new List<string>();
    }

    public class RegulationAnalysis
    {
        [JsonPropertyName("parties")]
        public List<string> Parties { get; set; } = new List<string>();

        [JsonPropertyName("regulation_number")]
        public string? RegulationNumber { get; set; }

        [JsonPropertyName("effective_date")]
        public string? EffectiveDate { get; set; }

        [JsonPropertyName("agency")]
        public string? Agency { get; set; }

        [JsonPropertyName("scope")]
        public List<string> Scope { get; set; } = new List<string>();

        [JsonPropertyName("requirements")]
        public List<string> Requirements { get; set; } = new List<string>();

        [JsonPropertyName("penalties")]
        public List<string> Penalties { get; set; } = new List<string>();
    }

    public class EntityExtraction
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        [JsonPropertyName("context")]
        public string Context { get; set; } = string.Empty;

        [JsonPropertyName("confidence")]
        public double? Confidence { get; set; }
    }

    // Configuration model for the microservice
    public class LegalAnalysisConfiguration
    {
        public string BaseUrl { get; set; } = "http://localhost:8002/";
        public int TimeoutMinutes { get; set; } = 10;
        public bool EnableCaching { get; set; } = true;
        public int MaxRetries { get; set; } = 3;
        public int RetryDelaySeconds { get; set; } = 2;
    }

    // Request model for batch analysis
    public class BatchAnalysisRequest
    {
        [JsonPropertyName("include_full_text")]
        public bool IncludeFullText { get; set; } = false;

        [JsonPropertyName("max_entities")]
        public int MaxEntities { get; set; } = 50;

        [JsonPropertyName("analysis_types")]
        public List<string> AnalysisTypes { get; set; } = new List<string> { "all" };
    }
}