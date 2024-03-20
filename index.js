class Game {
  constructor() {
    this.health = 100;
  }

  init() {
    var field = $('.field');
    field.empty();
    for (var i = 0; i < 20; i++) {
      for (var j = 0; j < 32; j++) {
        field.append('<div class="tile tileW"></div>');
      }
    }
  }
}
