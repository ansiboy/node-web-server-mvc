import { ControllerType, ActionPath, ControllerInfo } from "./types";
export declare type ActionInfo = {
    controllerType: ControllerType<any>;
    memberName: string;
    actionPath: ActionPath;
    controllerPhysicalPath: string;
};
export declare function createAPIControllerType(getActionInfos: () => ActionInfo[], serverContext: ControllerInfo[]): {
    new (): {
        list(): Promise<{
            path: ActionPath;
            controller: string;
            action: string;
            filePath: string;
        }[]>;
        content(value: string, statusCode?: number | undefined): import("./action-results").ContentResult;
        content(value: string, contentType: string, statusCode?: number | undefined): import("./action-results").ContentResult;
        content(value: string, headers: import("./action-results").Headers, statusCode?: number | undefined): import("./action-results").ContentResult;
        json(obj: any, statusCode?: number | undefined): import("./action-results").ContentResult;
        redirect(targetUrl: string): import("./action-results").RedirectResult;
        proxy(targetUrl: string, method?: string | undefined): import("./action-results").ProxyResut;
    };
    typeName: string;
};
