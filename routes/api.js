var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  var data = {
    test: "one",
    test2: "two"
  };

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(data));
});

module.exports = router;
