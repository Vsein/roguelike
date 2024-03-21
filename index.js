function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class Game {
  constructor() {
    this.health = 100;
    this.height = 20;
    this.width = 32;
    this.field = [];
    this.playerX;
    this.playerY;
  }

  #generateField() {
    this.field = [];
    for (var i = 0; i < this.height; i++) {
      var row = [];
      for (var j = 0; j < this.width; j++) {
        row.push('W');
      }
      this.field.push(row);
    }

    // random generation of rooms
    var rooms = randomIntFromInterval(5, 10);
    var createdRooms = [];
    while (createdRooms.length < rooms) {
      var height = randomIntFromInterval(3, 8);
      var width = randomIntFromInterval(3, 8);
      var x = randomIntFromInterval(0, this.width - 3);
      var y = randomIntFromInterval(0, this.height - 3);
      createdRooms.push({height, width, x, y});
      for (var i = y; i < Math.min(this.height, y + height); i++) {
        for (var j = x; j < Math.min(this.width, x + width); j++) {
          this.field[i][j] = '';
        }
      }
    }

    // generation of horizontal passages
    for (var i = 0; i < createdRooms.length / 2; i++) {
      var y = Math.min(createdRooms[i].y + Math.floor(createdRooms[i].height / 2), this.height - 2);
      for (var j = 0; j < this.width; j++) {
        this.field[y][j] = '';
      }
    }

    // generation of vertical passages
    for (var i = Math.ceil(createdRooms.length / 2); i < createdRooms.length; i++) {
      var x = Math.min(createdRooms[i].x + Math.floor(createdRooms[i].width / 2), this.width - 2);
      for (var j = 0; j < this.height; j++) {
        this.field[j][x] = '';
      }
    }

    // generation of the player, objects and enemies
    var swordsCnt = 0;
    var potionsCnt = 0;
    var heroCnt = 0;
    var enemiesCnt = 0;
    while (swordsCnt < 2 || potionsCnt < 10 || heroCnt < 1 || enemiesCnt < 10) {
      var x = randomIntFromInterval(0, this.width - 1);
      var y = randomIntFromInterval(0, this.height - 1);
      if (this.field[y][x] !== '') {
        continue;
      }
      var curType = '';
      if (swordsCnt < 2) {
        curType = 'SW';
        swordsCnt++;
      } else if (potionsCnt < 10) {
        curType = 'HP';
        potionsCnt++;
      } else if (heroCnt < 1) {
        curType = 'P';
        heroCnt++;
        this.playerX = x;
        this.playerY = y;
      } else if (enemiesCnt < 10) {
        curType = 'E';
        enemiesCnt++;
      }
      this.field[y][x] = curType;
    }

    var DOMField = $('.field');
    DOMField.empty();
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        var tile = document.createElement('div');
        tile.classList.add('tile');
        tile.classList.add('tile' + this.field[i][j]);
        if (this.field[i][j] === 'P' || this.field[i][j] === 'E') {
          var healthbar = document.createElement('div');
          healthbar.classList.add('health');
          healthbar.style.width = '100%';
          tile.append(healthbar);
        }
        DOMField.append(tile);
      }
    }
  }

  #initPlayerMovements() {
    var self = this;
    function handleKeypress(event) {
      var key = event.key.toLowerCase();
      if ("wasd".indexOf(key) == -1) {
        return;
      }

      // registering where the player has moved
      var diffX = 0;
      var diffY = 0;
      if (key === 'w') {
        diffY = -1;
      } else if (key === 'a') {
        diffX = -1;
      } else if (key === 's') {
        diffY = 1;
      } else if (key === 'd') {
        diffX = 1;
      }

      // setting new coordinates
      var newX = self.playerX + diffX;
      var newY = self.playerY + diffY;
      if (self.playerX + diffX === self.width) {
        newX = 0;
      }
      if (self.playerX + diffX === -1) {
        newX = self.width - 1;
      }
      if (self.playerY + diffY === self.height) {
        newY = 0;
      }
      if (self.playerY + diffY === -1) {
        newY = self.height - 1;
      }

      // handling the movement itself
      var newTileType = self.field[newY][newX];
      console.log(newTileType);
      if (newTileType === 'W' || newTileType === 'E') {
        return;
      }
      var previousTile = $(".tile").eq(self.playerY * self.width + self.playerX);
      previousTile.removeClass();
      previousTile.empty();
      previousTile.addClass('tile');

      self.playerX = newX;
      self.playerY = newY;
      var newTile = $(".tile").eq(newY * self.width + newX);
      newTile.removeClass();
      newTile.addClass('tile');
      newTile.addClass('tileP');

      var healthbar = document.createElement('div');
      healthbar.classList.add('health');
      healthbar.style.width = '100%';
      newTile.append(healthbar);
    }

    window.addEventListener("keypress", handleKeypress);
  }

  init() {
    this.#generateField();
    this.#initPlayerMovements();
  }
}
