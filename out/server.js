"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maishu_node_web_server_1 = require("maishu-node-web-server");
const request_processors_1 = require("./request-processors");
const fs = require("fs");
const errors = require("./errors");
function startServer(settings) {
    if (!settings.rootPath && !fs.existsSync(settings.rootPath))
        throw errors.physicalPathNotExists(settings.rootPath);
    if (settings.staticRootDirectory == null && settings.rootPath != null) {
        let staticPath = maishu_node_web_server_1.pathConcat(settings.rootPath, "static");
        if (fs.existsSync(staticPath)) {
            settings.staticRootDirectory = maishu_node_web_server_1.pathConcat(settings.rootPath, "static");
        }
    }
    if (settings.controllerDirectory == null && settings.rootPath != null) {
        let controllerPath = maishu_node_web_server_1.pathConcat(settings.rootPath, "controllers");
        if (fs.existsSync(controllerPath)) {
            settings.controllerDirectory = maishu_node_web_server_1.pathConcat(settings.rootPath, "controllers");
        }
    }
    let r = {
        port: settings.port,
        bindIP: settings.bindIP,
        websiteDirectory: settings.staticRootDirectory,
        requestProcessorConfigs: createequestProcessorConfigs(settings),
        requestProcessorTypes: exports.defaultRequestProcessorTypes,
        requestResultTransforms: settings.requestResultTransforms
    };
    let server = new maishu_node_web_server_1.WebServer(r);
    if (settings.virtualPaths) {
        for (let virtualPath in settings.virtualPaths) {
            if (virtualPath[0] != "/")
                virtualPath = "/" + virtualPath;
            server.websiteDirectory.setPath(virtualPath, settings.virtualPaths[virtualPath]);
        }
    }
    return server;
}
exports.startServer = startServer;
exports.defaultRequestProcessorTypes = [request_processors_1.HeadersRequestProcessor, request_processors_1.MVCRequestProcessor, ...maishu_node_web_server_1.WebServer.defaultRequestProcessorTypes];
function createequestProcessorConfigs(settings) {
    let requestProcessorConfigs = {};
    let proxyConfig = {
        proxyTargets: settings.proxy || {},
    };
    requestProcessorConfigs[maishu_node_web_server_1.ProxyRequestProcessor.name] = proxyConfig;
    let controllersDirecotry;
    if (settings.controllerDirectory == null) {
        controllersDirecotry = new maishu_node_web_server_1.VirtualDirectory(__dirname);
    }
    else if (typeof settings.controllerDirectory == "string") {
        controllersDirecotry = new maishu_node_web_server_1.VirtualDirectory(settings.controllerDirectory);
    }
    else {
        controllersDirecotry = settings.controllerDirectory;
    }
    let mvcConfig = {
        controllersDirecotry,
        serverContextData: settings.serverContextData,
    };
    requestProcessorConfigs[request_processors_1.MVCRequestProcessor.name] = mvcConfig;
    let headers = settings.headers || {};
    requestProcessorConfigs[request_processors_1.HeadersRequestProcessor.name] = headers;
    let staticConfig = {
        fileProcessors: Object.assign({
            "less": maishu_node_web_server_1.textFileProcessor
        }, settings.fileProcessors)
    };
    requestProcessorConfigs[maishu_node_web_server_1.StaticFileRequestProcessor.name] = staticConfig;
    return requestProcessorConfigs;
}
exports.createequestProcessorConfigs = createequestProcessorConfigs;
