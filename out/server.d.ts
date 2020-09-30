import { Settings } from "./types";
import { WebServer } from "maishu-node-web-server";
export declare function startServer(settings: Settings): WebServer;
export declare let defaultRequestProcessorTypes: any[];
export declare function createequestProcessorConfigs(settings: Pick<Settings, "controllerDirectory" | "proxy" | "fileProcessors" | "headers" | "logLevel" | "serverContextData">): any;
