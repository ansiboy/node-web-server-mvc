"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const home_1 = require("./www/controllers/home");
const assert = require("assert");
const home_2 = require("./www/my-controllers/home");
describe("mvc-request-processor", function () {
    let webServer = common_1.createWebserver();
    let browser = common_1.createBrowser();
    it("execute action", function () {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `http://127.0.0.1:${webServer.port}/home/product/1`;
            yield browser.visit(url);
            let ctrl = new home_1.HomeController();
            let r = ctrl.product({ id: "1" });
            assert.strictEqual(browser.source, JSON.stringify(r));
        });
    });
    it("controllers path", function () {
        return __awaiter(this, void 0, void 0, function* () {
            let mvcConfig = {
                controllersDirectory: "my-controllers"
            };
            webServer = common_1.createWebserver({
                requestProcessorConfigs: {
                    MVC: mvcConfig
                }
            });
            let url = `http://127.0.0.1:${webServer.port}/my-controllers-index`;
            //my-controllers-index
            yield browser.visit(url);
            let ctrl = new home_2.HomeController();
            let r = ctrl.index();
            assert.strictEqual(browser.source, r);
        });
    });
    it("404", function () {
        return __awaiter(this, void 0, void 0, function* () {
            let mvcConfig = {
                controllersDirectory: "my-controllers"
            };
            webServer = common_1.createWebserver({
                requestProcessorConfigs: {
                    MVC: mvcConfig
                }
            });
            let url = `http://127.0.0.1:${webServer.port}/tttxxxtttaa`;
            try {
                yield browser.visit(url);
            }
            catch (err) {
                assert.strictEqual(browser.response.status, 404);
            }
        });
    });
});
