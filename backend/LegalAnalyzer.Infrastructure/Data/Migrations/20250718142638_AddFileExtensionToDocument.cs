using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalAnalyzer.Infrastructure.Data.Migrations
{
    public partial class AddFileExtensionToDocument : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileExtension",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileExtension",
                table: "Documents");
        }
    }
}
