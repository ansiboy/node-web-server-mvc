
const { register } = require("../../out");
class HomeController {
    index() {
        return "Hello World!!!";
    }
    test() {
        return "Hello World";
    }
    upload() {
        return "";
    }
}
register(HomeController, "home", { index: "", test: "", temp: "" });
exports.default = HomeController;

