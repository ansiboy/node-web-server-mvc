# node-web-server-mvc

node-web-server 的 MVC 插件

## NODE-WEB-SERVER 配置

```ts
let w = new WebServer({
  websiteDirectory: 'your-website-path',
  requestProcessorTypes: [
    MVCRequestProcessor,
    ...WebServer.defaultRequestProcessorTypes
  ]
})
```

**控制器的路径**

控制器的路径默认为 websiteDirectory 文件夹的子文件夹 controllers。可以通过配置修改该路径。

**例如：**

下面的示例中把控制器的路径改为 my-controllers 。

```ts
let w = new WebServer({
  websiteDirectory: 'your-website-path',
  requestProcessorTypes: [
    MVCRequestProcessor,
    ...WebServer.defaultRequestProcessorTypes
  ],
  requestProcessorConfigs: {
    MVC: {
      controllersPath: "my-controllers"
    }
  }
})
```
