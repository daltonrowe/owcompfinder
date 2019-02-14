var express = require("express");
var router = express.Router();

var mongo = require("mongodb").MongoClient;
var assert = require("assert");

var sanitizer = require("sanitizer");

// Mongo DB Host
var url = "mongodb://localhost:27017/owcomp";

mongo.connect(url, function(err, db) {
  assert.equal(null, err);

  db.collection("players").createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 600 }
  );
  db.collection("players").createIndex({ blizz_id: 1 }, { background: true });
  db.collection("players").createIndex({ list: 1 }, { background: true });
  db.collection("players").createIndex({ mic: 1 }, { background: true });
  db.collection("players").createIndex({ sr: 1 }, { background: true });
  db.collection("players").createIndex({ p0: 1 }, { background: true });
  db.close();
});

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

var heroes = {
  ana: "Ana",
  bas: "Bastion",
  dva: "D.Va",
  dmf: "Doomfist",
  gen: "Genji",
  han: "Hanzo",
  jnk: "Junkrat",
  luc: "Lúcio",
  mcr: "McCree",
  mei: "Mei",
  mer: "Mercy",
  pha: "Pharah",
  rea: "Reaper",
  rei: "Reinhardt",
  roa: "Roadhog",
  s76: "Solider: 76",
  sym: "Symmetra",
  tor: "Torbjörn",
  tra: "Tracer",
  wid: "Widowmaker",
  win: "Winston",
  zar: "Zarya",
  zen: "Zenyatta",
  som: "Sombra",
  ori: "Orisa"
};

var roles = {
  offense: ["dmf", "gen", "mcr", "pha", "rea", "s76", "som", "tra"],
  defense: ["bas", "han", "jnk", "mei", "tor", "wid"],
  tank: ["dva", "ori", "rei", "roa", "win", "zar"],
  support: ["ana", "luc", "mer", "sym", "zen"]
};

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "OW Comp Finder", heroes: heroes });
});

/* POST Create or update player */
router.post("/create-player", function(req, res, next) {
  var player = {
    blizz_id: sanitizer.escape(req.body.blizz_id),
    sr: parseInt(sanitizer.escape(req.body.sr)),
    p0: sanitizer.escape(req.body.p0),
    list: false,
    mic: false,
    region: sanitizer.escape(req.body.region),
    tags: ["none"],
    comp: [
      sanitizer.escape(req.body.p1),
      sanitizer.escape(req.body.p2),
      sanitizer.escape(req.body.p3),
      sanitizer.escape(req.body.p4),
      sanitizer.escape(req.body.p5)
    ],
    createdAt: new Date()
  };

  var tags = req.body.tags;

  if (req.body.tags !== "") {
    tags = sanitizer.escape(tags).replace(/ /g, "");
    tags = tags.split(",");
    player.tags = tags;
  }

  if (req.body.list !== undefined) {
    player.list = true;
  }

  if (req.body.mic !== undefined) {
    player.mic = true;
  }

  var cookie = {
    data: player,
    expires: addMinutes(new Date(), 3000)
  };

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);

    db.collection("players").update(
      {
        blizz_id: player.blizz_id
      },
      player,
      {
        upsert: true,
        multi: false
      }
    );

    db.close();
  });

  res.cookie("owcomp", JSON.stringify(cookie));
  res.redirect("/");
});

/* POST Find players by hero array */
router.post("/find-players", function(req, res, next) {
  var player = JSON.parse(req.cookies.owcomp).data;
  var search = req.body.search;

  var players = {};

  mongo.connect(url, function(err, db) {
    assert.equal(null, err);

    res.setHeader("Content-Type", "application/json");

    var searched = [];

    var promises = search.map(function(slot, index) {
      return new Promise(function(resolve, reject) {
        if (player.comp[index] !== "none") {
          var query = {
            p0: player.comp[index],
            blizz_id: {
              $ne: player.blizz_id
            },
            list: true,
            region: player.region,
            sr: {
              $gt: parseInt(player.sr) - 1000,
              $lt: parseInt(player.sr) + 1000
            }
          };

          switch (player.comp[index]) {
            case "offense":
              query.p0 = {
                $in: roles.offense
              };
              break;

            case "defense":
              query.p0 = {
                $in: roles.defense
              };
              break;

            case "tank":
              query.p0 = {
                $in: roles.tank
              };
              break;

            case "support":
              query.p0 = {
                $in: roles.support
              };
              break;
          }

          if (player.tags.length !== 0) {
            query.tags = {
              $all: player.tags
            };
          }

          var proj = {};

          function countSearched(string, arr) {
            var num = 0;
            for (var i = 0; i < arr.length; i++) {
              if (arr[i] === string) num++;
            }
            return num;
          }

          var skip = 0;

          if (searched.indexOf(player.comp[index]) !== -1) {
            skip = 10 * countSearched(player.comp[index], searched);
          }
          searched.push(player.comp[index]);

          db.collection("players")
            .find(query, proj)
            .sort({ createdAt: 1 })
            .limit(10)
            .skip(skip)
            .toArray(function(err, result) {
              if (err) throw err;
              players[slot] = result;
              resolve();
            });
        } else {
          players[slot] = [];
          resolve();
        }
      });
    });

    Promise.all(promises)
      .then(function() {
        res.send(players);
      })
      .catch(console.error);

    db.close();
  });
});

module.exports = router;
