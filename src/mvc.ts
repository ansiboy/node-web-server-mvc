import { RequestProcessor, RequestContext, RequestResult, VirtualDirectory } from "maishu-node-web-server";
import { ControllerLoader } from "./controller-loader";
import { MVCRequestContext } from "./types";
import * as errors from "./errors";
import { ActionParameterDecoder, metaKeys } from "./attributes";
import { contentTypes } from "./action-results";

export interface MVCConfig {
    serverContextData?: any,
    controllersDirecotry?: VirtualDirectory,
}

const CONTROLLERS_DIR_NAME = "controllers";

export class MVCRequestProcessor implements RequestProcessor {

    #serverContextData: any;
    #controllerLoaders: { [virtualPath: string]: ControllerLoader } = {};

    constructor(config?: MVCConfig) {
        config = config || {};
        this.#serverContextData = config.serverContextData || {};
    }

    private getControllerLoader(rootDirectory: VirtualDirectory) {
        let controllersDirecotry = rootDirectory.findDirectory("controlllers");
        if (controllersDirecotry == null) {
            return null;
        }

        console.assert(controllersDirecotry.virtualPath != null);
        let controllerLoader = this.#controllerLoaders[controllersDirecotry.virtualPath];
        if (controllerLoader == null) {
            controllerLoader = new ControllerLoader(controllersDirecotry);
            this.#controllerLoaders[controllersDirecotry.virtualPath] = controllerLoader;
        }

        return controllerLoader;
    }

    execute(args: RequestContext): Promise<RequestResult> | null {
        let controllersDirecotry = args.rootDirectory.findDirectory(CONTROLLERS_DIR_NAME);
        if (controllersDirecotry == null) {
            return null;
        }

        let controllerLoader = this.getControllerLoader(args.rootDirectory);
        if (controllerLoader == null)
            return null;
            
        let actionResult = controllerLoader.findAction(args.virtualPath);
        if (actionResult == null)
            return null;

        let context = args as MVCRequestContext;
        context.data = this.#serverContextData;
        return this.executeAction(context, actionResult.controller, actionResult.action,
            actionResult.routeData)
            .then(r => {
                let StatusCode: keyof RequestResult = "statusCode";
                let Headers: keyof RequestResult = "headers";
                let Content: keyof RequestResult = "content";

                if (r[Content] != null && (r[StatusCode] != null || r[Headers] != null)) {
                    return r as RequestResult;
                }

                if (typeof r == "string")
                    return { content: r } as RequestResult;

                return { content: JSON.stringify(r), contentType: contentTypes.applicationJSON } as RequestResult;
            })
            .then(r => {
                if (context.logLevel == "all") {
                    r.headers = r.headers || {};
                    r.headers["controller-physical-path"] = actionResult?.controllerPhysicalPath || "";
                    if (typeof actionResult?.action == "function")
                        r.headers["member-name"] = (actionResult?.action as Function).name;
                }
                return r;
            })
    }

    private executeAction(context: MVCRequestContext, controller: object, action: Function, routeData: { [key: string]: string } | null) {

        if (!controller)
            throw errors.arugmentNull("controller")

        if (!action)
            throw errors.arugmentNull("action")

        // if (!req)
        //     throw errors.arugmentNull("req");

        // if (!res)
        //     throw errors.arugmentNull("res");

        routeData = routeData || {};

        let parameterDecoders: (ActionParameterDecoder<any>)[] = [];
        parameterDecoders = Reflect.getMetadata(metaKeys.parameter, controller, action.name) || [];
        parameterDecoders.sort((a, b) => a.parameterIndex < b.parameterIndex ? -1 : 1);
        let parameters: object[] = []
        return Promise.all(parameterDecoders.map(p => p.createParameter(context, routeData))).then(r => {
            parameters = r;
            let actionResult = action.apply(controller, parameters);
            let p = actionResult as Promise<any>;
            if (p == null || p.then == null) {
                p = Promise.resolve(actionResult);
            }
            return p;
        }).finally(() => {
            for (let i = 0; i < parameterDecoders.length; i++) {
                let d = parameterDecoders[i]
                if (d.disposeParameter) {
                    d.disposeParameter(parameters[d.parameterIndex])
                }
            }
        })
    }
}