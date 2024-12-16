import { dir } from "console";
import { promises as fs } from "fs";
type Location = [number, number]
type LocationKey = `${number}-${number}-${string}`;

const START = "S" as const;
const END = "E" as const;
const FREE = "." as const;
const WALL = "#" as const;

class MazeState {
  start: Location;
  current: Location;
  end: Location;
  cells: Location[]
  walls: Location[]
  direction: Direction;
  size: [number, number]

  constructor(start: Location, end: Location, cells: Location[], size: [number, number], walls: Location[], direction?: Direction) {
    this.start = start;
    this.current = start;
    this.end = end;
    this.cells = cells;
    this.direction = direction ?? "right";
    this.size = size;
    this.walls = walls;
  }

  isLocationValid(l1: Location): boolean {
    return !!this.cells.find(l2 => areLocationsEqual(l1, l2));
  }

  getMazeRepresentation(path: Location[]) {
    const grid = "x".repeat(this.size[0]).split("").map(() => " ".repeat(this.size[1]).split("").map(() => " "));
    this.walls.map(([r, c]) => grid[r][c] = WALL)
    grid[this.start[0]][this.start[1]] = START
    grid[this.end[0]][this.end[1]] = END
    path.map(([r, c]) => grid[r][c] = "O")

    return grid.map(r => r.join("")).join("\n");
  }
}

const Offsets = {
  "right": [0, 1],
  "left": [0, -1],
  "up": [-1, 0],
  "down": [1, 0]
} as const;

type Direction = keyof typeof Offsets;

type PriorityQueue = [[Location, Direction], number][];

const getMoveCost = (currDir: Direction, curr: Location, target: Location): [number, Direction] => {
  // takes in the current direciton , current location and the location that we want to move to. This function then returns the new direction as well as the cost that it took to get there 
  const [tr, tc] = target;
  const [cr, cc] = curr;
  const [dr, dc] = Offsets[currDir];

  // if the target cell is in the direction we want to move into then we can just move 
  if (cr + dr === tr && cc + dc === tc) return [1, currDir];

  if (currDir === "up") {
    if (dr + cr - tr === -1 && cc + dc - tc === 1) return [1001, "left"];
    if (dr + cr - tr === -1 && cc + dc - tc === -1) return [1001, "right"];
    if (dr + cr - tr === -2 && cc + dc - tc === 0) return [2001, "down"];
  }
  else if (currDir === "down") {
    if (dr + cr - tr === 1 && cc + dc - tc === 1) return [1001, "left"];
    if (dr + cr - tr === 1 && cc + dc - tc === -1) return [1001, "right"];
    if (dr + cr - tr === 2 && cc + dc - tc === 0) return [2001, "up"];
  }
  else if (currDir === "left") {
    if (dr + cr - tr === 1 && cc + dc - tc === -1) return [1001, "up"];
    if (dr + cr - tr === -1 && cc + dc - tc === -1) return [1001, "down"];
    if (dr + cr - tr === 0 && cc + dc - tc === -2) return [2001, "right"];
  }
  else {
    if (dr + cr - tr === 1 && cc + dc - tc === 1) return [1001, "up"];
    if (dr + cr - tr === -1 && cc + dc - tc === 1) return [1001, "down"];
    if (dr + cr - tr === 0 && cc + dc - tc === 2) return [2001, "left"];
  }

  throw new Error("this shouldn't happen");
}

const areLocationsEqual = ([r1, c1]: Location, [r2, c2]: Location) => r1 === r2 && c1 === c2;

const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]] as const;
const getNeighbours = ([r, c]: Location, cells: Location[]) => dirs.map(([dr, dc]): Location => [r + dr, c + dc]).filter(l1 => cells.find(l2 => areLocationsEqual(l1, l2)));

const astar = (m: MazeState) => {
  // now we can perform dijkstra on the map 
  const pq: PriorityQueue = [[[m.current, m.direction], 0]];
  const distances = new Map<LocationKey, number>();
  const closed = new Map<LocationKey, [Location, Direction][]>();
  const [er, ec] = m.end;

  m.cells.map(([r, c]) => {
    distances.set(`${r}-${c}-up`, Infinity)
    distances.set(`${r}-${c}-down`, Infinity)
    distances.set(`${r}-${c}-left`, Infinity)
    distances.set(`${r}-${c}-right`, Infinity)
  })
  const [sr, sc] = m.start;
  distances.set(`${sr}-${sc}-${m.direction}`, 0);

  // now we can do dijkstra over the nodes
  while (pq.length > 0) {

    // process the next closest node
    const [[u, direction], val] = dequeue(pq);

    const [ur, uc] = u;

    if (er === ur && ec === uc && direction === 'up') {
      return constructPath(closed, m, "up");
    }

    // the current shortest path in the queue
    const distU = distances.get(`${ur}-${uc}-${direction}`);

    const neighbours = getNeighbours(u, m.cells);

    for (const v of neighbours) {
      const [vr, vc] = v;

      const [cost, dir] = getMoveCost(direction, u, v);
      const distV = distances.get(`${vr}-${vc}-${dir}`);
      const newCost = distU + cost
      if (newCost < distV) {
        distances.set(`${vr}-${vc}-${dir}`, newCost);
        enqueue([[v, dir], newCost + manhattan(u, v)], pq);
        closed.set(`${vr}-${vc}-${dir}`, [[u, direction]]);
      } else if (newCost === distV) {
        const path = closed.get(`${vr}-${vc}-${dir}`)
        closed.set(`${vr}-${vc}-${dir}`, [...path, [u, direction]])
      }
    }
  }

  throw new Error("no path")
}

const manhattan = ([r1, c1]: Location, [r2, c2]: Location) => Math.abs(r1 - r2) + Math.abs(c1 + c2);

const dequeue = (pq: PriorityQueue) => {
  return pq.pop();
}

const enqueue = (item: [[Location, Direction], number], pq: PriorityQueue) => {
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
        case FREE:
          cells.push([i, j]);
          break;
        case WALL:
          walls.push([i, j])
      }
    });
  })

  return new MazeState(
    start, end, cells, size, walls
  )
}

// construct path
const constructPath = (m: Map<LocationKey, [Location, Direction][]>, maze: MazeState, d: Direction) => {
  const curr = maze.end;
  const start = m.get(`${curr[0]}-${curr[1]}-${d}`)
  let path = [maze.end];
  const queue: [Location, Direction][] = [...start];

  while (queue.length > 0) {
    const prev = queue.shift();
    if (!path.find(l2 => areLocationsEqual(prev[0], l2))) {
      path = [...path, prev[0]];
    }
    if (!areLocationsEqual(prev[0], maze.start)) {
      const parents = m.get(`${prev[0][0]}-${prev[0][1]}-${prev[1]}`)
      // only add cells we haven't added to the cells path
      parents.filter(([l1, d]) => !path.find((l2) => areLocationsEqual(l1, l2))).map(p => queue.push(p));
    }
  }

  return path;
}

export default async function () {
  const maze = await parseInputFile("day16/input.txt");
  console.log(maze)
  const seats = astar(maze);
  console.log(maze.getMazeRepresentation(seats));
  console.log()
  console.log(seats.length);
}

export { getMoveCost, Offsets, getNeighbours, Location, Direction, enqueue, dequeue, PriorityQueue };