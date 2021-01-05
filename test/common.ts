import Browser = require('zombie');
import * as fs from "fs";
import * as path from "path";
import { MVCRequestProcessor } from "../out";
import { WebServer, Settings, pathConcat, } from "maishu-node-web-server";

export let websitePhysicalPath = path.join(__dirname, "www");
export function createWebserver(settings?: Partial<Settings>) {
    let defaultSettings: Settings = {
        // rootPath: __dirname,
        // staticRootDirectory: path.join(__dirname, "www"),
        // controllerDirectory: path.join(__dirname, "www", "controllers"),
        websiteDirectory: websitePhysicalPath,
        // requestProcessorTypes: [MVCRequestProcessor, ...WebServer.defaultRequestProcessorTypes]
    }


    settings = Object.assign(settings || {}, defaultSettings);

    let w = new WebServer(settings); //startServer(settings as Settings);
    console.log(`Web server port is ${w.port}.`);
    w.requestProcessors.add(new MVCRequestProcessor());
    w.requestProcessors.find(MVCRequestProcessor).controllerDirectories = [pathConcat(websitePhysicalPath, "controllers")];
    return w;
}

export function createBrowser() {
    return new Browser();
}

export function readFile(physicalPath: string | null) {
    if (physicalPath == null)
        throw new Error(`Argument physicalPaht is null.`);

    if (fs.existsSync(physicalPath) == false)
        throw new Error(`File ${physicalPath} is not exists.`);

    let buffer: Buffer = fs.readFileSync(physicalPath);
    let source: string = buffer.toString();
    return source;
}