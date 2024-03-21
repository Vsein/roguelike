function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class Game {
  constructor() {
    this.height = 20;
    this.width = 32;
    this.field = [];
    this.player = { x: undefined, y: undefined, health: 100, damage: 20, status: 'alive' }
    this.playerEvaded = false;
    this.enemies = [];
    this.enemyDamage = 15;
    this.enemiesSkipNextTurn = undefined;
  }

  init() {
    this.#generateField();
    this.#initPlayerMovements();
    this.#initEnemyMovements();
    this.#generatePotionsRandomly();
    this.#generateEnemiesRandomly();
    this.#generateSwordsRandomly();
  }

  #generateField() {
    // creating a 2d array with walls ('W')
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

    // generate the dom field
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

  #updatePlayerHP() {
    if (this.player.health <= 0) {
      this.player.status = 'dead';
    }
    var playerTile = $('.tileP');
    playerTile.children('.health').css('width', this.player.health + '%');
  }

  #updateEnemyHP(index) {
    this.enemies[index].health -= this.player.damage;
    var enemyTile = $(".tileE." + index);
    enemyTile.children('.health').css('width', this.enemies[index].health + '%');

    if (this.enemies[index].health <= 0) {
      this.enemies[index].status = 'dead';
      this.#handleItemsBeneathEnemy(this.enemies[index].x, this.enemies[index].y);
      enemyTile.removeClass('tileE');
      enemyTile.removeClass(index.toString());
      enemyTile.empty();
    } else {
      this.#updatePlayerHP();
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

  #handleAttack(x, y, initiator) {
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        var attackX = this.#adjustCoordinate(x + j, 'x');
        var attackY = this.#adjustCoordinate(y + i, 'y');
        var tileToAttack = this.field[attackY][attackX];
        if (initiator === 'player' && tileToAttack[0] === 'E') {
          var ind = tileToAttack[1];
          this.#updateEnemyHP(ind);
        }
        if (initiator === 'enemy' && tileToAttack === 'P') {
          this.player.health -= this.enemyDamage;
          this.#updatePlayerHP();
        }
      }
    }
  }

  #initPlayerMovements() {
    var self = this;

    function handleKeypress(event) {
      // check if the key is not WASD, or if the hero has died
      var key = event.key.toLowerCase();
      if (self.player.status === 'dead' || "wasd ".indexOf(key) == -1) {
        return;
      }

      // if the player attacked, engage in combat, otherwise try to evade
      if (key === ' ') {
        self.#handleAttack(self.player.x, self.player.y, 'player');
      } else {
        self.playerEvaded = Math.random() > 0.3 ? true : false;
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
      self.field[self.player.y][self.player.x] = '';
      self.field[newY][newX] = 'P';

      var previousTile = $(".tile").eq(self.player.y * self.width + self.player.x);
      previousTile.removeClass('tileP');
      previousTile.empty();

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

      self.enemiesSkipNextTurn = true;
      self.#handleEnemyMovements();
    }

    window.addEventListener("keypress", handleKeypress);
  }

  #handleItemsBeneathEnemy(x, y) {
    var everything = this.field[y][x].split(' ');
    if (everything.length > 1) {
      this.field[y][x] = everything[1];
    } else {
      this.field[y][x] = '';
    }
  }

  #handleEnemyMovements() {
    for (var i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].status === 'dead') continue;

      if (!this.playerEvaded) {
        this.#handleAttack(this.enemies[i].x, this.enemies[i].y, 'enemy');
      }

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
        previousTile.removeClass('tileE');
        previousTile.removeClass(i.toString());
        previousTile.empty();
        this.#handleItemsBeneathEnemy(this.enemies[i].x, this.enemies[i].y);

        // setting new coordinates
        this.enemies[i].x = newX;
        this.enemies[i].y = newY;
        var newTile = $(".tile").eq(newY * this.width + newX);
        newTile.addClass('tileE');
        newTile.addClass(i.toString());
        this.field[newY][newX] = 'E' + i + ' ' + this.field[newY][newX];

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
      // if there was some enemy movements recently, skip the enemies' turn
      if (!self.enemiesSkipNextTurn) {
        self.#handleEnemyMovements();
      } else {
        self.enemiesSkipNextTurn = false;
        self.playerEvaded = false;
      }
    }, 1 * 800);
  }

  #generateItem(type) {
    // function to generate some items
    // all to add some spice to the game
    var generated = false;
    while (!generated) {
      var x = randomIntFromInterval(0, this.width - 1);
      var y = randomIntFromInterval(0, this.height - 1);
      if (this.field[y][x] !== '') {
        continue;
      }
      this.field[y][x] = type;
      var tile = $(".tile").eq(y * this.width + x);
      tile.addClass('tile' + type);
      generated = true;
    }
  }

  #generatePotionsRandomly() {
    // generate 1 potion randomly every 10 seconds
    setInterval(this.#generateItem.bind(this, 'HP'), 10 * 1000);
  }

  #generateSwordsRandomly() {
    // generate 1 sword randomly every 30 seconds
    setInterval(this.#generateItem.bind(this, 'SW'), 30 * 1000);
  }

  #reviveEnemy() {
    // revive 1 enemy in a random place
    var enemyGenerated = false;
    var enemyIndex = -1;
    for (var i = 0; i < 10; i++) {
      if (this.enemies[i].status === 'dead') {
        enemyIndex = i;
        this.enemies[i].status = 'alive';
        this.enemies[i].health = 100;
        break;
      }
    }
    if (enemyIndex === -1) {
      enemyGenerated = true;
    }
    while (!enemyGenerated) {
      var x = randomIntFromInterval(0, this.width - 1);
      var y = randomIntFromInterval(0, this.height - 1);
      if (this.field[y][x] !== '') {
        continue;
      }
      this.field[y][x] = 'E';
      this.enemies[enemyIndex].x = x;
      this.enemies[enemyIndex].y = y;
      var tile = $(".tile").eq(y * this.width + x);
      tile.addClass('tileE');
      tile.addClass(enemyIndex.toString());
      enemyGenerated = true;
    }
  }

  #generateEnemiesRandomly() {
    // generate 1 enemy randomly every 10 seconds, if the amount of enemies < 10
    var self = this;
    setInterval(function() {
      var reviveCnt = 0;
      var deadCnt = 0;
      for (var i = 0; i < 10; i++) {
        if (self.enemies[i].status === 'dead') {
          deadCnt++;
        }
      }
      if (deadCnt === 10) {
        reviveCnt = 3;
      } else if (deadCnt >= 5) {
        reviveCnt = 2;
      } else {
        reviveCnt = 1;
      }
      while (reviveCnt--) {
        self.#reviveEnemy();
      }
    }, 10 * 1000);
  }
}
