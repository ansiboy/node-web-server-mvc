"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maishu_node_web_server_1 = require("maishu-node-web-server");
const controller_loader_1 = require("./controller-loader");
const errors = require("./errors");
const attributes_1 = require("./attributes");
const action_results_1 = require("./action-results");
const CONTROLLERS_PATH = "/controllers";
class MVCRequestProcessor {
    constructor(config) {
        this.#controllerLoaders = {};
        this.#serverContextData = config.serverContextData || {};
        this.#controllersDirectory = config.controllersDirectory;
    }
    #serverContextData;
    #controllerLoaders;
    #controllersDirectory;
    get controllersDirectory() {
        return this.#controllersDirectory;
    }
    set controllersDirectory(value) {
        this.#controllersDirectory = value;
    }
    getControllerLoader() {
        let controllersDirecotry = typeof this.#controllersDirectory == "string" ?
            new maishu_node_web_server_1.VirtualDirectory(this.#controllersDirectory) : this.#controllersDirectory;
        console.assert(controllersDirecotry.physicalPath != null);
        let controllerLoader = this.#controllerLoaders[controllersDirecotry.physicalPath];
        if (controllerLoader == null) {
            controllerLoader = new controller_loader_1.ControllerLoader(controllersDirecotry);
            this.#controllerLoaders[controllersDirecotry.physicalPath] = controllerLoader;
        }
        return controllerLoader;
    }
    execute(args) {
        let controllerLoader = this.getControllerLoader();
        if (controllerLoader == null)
            return null;
        let actionInfo = controllerLoader.findAction(args.virtualPath);
        if (actionInfo == null)
            return null;
        let context = args;
        context.data = this.#serverContextData;
        return this.executeAction(context, actionInfo.controller, actionInfo.action, actionInfo.routeData)
            .then(r => {
            let StatusCode = "statusCode";
            let Headers = "headers";
            let Content = "content";
            // if (r == null)
            //     return Promise.reject(errors.actionResultNull(context.req.url || ""));
            if (r != null && r[Content] != null && (r[StatusCode] != null || r[Headers] != null)) {
                return r;
            }
            if (typeof r == "string")
                return { content: r };
            return { content: JSON.stringify(r), headers: { "Content-Type": action_results_1.contentTypes.applicationJSON } };
        })
            .then(r => {
            if (context.logLevel == "all") {
                r.headers = r.headers || {};
                r.headers["controller-physical-path"] = actionInfo?.controllerPhysicalPath || "";
                if (typeof actionInfo?.action == "function")
                    r.headers["member-name"] = actionInfo?.action.name;
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
