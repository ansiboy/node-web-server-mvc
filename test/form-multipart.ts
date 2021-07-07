import { createBrowser, createWebserver } from "./common";
import { actionPaths } from "./www/actionPaths";
import fetch from "node-fetch";
import * as FormData from "form-data";

describe("form-multipart", function () {
    it("form-multipart", function () {
        let webServer = createWebserver();
        let url = `http://127.0.0.1:${webServer.port}${actionPaths.home.upload}`;

        let formData = new FormData();
        formData.append("first name", "shu");
        formData.append("last name", "mai");

        fetch(url, {
            method: "post",
            body: formData
        })
    })
})