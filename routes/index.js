var express = require('express');
var router = express.Router();
var path = require('path');
const fs = require("fs");

// eslint-disable-next-line no-undef
let routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.includes(".js") && route != "index.js") {
    router.use("/"+route.replace(".js", ""), require('./'+route));
  }
}

// eslint-disable-next-line no-undef
const adminPath = path.join(__dirname, "admin");

if (fs.existsSync(adminPath)) {
    let adminRoutes = fs.readdirSync(adminPath);

    for (let route of adminRoutes) {
        if (route.includes(".js") && route !== "index.js") {
            router.use("/admin/" + route.replace(".js", ""), require('./admin/' + route));
        }
    }
}


module.exports = router;