using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using VirtoCommerce.SolutionArchitectureMap.Data.Repositories;

namespace VirtoCommerce.SolutionArchitectureMap.Data.SqlServer;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<SolutionArchitectureMapDbContext>
{
    public SolutionArchitectureMapDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<SolutionArchitectureMapDbContext>();
        var connectionString = args.Length != 0 ? args[0] : "Server=(local);User=virto;Password=virto;Database=VirtoCommerce3;";

        builder.UseSqlServer(
            connectionString,
            options => options.MigrationsAssembly(typeof(SqlServerDataAssemblyMarker).Assembly.GetName().Name));

        return new SolutionArchitectureMapDbContext(builder.Options);
    }
}
