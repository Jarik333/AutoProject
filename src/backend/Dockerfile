FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY AutoService.Domain/AutoService.Domain.csproj AutoService.Domain/
COPY AutoService.Infrastructure/AutoService.Infrastructure.csproj AutoService.Infrastructure/
COPY AutoService.Api/AutoService.Api.csproj AutoService.Api/
RUN dotnet restore AutoService.Api/AutoService.Api.csproj

COPY AutoService.Domain/ AutoService.Domain/
COPY AutoService.Infrastructure/ AutoService.Infrastructure/
COPY AutoService.Api/ AutoService.Api/

RUN dotnet publish AutoService.Api/AutoService.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "AutoService.Api.dll"]
