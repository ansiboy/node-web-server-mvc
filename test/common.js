"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Browser = require("zombie");
const fs = require("fs");
const path = require("path");
const out_1 = require("../out");
const maishu_node_web_server_1 = require("maishu-node-web-server");
exports.websitePhysicalPath = path.join(__dirname, "www");
function createWebserver(settings) {
    let defaultSettings = {
        // rootPath: __dirname,
        // staticRootDirectory: path.join(__dirname, "www"),
        // controllerDirectory: path.join(__dirname, "www", "controllers"),
        websiteDirectory: exports.websitePhysicalPath
    };
    settings = Object.assign(settings || {}, defaultSettings);
    let mvcRequestProcessor = new out_1.MVCRequestProcessor();
    let w = new maishu_node_web_server_1.WebServer(settings); //startServer(settings as Settings);
    w.requestProcessors.unshift(mvcRequestProcessor);
    console.log(`Web server port is ${w.port}.`);
    return w;
}
exports.createWebserver = createWebserver;
function createBrowser() {
    return new Browser();
}
exports.createBrowser = createBrowser;
function readFile(physicalPath) {
    if (physicalPath == null)
        throw new Error(`Argument physicalPaht is null.`);
    if (fs.existsSync(physicalPath) == false)
        throw new Error(`File ${physicalPath} is not exists.`);
    let buffer = fs.readFileSync(physicalPath);
    let source = buffer.toString();
    return source;
}
exports.readFile = readFile;
