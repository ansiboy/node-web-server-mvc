import http = require('http');
import { RequestContext } from 'maishu-node-web-server';

export interface MVCRequestContext<T = {}> extends RequestContext {
    data?: T,
}

export type ServerContext<T = {}> = MVCRequestContext<T>;


export interface ControllerInfo {
    type: ControllerType<any>,
    path: string,
    actionDefines: ActionInfo[],
    physicalPath: string
}

export type ControllerType<T> = { new(): T }

export interface ActionInfo {
    memberName: string,
    paths: ActionPath[],
}

export type ActionPathFun = (virtualPath: string, ctx: RequestContext) => { [key: string]: any } | null;
export type ActionPath = string | ActionPathFun;

export interface ActionResult {
    execute(res: http.ServerResponse, req: http.IncomingMessage, context: MVCRequestContext): Promise<any>
}
