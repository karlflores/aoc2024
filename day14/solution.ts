import { promises as fs } from "fs";
const SEP = "\n";
const RobotRegex: RegExp = /p=(-?\d+,-?\d+) v=(-?\d+,-?\d+)/;

type Location = [number, number]

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

export default async function () {
  const robots = await parseInputFile("day15/input.txt");

}