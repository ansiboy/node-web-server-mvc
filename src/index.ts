import { VirtualDirectory, WebServer } from "maishu-node-web-server";
import "reflect-metadata";

export { controller, action, createParameterDecorator, routeData, request, response, serverContext } from "./attributes";
export { ActionResult, ServerContext } from "./types";
export { Controller } from "./controller";
export { createVirtualDirecotry } from "./virtual-directory";
export { ContentResult, RedirectResult, ProxyResut } from "./action-results";
export { LogLevel, getLogger } from "./logger";
export { MVCRequestProcessorConfig, MVCRequestProcessor, register } from "./mvc";


import { MVCRequestProcessor } from "./mvc";
export default function (webServer: WebServer, rootDirectory: VirtualDirectory) {

    let dir = rootDirectory.findDirectory("controllers");
    if (dir) {
        let mvcProcessor = new MVCRequestProcessor({
            controllersDirectory: dir,
        });

        webServer.requestProcessors.add(mvcProcessor);
    }


}