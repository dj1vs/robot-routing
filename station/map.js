const Noise = require("./perlin.js");
const noise = new Noise(Math.random())

const map = [];

const width = 128;
const height = 128;
const depth = 128;

const thresholds = {
  air: 0.1,
  soil: 0.2,
  acid: 0.25,
  sand: 0.35,
  water: 1.0,
};

for (let x = 0; x < width; x++) {
  map.push([])
  for (let y = 0; y < height; y++) {
    map[x].push([])
    for (let z = 0; z < depth; z++) {
      const noiseValue = noise.perlin3(x / 10, y / 10, z / 10);

      let cellType;
      if (noiseValue < thresholds.air) {
        cellType = "воздух";
      } else if (noiseValue < thresholds.soil) {
        cellType = "почва";
      } else if (noiseValue < thresholds.acid) {
        cellType = "кислотная поверхность";
      } else if (noiseValue < thresholds.sand) {
        cellType = "песок";
      } else {
        cellType = "вода";
      }

      map[x][y].push(cellType)
    }
  }
}

function findFirstCoordinate() {
  let x = Math.floor(Math.random() * width);
  let y = Math.floor(Math.random() * height);
  let z = depth - 1;
  while (map[x][y][z] === "воздух") {
    z--;
  }
  if (z === -1 || z === 127) {
    return findFirstCoordinate();
  }
  console.log("Coordinates: ", x, y, z);
  return [x, z+1, y]
}

module.exports = { map, findFirstCoordinate };