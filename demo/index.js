const { startServer } = require("maishu-nwsp");

let w = startServer({
    rootDirectory: __dirname,
    port: 6252
})