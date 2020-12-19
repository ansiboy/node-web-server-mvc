import { createWebserver, createBrowser, websitePhysicalPath } from "./common";
import { HomeController } from "./www/controllers/home";
import * as assert from "assert";
import { MVCRequestProcessor, MVCRequestProcessorConfig, response } from "../out";
import { HomeController as MyHomeController } from "./www/my-controllers/home";
import { pathConcat } from "maishu-node-web-server";

describe("mvc-request-processor", function () {


    let webServer = createWebserver();
    let browser = createBrowser();

    it("execute action", async function () {

        let url = `http://127.0.0.1:${webServer.port}/home/product/1`;

        await browser.visit(url);

        let ctrl = new HomeController();
        let r = ctrl.product({ id: "1" });
        assert.strictEqual(browser.source, JSON.stringify(r));
    })

    it("controllers path", async function () {

        // {
        //     requestProcessorConfigs: {
        //         MVC: mvcConfig
        //     }
        // }
        // let mvcConfig: MVCRequestProcessorConfig = {
        //     controllersDirectory: "my-controllers"
        // }
        webServer = createWebserver();
        var p = webServer.requestProcessors.find(MVCRequestProcessor);
        p.controllersDirectory = pathConcat(websitePhysicalPath, "my-controllers");
        let url = `http://127.0.0.1:${webServer.port}/my-controllers-index`;
        //my-controllers-index
        await browser.visit(url);
        let ctrl = new MyHomeController();
        let r = ctrl.index();
        assert.strictEqual(browser.source, r);


    })

    it("404", async function () {

        let mvcConfig: MVCRequestProcessorConfig = {
            controllersDirectory: "my-controllers"
        }
        webServer = createWebserver({
            // requestProcessorConfigs: {
            //     MVC: mvcConfig
            // }
        });

        var r = webServer.requestProcessors.find(MVCRequestProcessor);

        let url = `http://127.0.0.1:${webServer.port}/tttxxxtttaa`;
        try {
            await browser.visit(url);

        }
        catch (err) {
            assert.strictEqual(browser.response.status, 404);
        }

    })


})