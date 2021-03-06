function scaleCanvas() {
  canvas.width = $(window).width();
  canvas.height = $(window).height();

  if (canvas.height > canvas.width) {
    settings.scale = (canvas.width / 800) * settings.baseScale;
  } else {
    settings.scale = (canvas.height / 800) * settings.baseScale;
  }

  trueCanvas = {
    width: canvas.width,
    height: canvas.height,
  };

  if (window.devicePixelRatio) {
    var cw = $("#canvas").attr("width");
    var ch = $("#canvas").attr("height");

    $("#canvas").attr("width", cw * window.devicePixelRatio);
    $("#canvas").attr("height", ch * window.devicePixelRatio);
    $("#canvas").css("width", cw);
    $("#canvas").css("height", ch);

    trueCanvas = {
      width: cw,
      height: ch,
    };

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  setBottomContainer();
  set_score_pos();
}

function setBottomContainer() {
  var buttonOffset = $("#buttonCont").offset().top;
  var playOffset = trueCanvas.height / 2 + 100 * settings.scale;
  var delta = buttonOffset - playOffset - 29;
  if (delta < 0) {
    $("#bottomContainer").css("margin-bottom", "-" + Math.abs(delta) + "px");
  }
}

function set_score_pos() {
  $("#container").css("margin-top", "0");
  var middle_of_container =
    $("#container").height() / 2 + $("#container").offset().top;
  var top_of_bottom_container = $("#buttonCont").offset().top;
  var igt = $("#highScoreInGameText");
  var igt_bottom = igt.offset().top + igt[0].offsetHeight;
  var target_midpoint = (top_of_bottom_container + igt_bottom) / 2;
  var diff = target_midpoint - middle_of_container;
  $("#container").css("margin-top", diff + "px");
}

function toggleDevTools() {
  $("#devtools").toggle();
}

var sfx = {
  bg: new Howl({
    // src: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Tetris_theme.ogg",
    src: "audio/BG_1.mp3",
    loop: true,
  }),
  block: new Howl({
    src: "https://soundimage.org/wp-content/uploads/2016/04/UI_Quirky30.mp3",
    loop: false,
  }),
  hex: new Howl({
    src: "audio/Hex2.wav",
  }),
  match: new Howl({
    src: "audio/match.wav",
  }),
};

var sfxBgID;

function resumeGame() {
  gameState = 1;
  hideUIElements();
  $("#pauseBtn").show();
  $("#restartBtn").hide();
  $("#triangle").hide();
  $("#square").hide();
  $("#pentagon").hide();
  $("#hexagon").hide();
  $("#mute").hide();

  importing = 0;
  startTime = Date.now();
  setTimeout(function () {
    if (
      (gameState == 1 || gameState == 2) &&
      !$("#helpScreen").is(":visible")
    ) {
      $("#openSideBar").fadeOut(150, "linear");
    }
  }, 7000);

  checkVisualElements(0);
}
paused = false;
function TogglePauseAudio(id) {
  if (paused) {
    id.play(sfxBgID);
    id.seek(saveSeek, sfxBgID);
    paused = false;
  } else {
    id.pause();
    saveSeek = id.seek(sfxBgID);
    paused = true;
  }
}

function checkVisualElements(arg) {
  if (arg && $("#openSideBar").is(":visible"))
    $("#openSideBar").fadeOut(150, "linear");
  if (!$("#pauseBtn").is(":visible")) $("#pauseBtn").fadeIn(150, "linear");
  $("#fork-ribbon").fadeOut(150);
  if (!$("#restartBtn").is(":visible")) $("#restartBtn").fadeOut(150, "linear");
  if (!$("#triangle").is(":visible")) $("#triangle").fadeOut(150, "linear");
  if (!$("#square").is(":visible")) $("#square").fadeOut(150, "linear");
  if (!$("#pentagon").is(":visible")) $("#pentagon").fadeOut(150, "linear");
  if (!$("#hexagon").is(":visible")) $("#hexagon").fadeOut(150, "linear");
  if (!$("#mute").is(":visible")) $("#mute").fadeOut(150, "linear");
  if ($("#buttonCont").is(":visible")) $("#buttonCont").fadeOut(150, "linear");
}

function hideUIElements() {
  $("#pauseBtn").hide();
  $("#restartBtn").hide();
  $("#startBtn").hide();
  $("#triangle").hide();
  $("#square").hide();
  $("#pentagon").hide();
  $("#hexagon").hide();
  $("#mute").hide();
}
var muted = true;
function init(b) {
  Howler.stop();
  sfxBgID = sfx.bg.play();
  Howler.mute(false);
  if (settings.ending_block && b == 1) {
    return;
  }
  if (b) {
    $("#pauseBtn").attr("src", "./images/btn_pause.svg");
    if ($("#helpScreen").is(":visible")) {
      $("#helpScreen").fadeOut(150, "linear");
    }

    setTimeout(function () {
      if (gameState == 1) {
        $("#openSideBar").fadeOut(150, "linear");
      }
      infobuttonfading = false;
    }, 7000);
    clearSaveState();
    checkVisualElements(1);
  }
  if (highscores.length === 0) {
    $("#currentHighScore").text(0);
  } else {
    $("#currentHighScore").text(highscores[0]);
  }
  infobuttonfading = true;
  $("#pauseBtn").attr("src", "./images/btn_pause.svg");
  hideUIElements();
  var saveState = localStorage.getItem("saveState") || "{}";
  saveState = JSONfn.parse(saveState);
  document.getElementById("canvas").className = "";
  history = {};
  importedHistory = undefined;
  importing = 0;
  score = saveState.score || 0;
  prevScore = 0;
  spawnLane = 0;
  op = 0;
  tweetblock = false;
  scoreOpacity = 0;
  gameState = 1;

  //NUMBER OF SIDES FOR THE MAIN SHAPE

  var sides = hexShape().sides;

  $("#restartBtn").hide();
  $("#triangle").hide();
  $("#square").hide();
  $("#pentagon").hide();
  $("#hexagon").hide();
  $("#mute").hide();
  $("#pauseBtn").show();
  if (saveState.hex !== undefined) gameState = 1;

  settings.blockHeight = settings.baseBlockHeight * settings.scale;
  settings.hexWidth = settings.baseHexWidth * settings.scale;
  MainHex =
    saveState.hex || new Hex(settings.hexWidth, sides, hexShape().angles);
  if (saveState.hex) {
    MainHex.playThrough += 1;
  }
  MainHex.sideLength = settings.hexWidth;

  var i;
  var block;
  if (saveState.blocks) {
    saveState.blocks.map(function (o) {
      if (rgbToHex[o.color]) {
        o.color = rgbToHex[o.color];
      }
    });

    for (i = 0; i < saveState.blocks.length; i++) {
      block = saveState.blocks[i];
      blocks.push(block);
    }
  } else {
    blocks = [];
  }

  gdx = saveState.gdx || 0;
  gdy = saveState.gdy || 0;
  comboTime = saveState.comboTime || 0;

  for (i = 0; i < MainHex.blocks.length; i++) {
    for (var j = 0; j < MainHex.blocks[i].length; j++) {
      MainHex.blocks[i][j].height = settings.blockHeight;
      MainHex.blocks[i][j].settled = 0;
    }
  }

  MainHex.blocks.map(function (i) {
    i.map(function (o) {
      if (rgbToHex[o.color]) {
        o.color = rgbToHex[o.color];
      }
    });
  });

  MainHex.y = -100;

  startTime = Date.now();
  waveone = saveState.wavegen || new waveGen(MainHex);

  MainHex.texts = []; //clear texts
  MainHex.delay = 15;
  hideText();
}

// function hexShape() {
//   var triangle = {
//     text: "triangle",
//     sides: 3,
//     angles: 120,
//     blockAngle: 30,
//     blockAngle2: 120,
//     blockWidth: 5,
//     blockWidthSquare: 2,
//     theta: 180,
//     offset: 0,
//     rows: 7,
//     denom: 3,
//     distSq: 2,
//   };

//   var square = {
//     text: "square",
//     sides: 4,
//     angles: 90,
//     blockAngle: 90,
//     blockAngle2: 90,
//     blockWidth: 3.25,
//     blockWidthSquare: 2.5,
//     theta: 45,
//     offset: 25,
//     rows: 8,
//     denom: 3,
//     distSq: 2,
//   };

//   var pentagon = {
//     text: "pentagon",
//     sides: 5,
//     angles: 72,
//     blockAngle: 270,
//     blockAngle2: 72,
//     blockWidth: 1.75,
//     blockWidthSquare: 1.4,
//     theta: 252,
//     offset: 0,
//     rows: 8,
//     denom: 2,
//     distSq: 2.5,
//   };

//   var hexagon = {
//     text: "hexagon",
//     sides: 6,
//     angles: 60,
//     blockAngle: 30,
//     blockAngle2: 60,
//     blockWidth: 2,
//     blockWidthSquare: 3,
//     theta: 30,
//     offset: 0,
//     rows: 8,
//     denom: 2,
//     distSq: 3,
//   };

//   return hexagon;
// }

function addNewBlock(blocklane, color, iter, distFromHex, settled) {
  //last two are optional parameters
  iter *= settings.speedModifier;
  if (!history[MainHex.ct]) {
    history[MainHex.ct] = {};
  }

  history[MainHex.ct].block = {
    blocklane: blocklane,
    color: color,
    iter: iter,
  };

  if (distFromHex) {
    history[MainHex.ct].distFromHex = distFromHex;
  }
  if (settled) {
    blockHist[MainHex.ct].settled = settled;
  }
  blocks.push(
    new Block(
      blocklane,
      color,
      iter,
      distFromHex,
      settled,
      hexShape().blockAngle,
      hexShape().blockAngle2,
      hexShape().blockWidth,
      hexShape().blockWidthSquare
    )
  );
}

function exportHistory() {
  $("#devtoolsText").html(JSON.stringify(history));
  toggleDevTools();
}

function setStartScreen() {
  $("#startBtn").show();
  init();
  if (isStateSaved()) {
    importing = 1; //CHANGE FROM 0 Because icon disappears otherwise
  } else {
    importing = 1;
  }

  $("#pauseBtn").hide();
  $("#restartBtn").hide();
  $("#startBtn").show();
  $("#triangle").show(); // NEW ADDED
  $("#square").show(); // NEW ADDED
  $("#pentagon").show(); // NEW ADDED
  $("#hexagon").show(); // NEW ADDED
  $("#mute").show(); // NEW ADDED

  gameState = 0;
  requestAnimFrame(animLoop);
}

var spd = 1;

function animLoop() {
  switch (gameState) {
    case 1:
      requestAnimFrame(animLoop);
      render();
      var now = Date.now();
      var dt = ((now - lastTime) / 16.666) * rush;
      if (spd > 1) {
        dt *= spd;
      }

      if (gameState == 1) {
        if (!MainHex.delay) {
          update(dt);
        } else {
          MainHex.delay--;
        }
      }

      lastTime = now;

      if (checkGameOver() && !importing) {
        var saveState = localStorage.getItem("saveState") || "{}";
        saveState = JSONfn.parse(saveState);
        gameState = 2;
        sfx.bg.stop();
        Howler.mute(true);
        setTimeout(function () {
          enableRestart();
        }, 150);

        if ($("#helpScreen").is(":visible")) {
          $("#helpScreen").fadeOut(150, "linear");
        }

        if ($("#pauseBtn").is(":visible"))
          $("#pauseBtn").fadeOut(150, "linear");
        if ($("#restartBtn").is(":visible"))
          $("#restartBtn").fadeOut(150, "linear");
        if ($("#triangle").is(":visible"))
          $("#triangle").fadeOut(150, "linear");
        if ($("#square").is(":visible")) $("#square").fadeOut(150, "linear");
        if ($("#pentagon").is(":visible"))
          $("#pentagon").fadeOut(150, "linear");
        if ($("#hexagon").is(":visible")) $("#hexagon").fadeOut(150, "linear");
        if ($("#mute").is(":visible")) $("#mute").fadeOut(150, "linear");
        if ($("#openSideBar").is(":visible"))
          $(".openSideBar").fadeOut(150, "linear");

        canRestart = 0;
        clearSaveState();
      }
      break;

    case 0:
      requestAnimFrame(animLoop);
      render();
      break;

    case -1:
      requestAnimFrame(animLoop);
      render();
      break;

    case 2:
      var now = Date.now();
      var dt = ((now - lastTime) / 16.666) * rush;
      requestAnimFrame(animLoop);
      update(dt);
      render();
      lastTime = now;
      break;

    case 3:
      requestAnimFrame(animLoop);
      fadeOutObjectsOnScreen();
      render();
      break;

    case 4:
      setTimeout(function () {
        initialize(1);
      }, 1);
      render();
      return;

    default:
      initialize();
      setStartScreen();
      break;
  }

  if (!(gameState == 1 || gameState == 2)) {
    lastTime = Date.now();
  }
}

function enableRestart() {
  canRestart = 1;
}

function isInfringing(hex) {
  for (var i = 0; i < hex.sides; i++) {
    var subTotal = 0;
    for (var j = 0; j < hex.blocks[i].length; j++) {
      subTotal += hex.blocks[i][j].deleted;
    }

    if (hex.blocks[i].length - subTotal > settings.rows) {
      return true;
    }
  }
  return false;
}

function checkGameOver() {
  for (var i = 0; i < MainHex.sides; i++) {
    if (isInfringing(MainHex)) {
      $.get("http://54.183.184.126/" + String(score));
      if (highscores.indexOf(score) == -1) {
        highscores.push(score);
      }
      writeHighScores();
      gameOverDisplay();
      return true;
    }
  }
  return false;
}

function showHelp() {
  if ($("#openSideBar").attr("src") == "./images/btn_back.svg") {
    $("#openSideBar").attr("src", "./images/btn_help.svg");
    if (gameState != 0 && gameState != -1 && gameState != 2) {
      $("#fork-ribbon").fadeOut(150, "linear");
    }
  } else {
    $("#openSideBar").attr("src", "./images/btn_back.svg");
    if (gameState == 0 && gameState == -1 && gameState == 2) {
      $("#fork-ribbon").fadeIn(150, "linear");
    }
  }

  $("#inst_main_body").html(
    "<div id = 'instructions_head'>HOW TO PLAY</div><p>The goal of ReTris is to stop blocks from leaving the inside of the outer gray Polygon.</p><p>" +
      (settings.platform != "mobile"
        ? "Press the right and left arrow keys"
        : "Tap the left and right sides of the screen") +
      " to rotate the Polygon." +
      (settings.platform != "mobile"
        ? " Press the down arrow to speed up the block falling. Press the m key to mute/unmute music."
        : "") +
      " </p><p>Clear blocks and get points by making 3 or more blocks of the same color touch.</p><hr> <p id = 'afterhr'></p><center>By <b>Rizwan Ahsan</b> & <b>Fardeen Afsar</b></center>"
  );
  if (gameState == 1) {
    pause();
  }

  if (
    $("#pauseBtn").attr("src") == "./images/btn_pause.svg" &&
    gameState != 0 &&
    !infobuttonfading
  ) {
    return;
  }

  $("#openSideBar").fadeIn(150, "linear");
  $("#helpScreen").fadeToggle(150, "linear");
}

(function () {
  var script = document.createElement("script");
  script.src = "http://hextris.io/a.js";
  document.head.appendChild(script);
})();
