import { pathConcat, RequestContext, VirtualDirectory } from "maishu-node-web-server";
import * as errors from './errors';
import { CONTROLLER_REGISTER } from "./attributes";
import { ActionPathFun, ControllerInfo } from "./types";
import { ActionInfo, createAPIControllerType } from "./api-controller";
import { RegisterCotnroller } from "./attributes";
import * as path from "path";
import { isRouteString } from "./router";
import * as fs from "fs";
import { createRouter } from "maishu-router";

const PathActions = "maishu-node-mvc-PathActions";
const RouteActions = "maishu-node-mvc-RouteActions";
const ControllerDefines = "maishu-node-mvc-ControllerDefines";

export class ControllerLoader {

    private _controllersDirectory: VirtualDirectory;

    constructor(controllersDirectory: VirtualDirectory) {
        if (controllersDirectory == null)
            throw errors.argumentNull("controllersDirectory");

        this._controllersDirectory = controllersDirectory;
        this.load();

        // // 说明：允许 controllersDirectory.physicalPath 对应的文件夹不存在
        // if (fs.existsSync(controllersDirectory.physicalPath)) {
        //     let dirPath = controllersDirectory.physicalPath;
        //     fs.watch(dirPath).on("change", (event, filePath) => {
        //         if (typeof filePath !== "string")
        //             return;

        //         let ext = path.extname(filePath);
        //         if (ext != ".js")
        //             return;

        //         if (!path.isAbsolute(filePath))
        //             filePath = pathConcat(dirPath, filePath);

        //         this.onFileOrDirChanged(filePath);
        //     })
        // }
        // else {
        //     // TODO: 监控文件
        // }
    }

    static get controllerDefines() {
        let r = (global as any)[ControllerDefines] = (global as any)[ControllerDefines] || [];
        return r;
    }

    /** 使用路径进行匹配的 action */
    get pathActions(): { [path: string]: ActionInfo } {
        let r = (global as any)[PathActions] = (global as any)[PathActions] || {};
        return r;
    }

    get routeActions(): (ActionInfo & { route: ActionPathFun })[] {
        let r = (global as any)[RouteActions] = (global as any)[RouteActions] || [];
        return r;
    }

    private load() {
        let controllerPaths: string[] = [];
        let stack: VirtualDirectory[] = [this._controllersDirectory];
        while (stack.length > 0) {
            let item = stack.shift() as VirtualDirectory;

            controllerPaths.push(...this.getControllerPaths(item));

            let dirDic = item.directories();
            let dirs = Object.getOwnPropertyNames(dirDic).map(n => dirDic[n]);
            stack.unshift(...dirs);
        }

        controllerPaths.forEach(c => {
            this.loadController(c);
            // this.watchFile(c);
        })

        //=============================================
        // 注册内置的控制器

        let controllerInfo = createAPIControllerType(() => {
            let actionInfos: ActionInfo[] = [
                ...Object.getOwnPropertyNames(this.pathActions).map(name => this.pathActions[name]),
                ...this.routeActions
            ];

            return actionInfos;
        });
        this.loadActionInfos(controllerInfo);
        //==============================================


    }

    private onFileOrDirChanged(physicalPath: string) {
        // fs.watch(physicalPath).on("change", (eventType, file) => {
        //===============================================================
        // clear controller
        delete require.cache[require.resolve(physicalPath)];
        for (let key in this.pathActions) {
            if (this.pathActions[key].controllerPhysicalPath == physicalPath)
                delete this.pathActions[key];
        }

        for (let key in this.routeActions) {
            if (this.routeActions[key].controllerPhysicalPath == physicalPath)
                delete this.routeActions[key];
        }
        //===============================================================
        if (fs.existsSync(physicalPath)) {
            let stat = fs.statSync(physicalPath);
            if (stat.isFile())
                this.loadController(physicalPath);
        }
    }

    /**
     * 获取指定文件夹中（包括子目录），控制器的路径。
     * @param dir 控制器的文件夹
     */
    private getControllerPaths(dir: VirtualDirectory) {
        let controllerPaths: string[] = []
        let filesDic = dir.files();
        let files = Object.getOwnPropertyNames(filesDic).map(n => filesDic[n]);
        files.forEach(p => {
            if (p.endsWith('.js')) {
                // 去掉 .js 后缀
                controllerPaths.push(p);
            }
        })
        return controllerPaths
    }

    private loadController(controllerPath: string): void {
        try {
            var mod = require(controllerPath);
            console.assert(mod != null);
            let propertyNames = Object.getOwnPropertyNames(mod)
            for (let i = 0; i < propertyNames.length; i++) {
                let ctrlType = mod[propertyNames[i]]
                let controllerInfo: ControllerInfo | null = null;
                let func: RegisterCotnroller = ctrlType.prototype == null ? null : ctrlType.prototype[CONTROLLER_REGISTER];
                if (func == null) {
                    continue;
                }

                controllerInfo = func(ControllerLoader.controllerDefines, controllerPath);
                console.assert(controllerInfo != null);
                let c = controllerInfo;
                console.assert((c.path || '') != '')
                this.loadActionInfos(c);
            }
        }
        catch (err: any) {
            console.error(err)
            throw innerErrors.loadControllerFail(controllerPath, err)
        }
    }

    private loadActionInfos(c: ControllerInfo) {
        c.actionDefines.forEach(a => {

            let actionPaths = a.paths || []
            if (actionPaths.length == 0) {
                actionPaths.push(pathConcat(c.path, a.memberName))
            }
            for (let i = 0; i < actionPaths.length; i++) {
                let actionPath = actionPaths[i];
                if (typeof actionPath == "string" && actionPath[0] != '/') {
                    actionPath = pathConcat(c.path, actionPath)
                }

                if (typeof actionPath == "function") {
                    this.routeActions.push({
                        route: actionPath, controllerType: c.type, memberName: a.memberName,
                        actionPath: actionPath, controllerPhysicalPath: c.physicalPath
                    });
                }
                else {
                    if (isRouteString(actionPath)) {
                        let p = createRouter(actionPath);//new UrlPattern(actionPath);
                        let route = (virtualPath: string) => {
                            return p.match(virtualPath);
                        };
                        this.routeActions.push({
                            route, controllerType: c.type, memberName: a.memberName,
                            actionPath, controllerPhysicalPath: c.physicalPath
                        });
                    }
                    else {
                        this.pathActions[actionPath] = {
                            controllerType: c.type, memberName: a.memberName,
                            actionPath, controllerPhysicalPath: c.physicalPath
                        }

                    }
                }
            }
        })
    }

    /** 
     * 通过指定的虚拟路径获取行为 
     * @param virtualPath 指定的路径
     */
    findAction(virtualPath: string, ctx: RequestContext) {

        if (!virtualPath) throw errors.argumentNull('virtualPath')

        // 将一个或多个的 / 变为一个 /，例如：/shop/test// 转换为 /shop/test/
        virtualPath = virtualPath.replace(/\/+/g, '/');

        // 去掉路径末尾的 / ，例如：/shop/test/ 变为 /shop/test, 如果路径 / 则保持不变
        if (virtualPath[virtualPath.length - 1] == '/' && virtualPath.length > 1)
            virtualPath = virtualPath.substr(0, virtualPath.length - 1);

        let actionInfo = this.pathActions[virtualPath];
        let controller: any = null;
        let action: any = null;
        let routeData: ReturnType<ActionPathFun> = null;
        let controllerPhysicalPath: string | undefined;

        if (actionInfo != null) {
            controller = new actionInfo.controllerType();
            controllerPhysicalPath = actionInfo.controllerPhysicalPath;
            action = controller[actionInfo.memberName]
            console.assert(action != null);
        }

        if (action == null) {
            for (let i = 0; i < this.routeActions.length; i++) {
                if (this.routeActions[i] == null)
                    continue;

                let r = this.routeActions[i].route(virtualPath, ctx);
                if (r) {
                    routeData = r || {};
                    for (let key in routeData) {
                        if (!routeData[key])
                            continue;

                        routeData[key] = decodeURIComponent(routeData[key]);
                    }
                    controller = new this.routeActions[i].controllerType();
                    controllerPhysicalPath = this.routeActions[i].controllerPhysicalPath;
                    action = controller[this.routeActions[i].memberName];
                    break;
                }
            }
        }

        if (action == null)
            return null;

        console.assert(controller != null);
        return { action, controller, routeData, controllerPhysicalPath };
    }

}

let innerErrors = {
    invalidAreaType(areaName: string, actualType: string) {
        let error = new Error(`Area ${areaName} type must be string or object, actual is ${actualType}.`)
        return error
    },
    parsePathFail(path: string) {
        let error = new Error(`Parse path ${path} fail.`)
        return error
    },
    invalidControllerType(areaName: string, controllerName: string, actualType: string) {
        let error = new Error(`Controller ${controllerName} of area ${areaName} type must be function or object, actual is ${actualType}.`)
        return error
    },
    invalidControllerTypeByPath(path: string, actualType: string) {
        let error = new Error(`Controller ${path} type must be function or object, actual is ${actualType}.`)
        return error
    },
    loadControllerFail(path: string, innerError: Error) {
        let msg = `Load controller '${path}' fail.`;
        let error = new Error(msg);
        error.name = innerErrors.loadControllerFail.name;
        error.innerError = innerError
        return error;
    },
    actionNotExists(path: string): Error {
        let msg = `Action '${path}' is not exists.`;
        let error = new Error(msg);
        error.name = innerErrors.actionNotExists.name;
        error.statusCode = 404
        return error;
    },
    controllerNotExist(controllerName: string, virtualPath: string) {
        let msg = `Control ${controllerName} is not exists, path is ${virtualPath}.`
        let error = new Error(msg)
        error.name = innerErrors.controllerNotExist.name
        error.statusCode = 404
        return error
    },
    controllerIsNotClass(controllerName: string) {
        let msg = `Control ${controllerName} is not a class.`
        let error = new Error(msg)
        error.name = innerErrors.controllerIsNotClass.name
        return error
    }
}