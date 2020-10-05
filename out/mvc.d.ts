import { RequestProcessor, RequestContext, RequestResult } from "maishu-node-web-server";
export interface MVCRequestProcessorConfig {
    serverContextData?: any;
    /** 控制器路径 */
    controllersPath?: string;
}
export declare class MVCRequestProcessor implements RequestProcessor {
    #private;
    constructor(config?: MVCRequestProcessorConfig);
    private getControllerLoader;
    execute(args: RequestContext): Promise<RequestResult> | null;
    private executeAction;
}
