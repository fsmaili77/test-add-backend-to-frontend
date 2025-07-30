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

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
ThreadPool.SetMinThreads(100, 100);
builder.Services.AddControllers();
builder.Services.AddHttpClient<DocumentController>();
builder.Services.AddLogging(logging => logging
    .AddConsole()) ; 

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:4028") // Allow the React app's origin
              .AllowAnyMethod() // Allow all HTTP methods (GET, POST, etc.)
              .AllowAnyHeader(); // Allow all headers
    });
});

// Configure DbContext with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories and services
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable CORS
app.UseCors("AllowSpecificOrigin");

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.MapControllers();
app.Run();