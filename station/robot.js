const { map, findFirstCoordinate } = require("./map");
const ExpertSystem = require("./expret_system")

class Robot {
  constructor() {
    this.coordinates = findFirstCoordinate(); // [x, y, z]
    this.mode = 'ручной'; // автоматический, ручной
    this.direction = 'север'; // север +z, юг -z, восток +x, запад -x
    this.health = 10000;
    this.criticalError = false;
    this.criticalErrorInterval = null;
    this.autoModeInterval = null;
    this.expert_system = undefined;
    this.going_circles = false;
    this.executing_basic_program = false;
  }

  getStationTemperature() {
    let baseTemperature = 0;
    const surfaceType = map[this.coordinates[0]][this.coordinates[1]][this.coordinates[2]]

    switch (surfaceType) {
      case "воздух":
        baseTemperature = 20;
        break;
      case "почва":
        baseTemperature = 15;
        break;
      case "вода":
        baseTemperature = 10;
        break;
      case "кислотная поверхность":
        baseTemperature = 100;
        break;
      default:
        baseTemperature = 20;
    }

    const randomTemperatureChange = Math.random() * 5 - 2.5;

    const temperature = baseTemperature + randomTemperatureChange;

    return temperature;
  }

  move(direction, steps) {
    const current_z = this.coordinates[1];
    let future_coordinates = [...this.coordinates];

    switch (direction) {
      case 'север':
        future_coordinates[2] += steps;
        break;
      case 'юг':
        future_coordinates[2] -= steps;
        break;
      case 'восток':
        future_coordinates[0] += steps;
        break;
      case 'запад':
        future_coordinates[0] -= steps;
        break;
    }

    if (future_coordinates[0] < 0 || future_coordinates[0] >= map.length) {
      return;
    }

    if (future_coordinates[2] < 0 || future_coordinates[2] >= map[0][0].length) {
      return;
    }

    if (map[future_coordinates[0]][future_coordinates[2]][future_coordinates[1]] !== 'воздух') {
      future_coordinates[1] = current_z + 1;
      if (map[future_coordinates[0]][future_coordinates[2]][future_coordinates[1]] !== 'воздух'
        && map[future_coordinates[0]][future_coordinates[2] + 1][future_coordinates[1]] !== 'воздух'
      ) {
        return;
      }
    } 

    // ищем землю
    while (future_coordinates[1] >= 0 && map[future_coordinates[0]][future_coordinates[2]][future_coordinates[1]] === 'воздух') {
      future_coordinates[1]--;
    }
    future_coordinates[1]++;

    if (future_coordinates[1] === 0) {
      return;
    }

    if (current_z - future_coordinates[1] > 3) {
      const delta = current_z - future_coordinates[1];
      this.health -= delta * 100;
    }
    

    // При включенной экспертной системе, обрабатываем движения
    if (this.executing_basic_program == true)
    {
      this.expert_system.process_new_coord(future_coordinates);
      if (this.expert_system.get_moves_without_new_coordinates() == 10)
      {
        this.going_circles = true;
      }
    }

    // В зависимости от поверхности изменяем координаты с задержкой
    switch (this.getCurrentLocation()) {
      case 'песок':
        setTimeout(() => {
          this.coordinates = future_coordinates;
        }, 5000);
        break;
      case 'кислотная поверхность':
        setTimeout(() => {
          this.coordinates = future_coordinates;
        }, 5000);
        break;
      case 'вода':
        setTimeout(() => {
          this.coordinates = future_coordinates;
        }, 10000);
        break;
      default:
        this.coordinates = future_coordinates;
    }
  }

  moveForward() {
    this.move(this.direction, 1);
  }

// 26/47

  moveBackward() {
    this.move(this.direction, -1);
  }

  moveLeft() {
    let dir_save = this.direction
    this.direction = { 'север': 'восток', 'восток': 'юг', 'юг': 'запад', 'запад': 'север' }[this.direction];
    this.move(this.direction, 1);
    this.direction = dir_save
  }
  
  moveRight() {
    let dir_save = this.direction
    this.direction = { 'север': 'запад', 'запад': 'юг', 'юг': 'восток', 'восток': 'север' }[this.direction];
    this.move(this.direction, 1);
    this.direction = dir_save
  }
  
  turnLeft() {
    this.direction = { 'север': 'восток', 'восток': 'юг', 'юг': 'запад', 'запад': 'север' }[this.direction];
  }
  
  turnRight() {
    this.direction = { 'север': 'запад', 'запад': 'юг', 'юг': 'восток', 'восток': 'север'}[this.direction];
  }

  changeMode() {
    this.mode = this.mode === 'ручной' ? 'автоматический' : 'ручной';
    if (this.mode === 'автоматический') {
      this.autoModeInterval = setInterval(() => {
        const nearLocations = this.getNearLocation(5);
        const filteredLocations = nearLocations.filter(location => location.location === 'почва');
        if (filteredLocations.length > 0) {
          const [x, z, y] = filteredLocations[0].coordinates;
          const [current_x, current_y, current_z] = this.coordinates;
          if (current_x === x && current_y === y && current_z === z) {
            return;
          }
          if (current_x > x) {
            this.direction = 'запад';
          } else if (current_x < x) {
            this.direction = 'восток';
          } else if (current_z > z) {
            this.direction = 'юг';
          } else if (current_z < z) {
            this.direction = 'север';
          }
          this.moveForward();
        } else {
          this.moveForward();
        }
      }, 10000);
    } else {
      clearInterval(this.autoModeInterval);
    }
  }

  getNearLocation(radius) {
    const [x, z, y] = this.coordinates;
    const nearLocations = [];
    for (let i = x - radius; i <= x + radius; i++) {
      for (let j = y - radius; j <= y + radius; j++) {
        for (let k = z - radius; k <= z + radius; k++) {
          if (i >= 0 && j >= 0 && k >= 0 && i < map.length && j < map[0].length && k < map[0][0].length) {
            if (map[i][j][k] === 'воздух') {
              continue;
            }
            nearLocations.push({
              coordinates: [i, k, j],
              location: map[i][j][k],
            });
          }
        }
      }
    }
    return nearLocations;
  }

  getCurrentLocation() {
    return map[this.coordinates[0]][this.coordinates[2]][this.coordinates[1] - 1]
  }

  heal() {
    // восстановление здоровья 10 единиц в секунду до 100
    let counter = 0; 
    const interval = setInterval(() => {
      if (this.health >= 10000) {
        clearInterval(interval);
        return;
      }
      this.health += 10;
      counter++;
      if (counter === 100) {
        clearInterval(interval);
      }
    }, 1000);
  }

  restart() {
    this.coordinates = findFirstCoordinate(); // [x, y, z]
    this.mode = 'ручной';
    this.direction = 'север'; // юг, запад, восток; север +y, юг -y, восток +x, запад -x
    this.health = 10000;
    this.criticalError = false;
    this.criticalErrorInterval = null;
    this.autoModeInterval = null;
  }

  getState() {
    const location = this.getCurrentLocation();
    if (location === 'кислотная поверхность') {
      this.health -= 100;
    }
    if (location === 'вода') {
      this.health -= 10;
    }

    return {
      coordinates: this.coordinates,
      mode: this.mode,
      direction: this.direction,
      health: this.health,
      temperature: this.getStationTemperature(),
      location: this.getCurrentLocation(),
      nearLocations: this.getNearLocation(5),
      timestamp: Date.now(),
      going_circles: this.going_circles
    }
  }

  activate_expert_system()
  {
    this.expert_system = new ExpertSystem()
    this.executing_basic_program = true;
  }

  deactivate_expert_system()
  {
    this.going_circles = false
    this.expert_system = null
    this.executing_basic_program = false;
  }
}

module.exports = Robot;