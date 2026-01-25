using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Threading.Tasks;

public static class ControllerExtensions
{
    public static async Task<string> RenderViewToStringAsync<TModel>(
        this Controller controller,
        string viewName,
        TModel model)
    {
        controller.ViewData.Model = model;

        using var writer = new StringWriter();

        var viewEngine = controller.HttpContext.RequestServices
            .GetRequiredService<ICompositeViewEngine>();

        var viewResult = viewEngine.FindView(
            controller.ControllerContext,
            viewName,
            false);

        if (!viewResult.Success)
        {
            throw new Exception($"View '{viewName}' not found");
        }

        var viewContext = new ViewContext(
            controller.ControllerContext,
            viewResult.View,
            controller.ViewData,
            controller.TempData,
            writer,
            new HtmlHelperOptions()
        );

        await viewResult.View.RenderAsync(viewContext);
        return writer.ToString();
    }
}
