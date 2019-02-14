var owcomp = {
  heroes: {
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
  },

  /* Get cookies needed for operation */
  cookie: {
    data: Cookies.get("owcomp"),
    json: function() {
      if (this.data !== undefined) {
        return $.parseJSON(this.data);
      }
    },
    player: function() {
      return this.json().data;
    }
  },

  findPlayers: function(data) {
    var comp = [];

    if (data === "all") {
      comp = ["p1", "p2", "p3", "p4", "p5"];
    } else {
      comp = data;
    }

    $.ajax({
      method: "POST",
      url: "/find-players",
      dataType: "json",
      contentType: "application/json",
      context: this.heroes,
      data: JSON.stringify({ search: comp })
    }).done(function(players) {
      console.log(players);

      for (var i = 1; i <= comp.length; i++) {
        var playersDisplay = $(".panel-" + i + " ul.players-display");
        $(playersDisplay).empty();

        if (players["p" + i].length > 0) {
          for (var j = players["p" + i].length - 1; j >= 0; j--) {
            var player = players["p" + i][j];
            var playerHtml = '<li class="' + player.p0 + '">';
            var micIcon = "";

            playerHtml += '<div class="info">';

            playerHtml += '<span class="hero">' + this[player.p0] + "</span>";

            if (player.mic === true) {
              micIcon = '<div class="mic-icon"></div>';
            }
            playerHtml +=
              '<span class="blizz_id">' + player.blizz_id + micIcon + "</span>";

            playerHtml += '<span class="sr">' + player.sr + "SR</span>";

            playerHtml += "</div>";

            if (player.tags[0] !== "none" && player.tags.length > 0) {
              playerHtml += '<span class="tags">Tags: ';

              for (var k = 0; k < player.tags.length; k++) {
                playerHtml += player.tags[k];

                if (k < player.tags.length - 1) {
                  playerHtml += ", ";
                }
              }
              playerHtml += "</span>";
            }

            playerHtml += "</li>";
            playersDisplay.append(playerHtml);
          }
        }
      }
    });
  },

  updateCookie: function() {
    console.log(document.cookie);
  },

  inputsFromCookie: function(json) {
    var player = this.cookie.player();

    $("input[name=blizz_id]").val(player.blizz_id);
    $("input[name=sr]").val(player.sr);

    if (player.list === false) {
      $("input[name=list]").prop("checked", false);
    }

    if (player.mic === true) {
      $("input[name=mic]").prop("checked", true);
    }

    $("select[name=region]").val(player.region);

    $("select[name=p0]").val(player.p0);
    $("select[name=p1]").val(player.comp[0]);
    $("select[name=p2]").val(player.comp[1]);
    $("select[name=p3]").val(player.comp[2]);
    $("select[name=p4]").val(player.comp[3]);
    $("select[name=p5]").val(player.comp[4]);

    $("button").text("Search / Refresh");

    var tags = "";

    if (player.tags[0] !== "none") {
      for (var i = player.tags.length - 1; i >= 0; i--) {
        tags += player.tags[i];

        if (i !== 0) {
          tags += ",";
        }
      }
      if (tags !== "") {
        $("input[name=tags]").val(tags);
      }
    }
  },

  /* Refresh and setup views */
  refresh: function(view) {
    switch (view) {
      case "new":
        break;

      case "cookie":
        this.updateCookie();
        break;

      case "comp-search":
        this.findPlayers("all");
        break;

      case "stats":
        break;

      case "user-input":
        this.inputsFromCookie(this.cookie.json());
        break;

      default:
        break;
    }
  },

  validate: function() {
    $("#input-form").on("submit", null, function(event) {
      var blizz_id = $("input[name=blizz_id]").val();

      blizz_id = blizz_id.split("#");

      if (blizz_id.length === 2 && isNaN(blizz_id[1]) === false) {
        return true;
      } else {
        event.preventDefault();
        $("input[name=blizz_id]")
          .css("border", "2px dashed red")
          .css("padding", "2em");
        return false;
      }
    });
  },

  copywatch: function() {},

  /* Find out which view to use based on cookie data */
  findView: function() {},

  /* Initial setup */
  init: function() {
    if (this.cookie.data !== undefined) {
      console.log(this.cookie.player());

      this.refresh("user-input");
      this.refresh("comp-search");
    } else {
      this.refresh("new");
    }

    this.validate();
  }
};

$(document).ready(function() {
  owcomp.init();
});
