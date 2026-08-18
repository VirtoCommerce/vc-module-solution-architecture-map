using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Permissions = VirtoCommerce.SolutionArchitectureMap.Core.ModuleConstants.Security.Permissions;

namespace VirtoCommerce.SolutionArchitectureMap.Web.Controllers.Api;

[Authorize]
[Route("api/solution-architecture-map")]
public class SolutionArchitectureMapController : Controller
{
    // GET: api/solution-architecture-map
    /// <summary>
    /// Get message
    /// </summary>
    /// <remarks>Return "Hello world!" message</remarks>
    [HttpGet]
    [Route("")]
    [Authorize(Permissions.Read)]
    public ActionResult<string> Get()
    {
        return Ok(new { result = "Hello world!" });
    }
}
