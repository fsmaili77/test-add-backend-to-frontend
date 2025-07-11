using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalAnalyzer.Infrastructure.Data.Migrations
{
    public partial class ModifDocumentModelAndDto : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "AnalysisDuration",
                table: "Documents",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AnalysisProgress",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "Size",
                table: "Documents",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnalysisDuration",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "AnalysisProgress",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Documents");
        }
    }
}
