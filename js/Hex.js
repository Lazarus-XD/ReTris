function Hex(sideLength, sides, hexAngle) {
  this.playThrough = 0;
  this.fillColor = [44, 62, 80];
  this.tempColor = [44, 62, 80];
  this.angularVelocity = 0;
  this.position = 0;
  this.dy = 0;
  this.dt = 1;
  this.sides = sides;
  this.blocks = [];
  this.angle = 180 / this.sides;
  this.targetAngle = this.angle;
  this.shakes = [];
  this.sideLength = sideLength;
  this.strokeColor = "blue";
  this.x = trueCanvas.width / 2;
  this.y = trueCanvas.height / 2;
  this.ct = 0;
  this.lastCombo = this.ct - settings.comboTime;
  this.lastColorScored = "#000";
  this.comboTime = 1;
  this.texts = [];
  this.lastRotate = Date.now();
  for (var i = 0; i < this.sides; i++) {
    this.blocks.push([]);
  }

  //Shakes the base shape when new block is attached to it
  this.shake = function (obj) {
    //lane as in particle lane
    var angle = 30 + obj.lane * 60;
    angle *= Math.PI / 180;
    var dx = Math.cos(angle) * obj.magnitude;
    var dy = Math.sin(angle) * obj.magnitude;
    gdx -= dx;
    gdy += dy;
    obj.magnitude /= 2 * (this.dt + 0.5);
    if (obj.magnitude < 1) {
      for (var i = 0; i < this.shakes.length; i++) {
        if (this.shakes[i] == obj) {
          this.shakes.splice(i, 1);
        }
      }
    }
  };

  this.addBlock = function (block) {
    if (!(gameState == 1 || gameState === 0)) return;
    block.settled = 1;
    block.tint = 0.6;
    var lane = this.sides - block.fallingLane; // -this.position;
    this.shakes.push({
      lane: block.fallingLane,
      magnitude:
        4.5 *
        (window.devicePixelRatio ? window.devicePixelRatio : 1) *
        settings.scale,
    });
    lane += this.position;
    lane = (lane + this.sides) % this.sides;
    block.distFromHex =
      (MainHex.sideLength / hexShape().denom) * Math.sqrt(hexShape().distSq) +
      block.height * this.blocks[lane].length;
    // CHANGE
    //   block.distFromHex =
    //   (MainHex.sideLength / 2) * Math.sqrt(3) +
    //   block.height * this.blocks[lane].length;
    this.blocks[lane].push(block);
    block.attachedLane = lane;
    block.checked = 1;
  };

  //To check if block collides with the base shape or on top of another block
  this.doesBlockCollide = function (block, position, tArr) {
    if (block.settled) {
      return;
    }

    if (position !== undefined) {
      arr = tArr;
      if (position <= 0) {
        if (
          block.distFromHex -
            block.iter * this.dt * settings.scale -
            (this.sideLength / hexShape().denom) *
              Math.sqrt(hexShape().distSq) <=
          0
          // CHANGE
          //   block.distFromHex -
          //     block.iter * this.dt * settings.scale -
          //     (this.sideLength / 2) * Math.sqrt(3) <=
          //   0
        ) {
          block.distFromHex =
            (this.sideLength / hexShape().denom) * Math.sqrt(hexShape().distSq);
          // CHANGE
          // block.distFromHex = (this.sideLength / 2) * Math.sqrt(3);
          block.settled = 1;
          block.checked = 1;
        } else {
          block.settled = 0;
          block.iter = 1.5 + (waveone.difficulty / 15) * 3;
        }
      } else {
        if (
          arr[position - 1].settled &&
          block.distFromHex -
            block.iter * this.dt * settings.scale -
            arr[position - 1].distFromHex -
            arr[position - 1].height <=
            0
        ) {
          block.distFromHex =
            arr[position - 1].distFromHex + arr[position - 1].height;
          block.settled = 1;
          block.checked = 1;
        } else {
          block.settled = 0;
          block.iter = 1.5 + (waveone.difficulty / 15) * 3;
        }
      }
    } else {
      var lane = this.sides - block.fallingLane; //  -this.position;
      lane += this.position;

      lane = (lane + this.sides) % this.sides;
      var arr = this.blocks[lane];

      if (arr.length > 0) {
        if (
          block.distFromHex +
            block.iter * this.dt * settings.scale -
            arr[arr.length - 1].distFromHex -
            arr[arr.length - 1].height <=
          0
        ) {
          //Sound for block impact on another block
          sfx.block.play(); //block on block

          block.distFromHex =
            arr[arr.length - 1].distFromHex + arr[arr.length - 1].height;
          this.addBlock(block);
        }
      } else {
        //CHANGE

        if (
          block.distFromHex +
            block.iter * this.dt * settings.scale -
            (this.sideLength / hexShape().denom) *
              Math.sqrt(hexShape().distSq) <=
          0
        ) {
          //Sound for block impact on the base shape
          sfx.block.play(); //block on ground

          block.distFromHex =
            (this.sideLength / hexShape().denom) * Math.sqrt(hexShape().distSq);
          this.addBlock(block);
        }
      }
    }
  };

  //Rotates the base shape clockwise or counter-clockwise
  this.rotate = function (steps) {
    sfx.hex.play();
    if (
      Date.now() - this.lastRotate < 75 &&
      !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    )
      return;
    if (!(gameState === 1 || gameState === 0)) return;
    this.position += steps;
    if (!history[this.ct]) {
      history[this.ct] = {};
    }

    if (!history[this.ct].rotate) {
      history[this.ct].rotate = steps;
    } else {
      history[this.ct].rotate += steps;
    }

    while (this.position < 0) {
      this.position += this.sides; //CHANGE from 6
    }

    this.position = this.position % this.sides;
    this.blocks.forEach(function (blocks) {
      blocks.forEach(function (block) {
        block.targetAngle = block.targetAngle - steps * hexAngle; //CHANGE FOR ANGLE 60
      });
    });

    this.targetAngle = this.targetAngle - steps * hexAngle; //CHANGE FOR ANGLE 60
    this.lastRotate = Date.now();
  };

  this.draw = function () {
    this.x = trueCanvas.width / 2;

    if (gameState != -2) {
      this.y = trueCanvas.height / 2;
    }
    this.sideLength = settings.hexWidth;
    gdx = 0;
    gdy = 0;
    for (var i = 0; i < this.shakes.length; i++) {
      this.shake(this.shakes[i]);
    }
    if (this.angle > this.targetAngle) {
      this.angularVelocity -= angularVelocityConst * this.dt;
    } else if (this.angle < this.targetAngle) {
      this.angularVelocity += angularVelocityConst * this.dt;
    }

    if (
      Math.abs(this.angle - this.targetAngle + this.angularVelocity) <=
      Math.abs(this.angularVelocity)
    ) {
      //do better soon
      this.angle = this.targetAngle;
      this.angularVelocity = 0;
    } else {
      this.angle += this.angularVelocity;
    }

    //Draws the base shape
    drawPolygon(
      this.x + gdx,
      this.y + gdy + this.dy,
      this.sides, //Number of sides on the polygon
      this.sideLength - hexShape().offset, //CHANGE this.sideLength added 75
      this.angle,
      arrayToColor(this.fillColor),
      0,
      "rgba(0,0,0,0)"
    );
  };
}

//Converts the passed array to rgb vale
function arrayToColor(arr) {
  return "rgb(" + arr[0] + "," + arr[1] + "," + arr[2] + ")";
}
