import { RequestProcessor, RequestContext, RequestResult, VirtualDirectory } from "maishu-node-web-server";
import { ControllerLoader } from "./controller-loader";
import { MVCRequestContext } from "./types";
import * as errors from "./errors";
import { ActionParameterDecoder, metaKeys } from "./attributes";
import { contentTypes } from "./action-results";

export interface MVCRequestProcessorConfig {
    serverContextData?: any,

    /** 
     * 控制器文件夹
     */
    controllersDirectory: VirtualDirectory | string,
}

const CONTROLLERS_PATH = "/controllers";

export class MVCRequestProcessor implements RequestProcessor {

    #serverContextData: any;
    #controllerLoaders: { [virtualPath: string]: ControllerLoader } = {};
    #controllersDirectory: VirtualDirectory | string;

    constructor(config: MVCRequestProcessorConfig) {
        this.#serverContextData = config.serverContextData || {};
        this.#controllersDirectory = config.controllersDirectory;
    }

    get controllersDirectory() {
        return this.#controllersDirectory;
    }
    set controllersDirectory(value) {
        this.#controllersDirectory = value;
    }

    private getControllerLoader() {
        let controllersDirecotry = typeof this.#controllersDirectory == "string" ?
            new VirtualDirectory(this.#controllersDirectory) : this.#controllersDirectory;
        console.assert(controllersDirecotry.physicalPath != null);
        let controllerLoader = this.#controllerLoaders[controllersDirecotry.physicalPath];
        if (controllerLoader == null) {
            controllerLoader = new ControllerLoader(controllersDirecotry);
            this.#controllerLoaders[controllersDirecotry.physicalPath] = controllerLoader;
        }

        return controllerLoader;
    }

    execute(args: RequestContext): Promise<RequestResult> | null {
        let controllerLoader = this.getControllerLoader();
        if (controllerLoader == null)
            return null;

        let actionInfo = controllerLoader.findAction(args.virtualPath);
        if (actionInfo == null)
            return null;

        let context = args as MVCRequestContext;
        context.data = this.#serverContextData;
        return this.executeAction(context, actionInfo.controller, actionInfo.action,
            actionInfo.routeData)
            .then(r => {
                let StatusCode: keyof RequestResult = "statusCode";
                let Headers: keyof RequestResult = "headers";
                let Content: keyof RequestResult = "content";

                // if (r == null)
                //     return Promise.reject(errors.actionResultNull(context.req.url || ""));
                if (r != null && r[Content] != null && (r[StatusCode] != null || r[Headers] != null)) {
                    return r as RequestResult;
                }

                if (typeof r == "string")
                    return { content: r } as RequestResult;

                return { content: JSON.stringify(r), headers: { "Content-Type": contentTypes.applicationJSON } } as RequestResult;
            })
            .then(r => {
                if (context.logLevel == "all") {
                    r.headers = r.headers || {};
                    r.headers["controller-physical-path"] = actionInfo?.controllerPhysicalPath || "";
                    if (typeof actionInfo?.action == "function")
                        r.headers["member-name"] = (actionInfo?.action as Function).name;
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