import { ContentResult, RedirectResult, ProxyResut, Headers } from "./action-results";
export declare class Controller {
    static typeName: string;
    content(value: string, statusCode?: number): ContentResult;
    content(value: string, contentType: string, statusCode?: number): ContentResult;
    content(value: string, headers: Headers, statusCode?: number): ContentResult;
    json(obj: any, statusCode?: number): ContentResult;
    redirect(targetUrl: string): RedirectResult;
    proxy(targetUrl: string, method?: string): ProxyResut;
}
