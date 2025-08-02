using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalAnalyzer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExtractedInfoToDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentKeyword_Documents_DocumentId",
                table: "DocumentKeyword");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTag_Documents_DocumentId",
                table: "DocumentTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DocumentTag",
                table: "DocumentTag");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DocumentKeyword",
                table: "DocumentKeyword");

            migrationBuilder.RenameTable(
                name: "DocumentTag",
                newName: "DocumentTags");

            migrationBuilder.RenameTable(
                name: "DocumentKeyword",
                newName: "DocumentKeywords");

            migrationBuilder.RenameIndex(
                name: "IX_DocumentTag_DocumentId",
                table: "DocumentTags",
                newName: "IX_DocumentTags_DocumentId");

            migrationBuilder.RenameIndex(
                name: "IX_DocumentKeyword_DocumentId",
                table: "DocumentKeywords",
                newName: "IX_DocumentKeywords_DocumentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DocumentTags",
                table: "DocumentTags",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DocumentKeywords",
                table: "DocumentKeywords",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "ExtractedInfoes",
                columns: table => new
                {
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExtractedInfoes", x => x.DocumentId);
                    table.ForeignKey(
                        name: "FK_ExtractedInfoes_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FinancialTerms",
                columns: table => new
                {
                    ExtractedInfoDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Term = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialTerms", x => new { x.ExtractedInfoDocumentId, x.Id });
                    table.ForeignKey(
                        name: "FK_FinancialTerms_ExtractedInfoes_ExtractedInfoDocumentId",
                        column: x => x.ExtractedInfoDocumentId,
                        principalTable: "ExtractedInfoes",
                        principalColumn: "DocumentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KeyDates",
                columns: table => new
                {
                    ExtractedInfoDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KeyDates", x => new { x.ExtractedInfoDocumentId, x.Id });
                    table.ForeignKey(
                        name: "FK_KeyDates_ExtractedInfoes_ExtractedInfoDocumentId",
                        column: x => x.ExtractedInfoDocumentId,
                        principalTable: "ExtractedInfoes",
                        principalColumn: "DocumentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Parties",
                columns: table => new
                {
                    ExtractedInfoDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parties", x => new { x.ExtractedInfoDocumentId, x.Id });
                    table.ForeignKey(
                        name: "FK_Parties_ExtractedInfoes_ExtractedInfoDocumentId",
                        column: x => x.ExtractedInfoDocumentId,
                        principalTable: "ExtractedInfoes",
                        principalColumn: "DocumentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskAssessments",
                columns: table => new
                {
                    ExtractedInfoDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Overall = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAssessments", x => x.ExtractedInfoDocumentId);
                    table.ForeignKey(
                        name: "FK_RiskAssessments_ExtractedInfoes_ExtractedInfoDocumentId",
                        column: x => x.ExtractedInfoDocumentId,
                        principalTable: "ExtractedInfoes",
                        principalColumn: "DocumentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskFactors",
                columns: table => new
                {
                    RiskAssessmentExtractedInfoDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Risk = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Factor = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskFactors", x => new { x.RiskAssessmentExtractedInfoDocumentId, x.Id });
                    table.ForeignKey(
                        name: "FK_RiskFactors_RiskAssessments_RiskAssessmentExtractedInfoDocumentId",
                        column: x => x.RiskAssessmentExtractedInfoDocumentId,
                        principalTable: "RiskAssessments",
                        principalColumn: "ExtractedInfoDocumentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentKeywords_Documents_DocumentId",
                table: "DocumentKeywords",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTags_Documents_DocumentId",
                table: "DocumentTags",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentKeywords_Documents_DocumentId",
                table: "DocumentKeywords");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTags_Documents_DocumentId",
                table: "DocumentTags");

            migrationBuilder.DropTable(
                name: "FinancialTerms");

            migrationBuilder.DropTable(
                name: "KeyDates");

            migrationBuilder.DropTable(
                name: "Parties");

            migrationBuilder.DropTable(
                name: "RiskFactors");

            migrationBuilder.DropTable(
                name: "RiskAssessments");

            migrationBuilder.DropTable(
                name: "ExtractedInfoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DocumentTags",
                table: "DocumentTags");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DocumentKeywords",
                table: "DocumentKeywords");

            migrationBuilder.RenameTable(
                name: "DocumentTags",
                newName: "DocumentTag");

            migrationBuilder.RenameTable(
                name: "DocumentKeywords",
                newName: "DocumentKeyword");

            migrationBuilder.RenameIndex(
                name: "IX_DocumentTags_DocumentId",
                table: "DocumentTag",
                newName: "IX_DocumentTag_DocumentId");

            migrationBuilder.RenameIndex(
                name: "IX_DocumentKeywords_DocumentId",
                table: "DocumentKeyword",
                newName: "IX_DocumentKeyword_DocumentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DocumentTag",
                table: "DocumentTag",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DocumentKeyword",
                table: "DocumentKeyword",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentKeyword_Documents_DocumentId",
                table: "DocumentKeyword",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTag_Documents_DocumentId",
                table: "DocumentTag",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
