/// <reference types="node" />
import http = require('http');
import { LogLevel } from "./logger";
import { VirtualDirectory, FileProcessor, RequestContext } from 'maishu-node-web-server';
import { RequestResultTransform } from 'maishu-node-web-server';
import { ProxyItem } from 'maishu-node-web-server';
export interface MVCRequestContext<T = {}> extends RequestContext {
    data?: T;
}
export declare type ServerContext<T = {}> = MVCRequestContext<T>;
export interface Settings {
    port?: number;
    bindIP?: string;
    controllerDirectory?: string | VirtualDirectory;
    staticRootDirectory?: string | VirtualDirectory;
    proxy?: {
        [path_pattern: string]: string | ProxyItem;
    };
    /** 项目根目录 */
    rootPath: string;
    serverName?: string;
    /** 设置默认的 Http Header */
    headers?: {
        [name: string]: string;
    };
    virtualPaths?: {
        [virtualPath: string]: string;
    };
    logLevel?: LogLevel;
    serverContextData?: any;
    fileProcessors?: {
        [fileExtention: string]: FileProcessor;
    };
    requestResultTransforms?: RequestResultTransform[];
}
export interface ControllerInfo {
    type: ControllerType<any>;
    path: string;
    actionDefines: ActionInfo[];
    physicalPath: string;
}
export declare type ControllerType<T> = {
    new (): T;
};
export interface ActionInfo {
    memberName: string;
    paths: ActionPath[];
}
export declare type ActionPath = string | ((virtualPath: string) => object | null);
export interface ActionResult {
    execute(res: http.ServerResponse, req: http.IncomingMessage, context: MVCRequestContext): Promise<any>;
}
