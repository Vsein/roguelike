function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class Game {
  constructor() {
    this.height = 20;
    this.width = 32;
    this.field = [];
    this.player = { x: undefined, y: undefined, health: 100, damage: 20, status: 'alive' }
    this.enemies = [];
    this.enemyDamage = 15;
    this.lastEnemyMovements = undefined;
  }

  init() {
    this.#generateField();
    this.#initPlayerMovements();
    this.#initEnemyMovements();
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
        this.player.x = x;
        this.player.y = y;
      } else if (enemiesCnt < 10) {
        curType = 'E' + enemiesCnt;
        enemiesCnt++;
        var movementType = randomIntFromInterval(0, 1);
        this.enemies.push({ x, y, health: 100, status: 'alive', movementType });
      }
      this.field[y][x] = curType;
    }

    var DOMField = $('.field');
    DOMField.empty();
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        var tile = document.createElement('div');
        tile.classList.add('tile');
        if (this.field[i][j][0] === 'E') {
          tile.classList.add('tile' + this.field[i][j][0]);
          tile.classList.add(this.field[i][j][1]);
        } else {
          tile.classList.add('tile' + this.field[i][j]);
        }
        if (this.field[i][j] === 'P' || this.field[i][j][0] === 'E') {
          var healthbar = document.createElement('div');
          healthbar.classList.add('health');
          healthbar.style.width = '100%';
          tile.append(healthbar);
        }
        DOMField.append(tile);
      }
    }
  }

  #adjustCoordinate(coordinate, axis) {
    var limit = axis === 'x' ? this.width : this.height;
    var newCoordinate = coordinate;
    if (coordinate === limit) {
      newCoordinate = 0;
    }
    if (coordinate === -1) {
      newCoordinate = limit - 1;
    }
    return newCoordinate;
  }

  #updateEnemyHP(index) {
    var enemyTile = $(".tileE." + index);
    console.log(enemyTile);
    enemyTile.children('.health').css('width', this.enemies[index].health + '%');
    if (this.enemies[index].health <= 0) {
      enemyTile.removeClass();
      enemyTile.empty();
      enemyTile.addClass('tile');
    } else {
      this.player.health -= this.enemyDamage;
      if (this.player.health <= 0) {
        this.player.status = 'dead';
      }
    }
  }

  #getAxisOffsetsForMovement(key) {
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
    return { x: diffX, y: diffY };
  }

  #initPlayerMovements() {
    var self = this;
    function handleAttack() {
      for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) {
            continue;
          }
          var attackX = self.#adjustCoordinate(self.player.x + j, 'x');
          var attackY = self.#adjustCoordinate(self.player.y + i, 'y');
          var tileToAttack = self.field[attackY][attackX];
          if (tileToAttack[0] === 'E') {
            var ind = tileToAttack[1];
            console.log(self.enemies[ind]);
            self.enemies[ind].health -= self.player.damage;
            if (self.enemies[ind].health <= 0) {
              self.enemies[ind].status = 'dead';
              self.field[attackY][attackX] = '';
            }
            console.log(ind);
            self.#updateEnemyHP(ind);
          }
        }
      }
    }

    function handleKeypress(event) {
      var key = event.key.toLowerCase();
      if (self.player.status === 'dead' || "wasd ".indexOf(key) == -1) {
        return;
      }

      if (key === ' ') {
        handleAttack();
      }

      // registering where the player has moved
      var diff = self.#getAxisOffsetsForMovement(key);
      var newX = self.#adjustCoordinate(self.player.x + diff.x, 'x');
      var newY = self.#adjustCoordinate(self.player.y + diff.y, 'y');

      // handling the movement itself
      var newTileType = self.field[newY][newX];
      if (newTileType === 'W' || newTileType[0] === 'E') {
        return;
      }
      if (newTileType === 'SW') {
        self.player.damage *= 1.3;
      }
      if (newTileType === 'HP') {
        self.player.health = Math.min(100, self.player.health + 50);
      }
      self.field[newY][newX] = 'P';

      var previousTile = $(".tile").eq(self.player.y * self.width + self.player.x);
      previousTile.removeClass();
      previousTile.empty();
      previousTile.addClass('tile');
      self.field[self.player.y][self.player.x] = '';

      // setting new coordinates
      self.player.x = newX;
      self.player.y = newY;
      var newTile = $(".tile").eq(newY * self.width + newX);
      newTile.removeClass();
      newTile.addClass('tile');
      newTile.addClass('tileP');

      var healthbar = document.createElement('div');
      healthbar.classList.add('health');
      healthbar.style.width = self.player.health + '%';
      newTile.append(healthbar);
    }

    window.addEventListener("keypress", handleKeypress);
  }

  #handleEnemyMovements() {
    for (var i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].status === 'dead') continue;
      if (this.enemies[i].movementType <= 1) {
        // registering the enemy movement in a random direction
        var direction = randomIntFromInterval(0, 4);
        var correspondingKey = "wasd"[direction];
        var diff = this.#getAxisOffsetsForMovement(correspondingKey);
        var newX = this.#adjustCoordinate(this.enemies[i].x + diff.x, 'x');
        var newY = this.#adjustCoordinate(this.enemies[i].y + diff.y, 'y');

        // handling the movement itself
        var newTileType = this.field[newY][newX];
        if (newTileType === 'W' || newTileType[0] === 'E' || newTileType === 'P') {
          continue;
        }

        var previousTile = $(".tile").eq(this.enemies[i].y * this.width + this.enemies[i].x);
        previousTile.removeClass();
        previousTile.empty();
        previousTile.addClass('tile');
        this.field[this.enemies[i].y][this.enemies[i].x] = '';

        // setting new coordinates
        this.enemies[i].x = newX;
        this.enemies[i].y = newY;
        var newTile = $(".tile").eq(newY * this.width + newX);
        newTile.removeClass();
        newTile.addClass('tile');
        newTile.addClass('tileE');
        newTile.addClass(i.toString());
        this.field[newY][newX] = 'E' + i;

        var healthbar = document.createElement('div');
        healthbar.classList.add('health');
        healthbar.style.width = this.enemies[i].health + '%';
        newTile.append(healthbar);
      }
    }
  }

  #initEnemyMovements() {
    var self = this;
    setInterval(function() {
      self.#handleEnemyMovements();
    }, 1 * 1000)
  }
}
