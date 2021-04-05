import { pathConcat, VirtualDirectory } from "maishu-node-web-server";
import * as errors from './errors';
import isClass = require('is-class');
import { CONTROLLER_REGISTER } from "./attributes";
import { ControllerInfo } from "./types";
import { ActionInfo, createAPIControllerType } from "./api-controller";
import { RegisterCotnroller } from "./attributes";
import * as path from "path";
import UrlPattern = require("url-pattern");
import { isRouteString } from "./router";
import * as fs from "fs";


export class ControllerLoader {

    private _controllerDefines: ControllerInfo[] = [];
    // 使用路径进行匹配的 action
    private _pathActions: { [path: string]: ActionInfo } = {};
    // 使用路由进行匹配的 action
    private _routeActions: (ActionInfo & { route: (virtualPath: string) => any })[] = [];
    private _controllersDirectory: VirtualDirectory;

    constructor(controllersDirectory: VirtualDirectory) {
        if (controllersDirectory == null)
            throw errors.arugmentNull("controllersDirectory");

        // if (!fs.existsSync(controllersDirectory.physicalPath))
        //     throw errors.physicalPathNotExists(controllersDirectory.physicalPath);

        this._controllersDirectory = controllersDirectory;
        this.load();

        // 说明：允许 controllersDirectory.physicalPath 对应的文件夹不存在
        if (fs.existsSync(controllersDirectory.physicalPath)) {
            let dirPath = controllersDirectory.physicalPath;
            fs.watch(dirPath).on("change", (event, filePath) => {
                if (typeof filePath !== "string")
                    return;

                let ext = path.extname(filePath);
                if (ext != ".js")
                    return;

                if (!path.isAbsolute(filePath))
                    filePath = pathConcat(dirPath, filePath);

                this.onFileOrDirChanged(filePath);
            })
        }
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
                ...Object.getOwnPropertyNames(this._pathActions).map(name => this._pathActions[name]),
                ...this._routeActions
            ];

            return actionInfos;
        }, this._controllerDefines);
        this.loadActionInfos(controllerInfo);
        //==============================================

        console.assert(this._controllerDefines != null);
    }

    private onFileOrDirChanged(physicalPath: string) {
        // fs.watch(physicalPath).on("change", (eventType, file) => {
        //===============================================================
        // clear controller
        delete require.cache[require.resolve(physicalPath)];
        for (let key in this._pathActions) {
            if (this._pathActions[key].controllerPhysicalPath == physicalPath)
                delete this._pathActions[key];
        }

        for (let key in this._routeActions) {
            if (this._routeActions[key].controllerPhysicalPath == physicalPath)
                delete this._routeActions[key];
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
                controllerPaths.push(p);//.substring(0, p.length - 3)
            }
        })
        return controllerPaths
    }

    // private joinPaths(path1: string, path2: string) {
    //     if (path1 == null) throw errors.arugmentNull('path1')
    //     if (path2 == null) throw errors.arugmentNull('path2')
    //     let p = path.join(path1, path2)
    //     p = p.replace(/\\/g, '/')
    //     return p
    // }


    private loadController(controllerPath: string): void {
        try {
            var mod = require(controllerPath);
            console.assert(mod != null);
            let propertyNames = Object.getOwnPropertyNames(mod)
            for (let i = 0; i < propertyNames.length; i++) {
                let ctrlType = mod[propertyNames[i]]
                if (!isClass(ctrlType)) {
                    continue
                }

                let controllerInfo: ControllerInfo | null = null;
                let func: RegisterCotnroller = ctrlType.prototype[CONTROLLER_REGISTER];
                if (func == null) {
                    continue;
                }

                controllerInfo = func(this._controllerDefines, controllerPath);
                console.assert(controllerInfo != null);
                let c = controllerInfo;
                console.assert((c.path || '') != '')
                this.loadActionInfos(c);
            }
        }
        catch (err) {
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
                    this._routeActions.push({
                        route: actionPath, controllerType: c.type, memberName: a.memberName,
                        actionPath: actionPath, controllerPhysicalPath: c.physicalPath
                    });
                }
                else {
                    if (isRouteString(actionPath)) {
                        let p = new UrlPattern(actionPath);
                        let route = (virtualPath: string) => {
                            return p.match(virtualPath);
                        };
                        this._routeActions.push({
                            route, controllerType: c.type, memberName: a.memberName,
                            actionPath, controllerPhysicalPath: c.physicalPath
                        });
                    }
                    else {
                        this._pathActions[actionPath] = {
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
    findAction(virtualPath: string) {

        if (!virtualPath) throw errors.arugmentNull('virtualPath')

        // 将一个或多个的 / 变为一个 /，例如：/shop/test// 转换为 /shop/test/
        virtualPath = virtualPath.replace(/\/+/g, '/');

        // 去掉路径末尾的 / ，例如：/shop/test/ 变为 /shop/test, 如果路径 / 则保持不变
        if (virtualPath[virtualPath.length - 1] == '/' && virtualPath.length > 1)
            virtualPath = virtualPath.substr(0, virtualPath.length - 1);

        let actionInfo = this._pathActions[virtualPath];
        let controller: any = null;
        let action: any = null;
        let routeData: { [key: string]: string } | null = null;
        let controllerPhysicalPath: string | undefined;

        if (actionInfo != null) {
            controller = new actionInfo.controllerType();
            controllerPhysicalPath = actionInfo.controllerPhysicalPath;
            action = controller[actionInfo.memberName]
            console.assert(action != null);
        }

        if (action == null) {
            for (let i = 0; i < this._routeActions.length; i++) {
                if (this._routeActions[i] == null)
                    continue;

                let r = this._routeActions[i].route(virtualPath);
                if (r) {
                    routeData = r;
                    controller = new this._routeActions[i].controllerType();
                    controllerPhysicalPath = this._routeActions[i].controllerPhysicalPath;
                    action = controller[this._routeActions[i].memberName];
                    break;
                }
            }
        }

        if (action == null)
            return null;

        console.assert(controller != null);
        return { action, controller, routeData, controllerPhysicalPath };
    }

    /** 路由行为 */
    get routeActions() {
        return this._routeActions;
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