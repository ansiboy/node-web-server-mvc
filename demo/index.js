const { WebServer } = require("maishu-node-web-server");
const { MVCRequestProcessor } = require("maishu-nws-mvc");

let w = new WebServer({
    websiteDirectory: __dirname,
    port: 6252,

});

w.requestProcessors.add(new MVCRequestProcessor());

