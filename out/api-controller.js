"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("./controller");
const attributes_1 = require("./attributes");
function createAPIControllerType(getActionInfos, serverContext) {
    let APIControllerType = class APIController extends controller_1.Controller {
        async list() {
            let actionInfos = getActionInfos();
            let r = actionInfos.map(o => ({
                path: o.actionPath,
                controller: o.controllerType.name,
                action: o.memberName,
                filePath: o.controllerPhysicalPath,
            }));
            return r;
        }
    };
    attributes_1.register(APIControllerType, serverContext, __filename).action("list", ["/api/action/list"]);
    return APIControllerType;
}
exports.createAPIControllerType = createAPIControllerType;
