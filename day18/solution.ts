import { promises as fs } from "fs";
type Location = [number, number]
type LocationKey = `${number}-${number}`;

class MazeState {
  start: Location;
  current: Location;
  end: Location;
  corrupted: Location[]
  allCorrupted: Location[]
  size: [number, number]
  maxBytes: number;

  constructor(walls: Location[], size: [number, number]) {
    this.start = [0, 0];
    this.current = this.start;
    this.end = [size[0] - 1, size[1] - 1];
    this.corrupted = walls;
    this.allCorrupted = walls;
    this.size = size;
    this.maxBytes = walls.length;
  }

  setMaxBytes(bytes: number) {
    this.corrupted = this.allCorrupted.filter((_, i) => i < bytes);
  }

  isLocationValid(l1: Location): boolean {
    const [r, c] = l1;
    return !this.corrupted.find(l2 => areLocationsEqual(l1, l2)) &&
      r >= 0 && r < this.size[1] && c >= 0 && c < this.size[0];
  }

  getMazeRepresentation(path: Location[]) {
    const grid = ".".repeat(this.size[0])
      .split("")
      .map(() => ".".repeat(this.size[1]).split(""));

    this.corrupted.map(([r, c]) => grid[r][c] = "#")
    path.map(([r, c]) => grid[r][c] = "O")

    return grid.map(r => r.join("")).join("\n");
  }
}

type PriorityQueue = [Location, number][];

const areLocationsEqual = ([r1, c1]: Location, [r2, c2]: Location) => r1 === r2 && c1 === c2;

const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]] as const;

const getNeighbours = ([r, c]: Location, m: MazeState) => dirs.map(([dr, dc]): Location => [r + dr, c + dc]).filter(l1 => m.isLocationValid(l1)).filter(l1 => !m.corrupted.find(l2 => areLocationsEqual(l1, l2)));

const astar = (m: MazeState): [Location[], Map<LocationKey, number>] => {
  // now we can perform dijkstra on the map 
  const pq: PriorityQueue = [[m.start, 0]];
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
    const [u, val] = dequeue(pq);

    const [ur, uc] = u;

    // we have found the end
    if (er === ur && ec === uc) {
      return [constructPath(closed, m), distances];
    }

    // the current shortest path in the queue
    const distU = distances.get(`${ur}-${uc}`);

    const neighbours = getNeighbours(u, m);

    for (const v of neighbours) {
      const [vr, vc] = v;

      const distV = distances.get(`${vr}-${vc}`);
      const newCost = distU + 1
      if (newCost < distV) {
        distances.set(`${vr}-${vc}`, newCost);
        enqueue([v, newCost + manhattan(u, v)], pq);
        closed.set(`${vr}-${vc}`, u);
      }
    }
  }

  throw new Error("no path")
}

const binarySearch = (m: MazeState, low: number, high: number): number | null => {
  if (low < 0) return null;
  if (high >= m.allCorrupted.length) return null;

  // we have found the point at which the failure occurs
  if (low === high) return low;

  const mid = Math.floor((low + high) / 2);

  try {
    m.setMaxBytes(mid);
    astar(m);
    return binarySearch(m, mid + 1, high);
  } catch {
    return binarySearch(m, low, mid - 1);
  }
}

const manhattan = ([r1, c1]: Location, [r2, c2]: Location) => Math.abs(r1 - r2) + Math.abs(c1 + c2);

const dequeue = (pq: PriorityQueue) => {
  return pq.pop();
}

const enqueue = (item: [Location, number], pq: PriorityQueue) => {
  pq.push(item);
  pq.sort(([a, b], [c, d]) => d - b)
}

async function parseInputFile(
  path: string
): Promise<MazeState> {
  const str = await fs.readFile(path, "ascii");
  return readMap(str);
}

const readMap = (mapStr: string) => {
  // first split by new line 
  const rows = mapStr.split("\n");
  const walls: Location[] = []
  const size = [71, 71] satisfies [number, number];
  rows.map((m) => {
    const cols = m.trimEnd().split(",").map(n => Number(n));
    walls.push([cols[1], cols[0]]);
  });

  return new MazeState(walls, size);
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
  return path;
}

export default async function () {
  const maze = await parseInputFile("day18/input.txt");
  maze.setMaxBytes(2960);
  const [path, distances] = astar(maze);
  console.log()
  console.log(distances.get(`${70}-${70}`));

  const num = binarySearch(maze, 1, maze.allCorrupted.length - 1);
  console.log(num)
  maze.setMaxBytes(num);
  console.log(maze.corrupted[maze.corrupted.length - 1])

}