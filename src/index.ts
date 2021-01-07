import { StaticFileProcessor, VirtualDirectory, WebServer, } from "maishu-node-web-server";
import "reflect-metadata";

export { controller, action, createParameterDecorator, routeData, request, response, serverContext } from "./attributes";
export { ActionResult, ServerContext } from "./types";
export { Controller } from "./controller";
export { createVirtualDirecotry } from "./virtual-directory";
export { ContentResult, RedirectResult, ProxyResut } from "./action-results";
export { LogLevel, getLogger } from "./logger";
export { MVCRequestProcessor, register } from "./mvc";

// import { MVCRequestProcessor } from "./mvc";

// export default function (webServer: WebServer) {


//     let mvcProcessor = new MVCRequestProcessor();
//     mvcProcessor.controllerDirectories = [];
//     webServer.requestProcessors.add(mvcProcessor);


// }