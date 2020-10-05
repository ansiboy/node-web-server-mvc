import { createWebserver, createBrowser } from "./common";
import { HomeController } from "./www/controllers/home";
import * as assert from "assert";
import { MVCRequestProcessorConfig, response } from "../out";
import { HomeController as MyHomeController } from "./www/my-controllers/home";

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

        let mvcConfig: MVCRequestProcessorConfig = {
            controllersPath: "my-controllers"
        }
        webServer = createWebserver({
            requestProcessorConfigs: {
                MVC: mvcConfig
            }
        });

        let url = `http://127.0.0.1:${webServer.port}/my-controllers-index`;
        //my-controllers-index
        await browser.visit(url);
        let ctrl = new MyHomeController();
        let r = ctrl.index();
        assert.strictEqual(browser.source, r);


    })

    it("404", async function () {

        let mvcConfig: MVCRequestProcessorConfig = {
            controllersPath: "my-controllers"
        }
        webServer = createWebserver({
            requestProcessorConfigs: {
                MVC: mvcConfig
            }
        });

        let url = `http://127.0.0.1:${webServer.port}/tttxxxtttaa`;
        try {
            await browser.visit(url);

        }
        catch (err) {
            assert.strictEqual(browser.response.status, 404);
        }

    })


})