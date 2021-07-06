import { RequestProcessor, RequestContext, RequestResult, VirtualDirectory, processorPriorities, getLogger } from "maishu-node-web-server";
import { ControllerLoader } from "./controller-loader";
import { MVCRequestContext } from "./types";
import * as errors from "./errors";
import { action, ActionParameterDecoder, controller, metaKeys } from "./attributes";
import { Logger } from "log4js";
import * as path from "path"
interface Options {
    controllersDirectories?: string[],
    contextData?: any,
}

const encoding = 'UTF-8'
const contentTypes = {
    applicationJSON: `application/json; charset=${encoding}`,
    textPlain: `text/plain; charset=${encoding}`,
}

export class MVCRequestProcessor implements RequestProcessor {

    private static priority = processorPriorities.ProxyRequestProcessor + 1

    priority = MVCRequestProcessor.priority;

    // #serverContextData: any;
    private _controllerLoaders: { [virtualPath: string]: ControllerLoader } = {};
    private options: Options = {};

    constructor() {
    }

    /** 获取控制器文件夹物理路径 */
    get controllerDirectories() {
        return this.options.controllersDirectories;
    }

    /** 设置控制器文件夹物理路径 */
    set controllerDirectories(value) {
        this.options.controllersDirectories = value;
    }

    get contextData() {
        return this.options.contextData;
    }
    set contextData(value: any) {
        this.options.contextData = value;
    }

    private getControllerLoaders(rootDir: VirtualDirectory, logger: Logger) {

        let controllerDirectories = this.controllerDirectories || [];
        for (let i = 0; i < controllerDirectories.length; i++) {
            if (path.isAbsolute(controllerDirectories[i]))
                throw errors.controllerPathIsNotVirtualPath(controllerDirectories[i])

            let dir = rootDir.findDirectory(controllerDirectories[i]);
            if (dir == null) {
                logger.info(`Virtual path ${controllerDirectories[i]} is not exists.`);
                continue;
            }

            if (this._controllerLoaders[dir.physicalPath] != null)
                continue;

            this._controllerLoaders[dir.physicalPath] = new ControllerLoader(dir);
        }

        return this._controllerLoaders;
    }

    execute(args: RequestContext): Promise<RequestResult> | null {

        let pkg = require("../package.json");
        let logger = getLogger(pkg.name, args.logLevel);

        let controllerLoaders = this.getControllerLoaders(args.rootDirectory, logger);
        if (controllerLoaders == null)
            return null;

        let result: ReturnType<ControllerLoader["findAction"]> | undefined;
        for (let key in controllerLoaders) {
            result = controllerLoaders[key].findAction(args.virtualPath, args);
            if (result != null)
                break;
        }

        if (result == null)
            return null;

        let context = args as MVCRequestContext;
        context.data = this.contextData || {};
        return this.executeAction(context, result.controller, result.action, result.routeData)
            .then(r => {
                let StatusCode: keyof RequestResult = "statusCode";
                let Headers: keyof RequestResult = "headers";
                let Content: keyof RequestResult = "content";

                if (r != null && r[Content] != null && (r[StatusCode] != null || r[Headers] != null)) {
                    return r as RequestResult;
                }

                if (typeof r == "string")
                    return { content: r } as RequestResult;

                r = r === undefined ? null : r;
                return { content: JSON.stringify(r), headers: { "Content-Type": contentTypes.applicationJSON } } as RequestResult;
            })
            .then(r => {
                if (context.logLevel == "all") {
                    r.headers = r.headers || {};
                    r.headers["controller-physical-path"] = result?.controllerPhysicalPath || "";
                    if (typeof result?.action == "function")
                        r.headers["member-name"] = (result?.action as Function).name;
                }
                return r;
            })
    }

    private executeAction(context: MVCRequestContext, controller: object, action: Function, routeData: { [key: string]: string } | null) {

        if (!controller)
            throw errors.argumentNull("controller")

        if (!action)
            throw errors.argumentNull("action")

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

function __decorate(decorators: any[], target: any, key?: any, desc?: any) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;

    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

export function register<T>(type: { new(...args: any[]): T }, actions: { [key: string]: string }): void
export function register<T>(type: { new(...args: any[]): T }, controllerName: string, actions: { [key: string]: string }): void
export function register<T>(type: { new(...args: any[]): T }, arg1: any, actions?: { [key: string]: string }): void {

    let controllerName: string | undefined = undefined;
    if (typeof arg1 == "string")
        controllerName = arg1;

    __decorate([controller(controllerName)], type);
    actions = actions || {};
    for (let key in actions) {
        __decorate([action(actions[key] || key)], type.prototype, key);
    }
}