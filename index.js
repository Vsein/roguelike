function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

class Game {
  constructor() {
    this.health = 100;
    this.height = 20;
    this.width = 32;
  }

  init() {
    var field = [];
    for (var i = 0; i < this.height; i++) {
      var row = [];
      for (var j = 0; j < this.width; j++) {
        row.push('W');
      }
      field.push(row);
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
          field[i][j] = '';
        }
      }
    }

    // generation of horizontal passages
    for (var i = 0; i < createdRooms.length / 2; i++) {
      var y = Math.min(createdRooms[i].y + Math.floor(createdRooms[i].height / 2), this.height - 2);
      for (var j = 0; j < this.width; j++) {
        field[y][j] = '';
      }
    }

    // generation of vertical passages
    for (var i = Math.ceil(createdRooms.length / 2); i < createdRooms.length; i++) {
      var x = Math.min(createdRooms[i].x + Math.floor(createdRooms[i].width / 2), this.width - 2);
      for (var j = 0; j < this.height; j++) {
        field[j][x] = '';
      }
    }
    console.log(createdRooms.length);

    var DOMField = $('.field');
    DOMField.empty();
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        var tile = document.createElement('div');
        tile.classList.add('tile');
        tile.classList.add('tile' + field[i][j]);
        DOMField.append(tile);
      }
    }
  }
}
