import { controller, register } from "./attributes";
import { ControllerType, ActionPath, ControllerInfo } from "./types";
import { pathConcat } from "maishu-node-web-server";

export type ActionInfo = {
    controllerType: ControllerType<any>, memberName: string, actionPath: ActionPath,
    controllerPhysicalPath: string
}

export function createAPIControllerType(getActionInfos: () => ActionInfo[]) {
    let APIControllerType = class APIController {
        async list() {
            let actionInfos = getActionInfos();
            let r = actionInfos.map(o => ({
                path: o.actionPath,
                controller: o.controllerType.name,
                action: o.memberName,
                filePath: o.controllerPhysicalPath,
            }))

            return r;
        }
    }
    return register(APIControllerType, pathConcat(__filename, ""), { "list": ["/api/action/list", "/nws/actions"] });

}