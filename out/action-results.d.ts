/// <reference types="node" />
import { RequestProcessor, RequestContext, RequestResult } from 'maishu-node-web-server';
export declare const contentTypes: {
    applicationJSON: string;
    textPlain: string;
};
export declare type Headers = {
    [key: string]: string;
};
export declare class ContentResult implements RequestProcessor {
    private headers;
    private content;
    private statusCode;
    constructor(content: string | Buffer, headers?: Headers | string, statusCode?: number);
    execute(args: RequestContext): RequestResult;
}
export declare class RedirectResult implements RequestProcessor {
    private targetURL;
    constructor(targetURL: string);
    execute(): RequestResult;
}
export declare class ProxyResut implements RequestProcessor {
    private targetURL;
    constructor(targetURL: string, method?: string);
    execute(args: RequestContext): Promise<RequestResult>;
}
