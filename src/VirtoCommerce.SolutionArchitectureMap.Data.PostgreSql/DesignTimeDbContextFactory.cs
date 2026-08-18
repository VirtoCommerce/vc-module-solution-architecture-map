using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using VirtoCommerce.SolutionArchitectureMap.Data.Repositories;

namespace VirtoCommerce.SolutionArchitectureMap.Data.PostgreSql;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<SolutionArchitectureMapDbContext>
{
    public SolutionArchitectureMapDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<SolutionArchitectureMapDbContext>();
        var connectionString = args.Length != 0 ? args[0] : "Server=localhost;Username=virto;Password=virto;Database=VirtoCommerce3;";

        builder.UseNpgsql(
            connectionString,
            options => options.MigrationsAssembly(typeof(PostgreSqlDataAssemblyMarker).Assembly.GetName().Name));

        return new SolutionArchitectureMapDbContext(builder.Options);
    }
}
