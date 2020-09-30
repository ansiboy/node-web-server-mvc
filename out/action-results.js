"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const errors_1 = require("./errors");
const url = require("url");
const errors = require("./errors");
const encoding = 'UTF-8';
exports.contentTypes = {
    applicationJSON: `application/json; charset=${encoding}`,
    textPlain: `text/plain; charset=${encoding}`,
};
class ContentResult {
    constructor(content, headers, statusCode) {
        if (content == null)
            throw errors_1.arugmentNull('content');
        this.content = content;
        if (typeof headers == "string") {
            this.headers = { "content-type": headers };
        }
        else {
            this.headers = headers || {};
        }
        this.statusCode = statusCode || 200;
    }
    execute(args) {
        return { statusCode: this.statusCode, headers: this.headers, content: this.content };
    }
}
exports.ContentResult = ContentResult;
class RedirectResult {
    constructor(targetURL) {
        this.targetURL = targetURL;
    }
    execute() {
        // res.writeHead(302, { 'Location': this.targetURL })
        return { statusCode: 302, headers: { "Location": this.targetURL }, content: "" };
    }
}
exports.RedirectResult = RedirectResult;
class ProxyResut {
    constructor(targetURL, method) {
        this.targetURL = targetURL;
    }
    async execute(args) {
        let targetURL = this.targetURL;
        let isFullUrl = !targetURL.endsWith("/");
        let req = args.req;
        if (req.url && isFullUrl == false) {
            let u = url.parse(req.url);
            if (targetURL.endsWith("/")) {
                targetURL = targetURL.substr(0, targetURL.length - 1);
            }
            targetURL = targetURL + u.path;
        }
        return proxyRequest(targetURL, args.req, args.res, {}, args.req.method);
    }
}
exports.ProxyResut = ProxyResut;
function proxyRequest(targetUrl, req, res, headers, method) {
    return new Promise(function (resolve, reject) {
        headers = Object.assign({}, req.headers, headers || {});
        // headers = Object.assign(req.headers, headers);
        //=====================================================
        if (headers.host) {
            headers["delete-host"] = headers.host;
            // 在转发请求到 nginx 服务器,如果有 host 字段,转发失败
            delete headers.host;
        }
        //=====================================================
        let clientRequest = http.request(targetUrl, {
            method: method || req.method,
            headers: headers, timeout: 2000,
        }, function (response) {
            for (var key in response.headers) {
                res.setHeader(key, response.headers[key] || '');
            }
            res.statusCode = response.statusCode || 200;
            res.statusMessage = response.statusMessage || '';
            let b = Buffer.from([]);
            response.on("data", (data) => {
                b = Buffer.concat([b, data]);
            });
            response.on("end", () => {
                resolve({ content: b });
            });
            response.on("error", err => reject(err));
            response.on("close", () => {
                reject(errors.connectionClose());
            });
        });
        if (!req.readable) {
            reject(errors.requestNotReadable());
        }
        req.on('data', (data) => {
            clientRequest.write(data);
        }).on('end', () => {
            clientRequest.end();
        }).on('error', (err) => {
            clientRequest.end();
            reject(err);
        });
        clientRequest.on("error", function (err) {
            // let logger = getLogger(LOG_CATEGORY_NAME, serverContext.logLevel);
            // logger.error(err);
            reject(err);
        });
    });
}
