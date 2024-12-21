import { promises as fs } from "fs";
import Heap from "heap-js";
import { start } from "repl";
type Location = [number, number]
type LocationKey = `${number}-${number}`;

const START = "S"
const END = "E"
const WALL = "#"

class MazeState {
  start: Location;
  current: Location;
  end: Location;
  walls: Location[]
  cells: Location[]
  size: [number, number]
  maxBytes: number;
  pathLength: number;

  constructor(cells: Location[], walls: Location[], start: Location, end: Location, size: [number, number]) {
    this.start = start;
    this.current = this.start;
    this.end = end;
    this.walls = walls;
    this.size = size;
    this.pathLength = cells.length;
    this.cells = cells;
  }

  isLocationValid(l1: Location): boolean {
    const [r, c] = l1;
    return !this.walls.find(l2 => areLocationsEqual(l1, l2)) &&
      r >= 0 && r < this.size[1] && c >= 0 && c < this.size[0];
  }

  isLocationInbounds([r, c]: Location): boolean {
    return r >= 0 && r < this.size[1] && c >= 0 && c < this.size[0]
  }

  isLocationInsideWalls([r, c]: Location): boolean {
    return r > 0 && r < this.size[1] - 1 && c > 0 && c < this.size[0] - 1
  }

  getMazeRepresentation(path: Location[]) {
    const grid = ".".repeat(this.size[0])
      .split("")
      .map(() => ".".repeat(this.size[1]).split(""));

    this.walls.map(([r, c]) => grid[r][c] = ".")
    path.map(([r, c]) => grid[r][c] = "O")
    const [sr, sc] = this.start;
    const [er, ec] = this.end;
    grid[sr][sc] = "S"
    grid[er][ec] = "E"

    return grid.map(r => r.join("")).join("\n");
  }
}

type CarState = {
  location: Location,
  priority: number | null,
} & ({
  cheatState: "activated",
  cheatDurationRemaining: number
} | {
  cheatState: "ready" | "used"
})

const areLocationsEqual = ([r1, c1]: Location, [r2, c2]: Location) => r1 === r2 && c1 === c2;

const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]] satisfies Location[];

const getNextMoves = (state: CarState, m: MazeState) => {
  const validNeighbours = dirs.map((d): Location => applyOffset(d, state.location)).filter(l1 => m.isLocationValid(l1)).filter(l1 => m.cells.find(l2 => areLocationsEqual(l1, l2)));
  return validNeighbours.map(m => {
    return {
      cheatState: "used",
      location: m,
      priority: null
    } satisfies CarState;
  });
}

const astar = (m: MazeState): [Location[], Map<LocationKey, number>] => {
  // now we can perform dijkstra on the map 
  const startState = {
    location: m.start,
    cheatState: "ready",
    priority: 0

  } satisfies CarState;

  const pq = new Heap((a: CarState, b: CarState) => a.priority - b.priority);
  pq.push(startState);
  const distances = new Map<LocationKey, number>();
  const closed = new Map<LocationKey, Location>();
  const [er, ec] = m.end;

  for (let i = 0; i < m.size[1]; i++) {
    for (let j = 0; j < m.size[0]; j++) {
      distances.set(`${i}-${j}`, Infinity)
    }
  }
  const [sr, sc] = m.start;
  distances.set(`${sr}-${sc}`, 0);

  // now we can do dijkstra over the nodes
  while (pq.length > 0) {

    // process the next closest node
    const u = pq.pop();
    const [ur, uc] = u.location;

    // we have found the end
    if (er === ur && ec === uc) {
      return [constructPath(closed, m), distances];
    }

    // the current shortest path in the queue
    const distU = distances.get(`${ur}-${uc}`);

    const neighbours = getNextMoves(u, m);

    for (const v of neighbours) {
      const [vr, vc] = v.location;

      const distV = distances.get(`${vr}-${vc}`);
      const newCost = distU + 1
      if (newCost < distV) {
        distances.set(`${vr}-${vc}`, newCost);
        v.priority = newCost + manhattan(u.location, v.location);
        pq.push(v);
        closed.set(`${vr}-${vc}`, u.location);
      }
    }
  }

  throw new Error("no path")
}

const manhattan = ([r1, c1]: Location, [r2, c2]: Location) => Math.abs(r1 - r2) + Math.abs(c1 - c2);

async function parseInputFile(
  path: string
): Promise<MazeState> {
  const str = await fs.readFile(path, "ascii");
  return readMap(str);
}

const readMap = (mapStr: string) => {
  // first split by new line 
  const rows = mapStr.split("\r\n");
  const cells: Location[] = []
  const walls: Location[] = []
  const size = [rows.length, 0] satisfies [number, number];
  let start: Location = [0, 0]
  let end: Location = [0, 0]
  rows.map((m, i) => {
    const cols = m.split("")
    size[1] = cols.length;
    cols.map((ch, j) => {
      switch (ch) {
        case START:
          start = [i, j];
          cells.push([i, j]);
          break;
        case END:
          end = [i, j];
          cells.push([i, j]);
          break;
        case WALL:
          walls.push([i, j])
          break;
        default:
          cells.push([i, j])
      }
    });
  })

  return new MazeState(
    cells, walls, start, end, size
  )
}

// construct path
const constructPath = (m: Map<LocationKey, Location>, maze: MazeState) => {
  const curr = maze.end;
  const start = m.get(`${curr[0]}-${curr[1]}`)
  let path = [maze.end];
  const queue: Location[] = [start];

  while (queue.length > 0) {
    const prev = queue.shift();
    if (!path.find(l2 => areLocationsEqual(prev, l2))) {
      path = [...path, prev];
    }
    if (!areLocationsEqual(prev, maze.start)) {
      const parent = m.get(`${prev[0]}-${prev[1]}`)
      // only add cells we haven't added to the cells path
      queue.push(parent);
    }
  }
  return path.reverse();
}

const applyOffset = ([dr, dc]: Location, [r, c]: Location) => [dr + r, dc + c] satisfies Location;

export default async function () {
  const maze = await parseInputFile("day20/input.txt");
  const [path, dirs] = astar(maze);

  const savings: number[] = [];
  for (let i = 0; i < path.length; i++) {
    for (let j = i + 1; j < path.length; j++) {
      const dist = manhattan(path[i], path[j]);
      if (dist <= 20) {
        savings.push(j - i - dist);
      }
    }
  }

  console.log(savings.filter(s => s >= 100).length)
  console.log(path.length)
}