/// <reference types="node" />
import http = require('http');
import { RequestContext } from 'maishu-node-web-server';
export interface MVCRequestContext<T = {}> extends RequestContext {
    data?: T;
}
export declare type ServerContext<T = {}> = MVCRequestContext<T>;
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
