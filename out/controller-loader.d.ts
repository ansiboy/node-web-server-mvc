import { VirtualDirectory } from "maishu-node-web-server";
import { ActionInfo } from "./api-controller";
export declare class ControllerLoader {
    #private;
    constructor(controllersDirectory: VirtualDirectory);
    private load;
    /**
   * 获取指定文件夹中（包括子目录），控制器的路径。
   * @param dir 控制器的文件夹
   */
    private getControllerPaths;
    private joinPaths;
    private loadController;
    /**
     * 通过指定的虚拟路径获取行为
     * @param virtualPath 指定的路径
     */
    findAction(virtualPath: string): {
        action: any;
        controller: any;
        routeData: {
            [key: string]: string;
        } | null;
        controllerPhysicalPath: string | undefined;
    } | null;
    /** 路由行为 */
    get routeActions(): (ActionInfo & {
        route: (virtualPath: string) => any;
    })[];
}
