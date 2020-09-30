"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_results_1 = require("./action-results");
// type Headers = { [key: string]: string | string[] };
class Controller {
    content(value, type, statusCode) {
        if (typeof type == "number") {
            statusCode = type;
            type = undefined;
        }
        let headers;
        if (typeof type == "number") {
            headers = {};
        }
        else if (typeof type == "string") {
            headers = { "content-type": type };
        }
        else {
            headers = type || {};
        }
        let r = new action_results_1.ContentResult(value, headers, statusCode);
        return r;
    }
    json(obj, statusCode) {
        let str = JSON.stringify(obj);
        return this.content(str, action_results_1.contentTypes.applicationJSON, statusCode);
    }
    redirect(targetUrl) {
        let r = new action_results_1.RedirectResult(targetUrl);
        return r;
    }
    proxy(targetUrl, method) {
        let r = new action_results_1.ProxyResut(targetUrl, method);
        return r;
    }
}
exports.Controller = Controller;
Controller.typeName = "node-mvc.Controller";
