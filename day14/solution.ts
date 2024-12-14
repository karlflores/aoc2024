import { promises as fs } from "fs";
const SEP = "\n";
const RobotRegex: RegExp = /p=(-?\d+,-?\d+) v=(-?\d+,-?\d+)/;

type Location = [number, number]

type Velocity = [number, number]

type Robot = {
  start: Location,
  velocity: Velocity
}
const GRIDSIZE = [101, 103] as const;

const getQuadrants = ([x, y]: Location): number | null => {

  const [mx, my] = [Math.floor(GRIDSIZE[0] / 2), Math.floor(GRIDSIZE[1] / 2)]

  if (x < mx && y < my) {
    return 1;
  } else if (x < mx && y > my) {
    return 3;
  } else if (x > mx && y < my) {
    return 2;
  } else if (x > mx && y > my) {
    return 4
  }
  return null;
}

const getPosition = (robot: Robot, t: number) => {
  const [MAX_X, MAX_Y] = GRIDSIZE;
  const [x0, y0] = robot.start;
  const [vx, vy] = robot.velocity;
  const newX = mod(x0 + vx * t, MAX_X);
  const newY = mod(y0 + vy * t, MAX_Y);
  return [newX, newY] as Location;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

async function parseInputFile(
  path: string
) {
  const str = await fs.readFile(path, "ascii");
  const robots = str
    .split(SEP)
    .map((r): Robot => {
      const robotStr = r.trimEnd().match(RobotRegex);
      const [x, y] = robotStr[1].split(",").map(x => Number(x));
      const [vx, vy] = robotStr[2].split(",").map(x => Number(x));
      return {
        start: [x, y],
        velocity: [vx, vy]
      }
    });
  return robots;
}

const getGrid = (locs: Location[]) => {
  const grid: boolean[][] = [];
  for (let i = 0; i < GRIDSIZE[1]; i++) {
    const row: boolean[] = []
    for (let j = 0; j < GRIDSIZE[0]; j++) {
      row.push(false);
    }
    grid.push(row);
  }

  // now for each location we can just mark the grid as true
  locs.map(([x, y]) => grid[y][x] = true);
  return grid;
}

const directions = [[0, 1], [1, 0], [-1, 0], [0, -1]];

const findConnectedPatch = (start: Location, location: Location[], visited: Set<LocationKey>): Location[] => {
  const [x, y] = start;
  if (x < 0 || x > GRIDSIZE[0]) return [];
  if (y < 0 || y > GRIDSIZE[1]) return [];
  if (location.filter(([x1, y1]) => x1 === x && y1 === y).length === 0) return [];
  if (visited.has(`${x}-${y}`)) return [];
  visited.add(`${x}-${y}`)

  return directions.reduce((acc, [dx, dy]) => [...acc, ...findConnectedPatch([x + dx, y + dy] as Location, location, visited)], [start])
}

type LocationKey = `${number}-${number}`;

const getUniqueLocations = (location: Location[]) => {
  const visited = new Set<LocationKey>();
  const loc: Location[] = [];
  for (const [x, y] of location) {
    if (!visited.has(`${x}-${y}`)) {
      loc.push([x, y]);
      visited.add(`${x}-${y}`);
    }
  }

  return loc;
}

const getGridRepresentation = (grid: boolean[][]) => grid
  .map(r => r.map(p => p ? "*" : " ").join(""))
  .join("\n");

export default async function () {
  const robots = await parseInputFile("day14/input.txt");
  const count = [0, 0, 0, 0];
  const positions = robots
    .map(r => getPosition(r, 100));
  positions
    .map(p => getQuadrants(p))
    .filter(n => n !== null)
    .map(q => {
      count[q - 1]++
      return q;
    })

  console.log("PART 1: ", count.reduce((acc, c) => acc * (c > 0 ? c : 1), 1));

  let t = 0;
  while (t < 10000) {
    const locs = robots.map(r => getPosition(r, t));
    let unique = getUniqueLocations(locs);
    let maxPatch = 0;

    while (unique.length > 0) {
      const start = unique[0];
      const s = findConnectedPatch(start, unique, new Set<LocationKey>());
      // now we have to construct a new unique set that does not include the connected patch
      if (s.length > maxPatch) maxPatch = s.length;
      unique = unique.filter(([x0, y0]) => s.filter(([x1, y1]) => x1 === x0 && y0 === y1).length === 0);

    }

    if (maxPatch > 100) {
      console.log(maxPatch)
      const grid = getGrid(locs);
      const gridStr = getGridRepresentation(grid);
      console.log("*".repeat(100));
      console.log(gridStr);
      console.log("*".repeat(100));
      console.log("BLOB OF SIZE > 50 FOUND -- T: ", t);
      console.log("*".repeat(100));
    }
    t++
  }
}