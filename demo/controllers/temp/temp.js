
const { register } = require("../../../out");
class HomeController {
    index() {
        return "Hello World!!!";
    }
    test() {
        return "Hello World";
    }
    temp() {
        return "";
    }
}
register(HomeController, "temp", { index: "", test: "", temp: "" });
exports.default = HomeController;

