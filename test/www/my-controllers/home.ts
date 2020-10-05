import { controller, action, createParameterDecorator, routeData } from '../../../out'
import { ConnectionOptions } from 'tls';
import { actionPaths } from '../actionPaths';
import { ContentResult } from '../../../out/action-results';

// function connection() {

// }

// function createParameterDecorator<T>(createParameter: () => T, disposeParameter: (parameter: T) => void) {
//     return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

//     }
// }

let connection = createParameterDecorator(
    async function () {
        debugger
        return {}
    },
    function () {
        debugger
    }
)

@controller()
/** 主页模块 */
export class HomeController {

    /**
     * 首页
     * @param conn 数据库连接
     * @param data 表单数据
     */
    @action("/my-controllers-index")
    index() {
        return 'home index'
    }

   
}
