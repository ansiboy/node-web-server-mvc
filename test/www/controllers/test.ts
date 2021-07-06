import { RequestResult } from "maishu-node-web-server";
import { join } from "path";

import { controller, action, routeData } from '../../../out/index';

export class Test {
    @action()
    index() {
        let r: RequestResult = {
            content: "<html><body><h1>Hello World</h1><body><html>",
            headers: {
                "content-type": "text/html; charset=UTF-8"
            }
        }
        return r;
    }

    @action("/j")
    j() {
        return { a: 10, b: 10 }
    }

    @action("/product/:id")
    product(@routeData { id, name }) {
        return `id: ${id}, name: ${name}`;
    }
}
