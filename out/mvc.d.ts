import { RequestProcessor, RequestContext, RequestResult, VirtualDirectory } from "maishu-node-web-server";
export interface MVCConfig {
    serverContextData?: any;
    controllersDirecotry?: VirtualDirectory;
}
export declare class MVCRequestProcessor implements RequestProcessor {
    #private;
    constructor(config?: MVCConfig);
    private getControllerLoader;
    execute(args: RequestContext): Promise<RequestResult> | null;
    private executeAction;
}
