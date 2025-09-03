using LegalAnalyzer.Domain.Interfaces;
using LegalAnalyzer.Domain.Repositories;
using LegalAnalyzer.Infrastructure.Data;
using LegalAnalyzer.Infrastructure.Repositories;
using LegalAnalyzer.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using LegalAnalyzer.Domain.Entities;
using Microsoft.Extensions.Logging;
using LegalAnalyzer.Api.Controllers;
using System.Threading;
using System;
using System.Net.Http;
using LegalAnalyzer.Application.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// ThreadPool tuning
ThreadPool.SetMinThreads(100, 100);

// Add controllers & logging
builder.Services.AddControllers();
builder.Services.AddLogging(logging => logging.AddConsole());

// CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:4028")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure DbContext with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories & services
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

// Named HttpClients for microservices
builder.Services.AddHttpClient("OcrService", client =>
{
    client.BaseAddress = new Uri("http://localhost:8001/");
    client.Timeout = TimeSpan.FromMinutes(5);
});
builder.Services.AddHttpClient("LegalDocAnalysisService", client =>
{
    client.BaseAddress = new Uri("http://localhost:8002/");
    client.Timeout = TimeSpan.FromMinutes(10);
});

// Register LegalAnalysisService with IHttpClientFactory
builder.Services.AddScoped<ILegalAnalysisService, LegalAnalysisService>();

// Health checks
builder.Services.AddScoped<IMicroserviceHealthService, MicroserviceHealthService>();
builder.Services.AddHealthChecks()
    .AddCheck<MicroserviceHealthCheck>("microservices");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowSpecificOrigin");
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();
app.Run();
