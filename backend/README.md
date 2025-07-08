# Legal Analyzer Backend

This is the backend for the LegalDocAnalyzer application, built using ASP.NET Core with Clean Architecture principles. The backend is structured into multiple layers, including API, Application, Domain, and Infrastructure, to promote separation of concerns and maintainability.

## Project Structure

- **LegalAnalyzer.Api**: Contains the API layer, including controllers and configuration files.
- **LegalAnalyzer.Application**: Contains the application layer, including service interfaces and implementations, as well as Data Transfer Objects (DTOs).
- **LegalAnalyzer.Domain**: Contains the domain layer, including entity definitions and repository interfaces.
- **LegalAnalyzer.Infrastructure**: Contains the infrastructure layer, including the Entity Framework Core database context and repository implementations.

## Prerequisites

- .NET 6.0 or higher
- SQL Server

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Restore the NuGet packages:
   ```bash
   dotnet restore
   ```

3. Update the connection string in `LegalAnalyzer.Api/appsettings.json` to point to your SQL Server instance.

4. Apply migrations to set up the database:
   ```bash
   dotnet ef database update --project LegalAnalyzer.Infrastructure
   ```

5. Run the application:
   ```bash
   dotnet run --project LegalAnalyzer.Api
   ```

## Usage

- The API exposes endpoints for managing weather forecasts. You can access the API at `http://localhost:<port>/api/weatherforecast`.
- Use tools like Postman or curl to interact with the API.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

For questions or contributions, please open an issue or pull request.