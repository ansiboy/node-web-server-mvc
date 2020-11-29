import { RequestProcessor, RequestContext, RequestResult, VirtualDirectory } from "maishu-node-web-server";
export interface MVCRequestProcessorConfig {
    serverContextData?: any;
    /**
     * 控制器文件夹
     */
    controllersDirectory: VirtualDirectory | string;
}
export declare class MVCRequestProcessor implements RequestProcessor {
    #private;
    constructor(config: MVCRequestProcessorConfig);
    get controllersDirectory(): string | VirtualDirectory;
    set controllersDirectory(value: string | VirtualDirectory);
    private getControllerLoader;
    execute(args: RequestContext): Promise<RequestResult> | null;
    private executeAction;
}
