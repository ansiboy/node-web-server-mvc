"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors = require("./errors");
const fs = require("fs");
const maishu_node_web_server_1 = require("maishu-node-web-server");
function createVirtualDirecotry(...physicalPaths) {
    if (physicalPaths == null || physicalPaths.length == 0)
        throw errors.arugmentNull("physicalPaths");
    let root = new maishu_node_web_server_1.VirtualDirectory(physicalPaths[0]);
    if (physicalPaths.length == 1)
        return root;
    let dirStack = [...physicalPaths.filter((o, i) => i > 0).map(o => ({ physicalPath: o, virtualPath: "/" }))];
    while (dirStack.length > 0) {
        let item = dirStack.pop();
        if (item == null)
            continue;
        let names = fs.readdirSync(item.physicalPath);
        for (let i = 0; i < names.length; i++) {
            let physicalPath = maishu_node_web_server_1.pathConcat(item.physicalPath, names[i]);
            let virtualPath = maishu_node_web_server_1.pathConcat(item.virtualPath, names[i]);
            root.setPath(virtualPath, physicalPath);
            if (fs.statSync(physicalPath).isDirectory()) {
                dirStack.push({ physicalPath, virtualPath });
            }
        }
    }
    return root;
}
exports.createVirtualDirecotry = createVirtualDirecotry;
