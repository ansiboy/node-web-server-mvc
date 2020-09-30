"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var attributes_1 = require("./attributes");
exports.controller = attributes_1.controller;
exports.action = attributes_1.action;
exports.createParameterDecorator = attributes_1.createParameterDecorator;
exports.routeData = attributes_1.routeData;
exports.request = attributes_1.request;
exports.response = attributes_1.response;
exports.serverContext = attributes_1.serverContext;
var controller_1 = require("./controller");
exports.Controller = controller_1.Controller;
var virtual_directory_1 = require("./virtual-directory");
exports.createVirtualDirecotry = virtual_directory_1.createVirtualDirecotry;
var action_results_1 = require("./action-results");
exports.ContentResult = action_results_1.ContentResult;
exports.RedirectResult = action_results_1.RedirectResult;
exports.ProxyResut = action_results_1.ProxyResut;
var logger_1 = require("./logger");
exports.getLogger = logger_1.getLogger;
var mvc_1 = require("./mvc");
exports.MVCRequestProcessor = mvc_1.MVCRequestProcessor;
