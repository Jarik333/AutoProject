using AutoService.Api.Tests.TestInfrastructure;

namespace AutoService.Api.Tests.Integration;

[CollectionDefinition("Integration")]
public class IntegrationTestCollection : ICollectionFixture<IntegrationTestWebApplicationFactory>;
