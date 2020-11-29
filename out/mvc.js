"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_loader_1 = require("./controller-loader");
const errors = require("./errors");
const attributes_1 = require("./attributes");
const action_results_1 = require("./action-results");
const CONTROLLERS_PATH = "/controllers";
class MVCRequestProcessor {
    constructor(config) {
        this.#controllerLoaders = {};
        config = config || {};
        this.#serverContextData = config.serverContextData || {};
        this.#controllersDirectory = config.controllersDirectory || CONTROLLERS_PATH;
    }
    #serverContextData;
    #controllerLoaders;
    #controllersDirectory;
    getControllerLoader(rootDirectory) {
        let controllersDirecotry = typeof this.#controllersDirectory == "string" ?
            rootDirectory.findDirectory(this.#controllersDirectory) : this.#controllersDirectory;
        if (controllersDirecotry == null) {
            return null;
        }
        console.assert(controllersDirecotry.virtualPath != null);
        let controllerLoader = this.#controllerLoaders[controllersDirecotry.virtualPath];
        if (controllerLoader == null) {
            controllerLoader = new controller_loader_1.ControllerLoader(controllersDirecotry);
            this.#controllerLoaders[controllersDirecotry.virtualPath] = controllerLoader;
        }
        return controllerLoader;
    }
    execute(args) {
        let controllerLoader = this.getControllerLoader(args.rootDirectory);
        if (controllerLoader == null)
            return null;
        let actionResult = controllerLoader.findAction(args.virtualPath);
        if (actionResult == null)
            return null;
        let context = args;
        context.data = this.#serverContextData;
        return this.executeAction(context, actionResult.controller, actionResult.action, actionResult.routeData)
            .then(r => {
            let StatusCode = "statusCode";
            let Headers = "headers";
            let Content = "content";
            if (r[Content] != null && (r[StatusCode] != null || r[Headers] != null)) {
                return r;
            }
            if (typeof r == "string")
                return { content: r };
            return { content: JSON.stringify(r), headers: { "Content-Type": action_results_1.contentTypes.applicationJSON } };
        })
            .then(r => {
            if (context.logLevel == "all") {
                r.headers = r.headers || {};
                r.headers["controller-physical-path"] = actionResult?.controllerPhysicalPath || "";
                if (typeof actionResult?.action == "function")
                    r.headers["member-name"] = actionResult?.action.name;
            }
            return r;
        });
    }
    executeAction(context, controller, action, routeData) {
        if (!controller)
            throw errors.arugmentNull("controller");
        if (!action)
            throw errors.arugmentNull("action");
        // if (!req)
        //     throw errors.arugmentNull("req");
        // if (!res)
        //     throw errors.arugmentNull("res");
        routeData = routeData || {};
        let parameterDecoders = [];
        parameterDecoders = Reflect.getMetadata(attributes_1.metaKeys.parameter, controller, action.name) || [];
        parameterDecoders.sort((a, b) => a.parameterIndex < b.parameterIndex ? -1 : 1);
        let parameters = [];
        return Promise.all(parameterDecoders.map(p => p.createParameter(context, routeData))).then(r => {
            parameters = r;
            let actionResult = action.apply(controller, parameters);
            let p = actionResult;
            if (p == null || p.then == null) {
                p = Promise.resolve(actionResult);
            }
            return p;
        }).finally(() => {
            for (let i = 0; i < parameterDecoders.length; i++) {
                let d = parameterDecoders[i];
                if (d.disposeParameter) {
                    d.disposeParameter(parameters[d.parameterIndex]);
                }
            }
        });
    }
}
exports.MVCRequestProcessor = MVCRequestProcessor;
