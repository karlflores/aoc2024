import { promises as fs } from "fs";
type Location = [number, number]

const DOWN = "v" as const;
const UP = "^" as const;
const LEFT = "<" as const;
const RIGHT = ">" as const;
const ROBOT = "@" as const;
const BOX = "O" as const;
const WALL = "#" as const;

const Offsets = {
  ">": [0, 1],
  "<": [0, -1],
  "^": [-1, 0],
  "v": [1, 0]
} as const;

type Cell = typeof ROBOT | typeof BOX | typeof WALL;

class RoomState {
  boxes: Location[];
  walls: Location[];
  robot: Location;
  size: [number, number];

  constructor(boxes: Location[], walls: Location[], robot: Location, size: [number, number]) {
    this.boxes = boxes;
    this.walls = walls;
    this.robot = robot;
    this.size = size;
  }


  execute(instruction: Direction) {
    // get offset
    const [rr, rc] = this.robot;
    const [dr, dc] = Offsets[instruction];
    const toLocation = [rr + dr, rc + dc] satisfies Location;

    // now lets get the cell of this location
    const toCell = this.getCell(toLocation);

    switch (toCell) {
      case WALL:
        // do nothing we are moving into a wall
        return;
      case BOX:
        // now we have to move the boxes
        this.pushBox(toLocation, instruction)
        break;
    }
    if (this.getCell(toLocation) === null) {
      this.robot = toLocation;
    }
  }

  private pushBox(box: Location, direction: Direction) {
    // newLocation
    const [dr, dc] = Offsets[direction];
    const [r, c] = box;
    const newLocation = [r + dr, c + dc] satisfies Location;
    if (!this.isValidLocation(newLocation)) return;

    // do nothing if we are trying to move the box into a wall -- do nothing
    if (this.getCell(newLocation) === WALL) {
      return;
    }

    // try to first move the box infront before trying to move the box it was called on 
    if (this.getCell(newLocation) === BOX) {
      this.pushBox(newLocation, direction);
    }

    // check if there is a free space after a move and push the box
    if (this.getCell(newLocation) === null) {
      // we can move the box into this location;

      // step 1. filter the boxes 
      this.boxes = this.boxes.filter(l => !this.areLocationsEqual(l, box));
      this.boxes.push(newLocation);
    }
  }


  toCoord([r, c]: Location) {
    // find the left wall 
    return c + 100 * r;
  }

  print(): string {
    const map = ".".repeat(this.size[0]).split("").map(() => ".".repeat(this.size[1]).split(""));
    const [rr, rc] = this.robot;
    map[rr][rc] = ROBOT;
    this.walls.map(([r, c]) => map[r][c] = WALL);
    this.boxes.map(([r, c]) => map[r][c] = BOX);

    return map.map(r => r.join("")).join("\n");
  }

  private getCell(location: Location): Cell | null {
    if (this.boxes.find((p1) => this.areLocationsEqual(location, p1))) return BOX;
    if (this.walls.find((p1) => this.areLocationsEqual(location, p1))) return WALL;
    return null;
  }


  private areLocationsEqual([r1, c1]: Location, [r2, c2]: Location) {
    return r1 === r2 && c1 === c2;
  }

  private isValidLocation([r1, c1]: Location) {
    return r1 >= 0 && r1 < this.size[0] && c1 >= 0 && c1 < this.size[1];
  }
}

type Direction = keyof typeof Offsets;

async function parseInputFile(
  path: string
): Promise<[RoomState, Direction[]]> {
  const str = await fs.readFile(path, "ascii");
  const [map, movements] = str.split("\r\n\r\n");
  return [readMap(map), readInstructions(movements)];
}

const readMap = (mapStr: string) => {
  // first split by new line 
  const rows = mapStr.split("\r\n");
  const size: [number, number] = [rows.length, 0];
  const boxes: Location[] = []
  const walls: Location[] = []
  let robot: Location = [0, 0];
  rows.map((m, i) => {
    const cols = m.split("")
    size[1] = cols.length;
    cols.map((ch, j) => {
      if (ch === ROBOT) {
        robot = [i, j];
      } else if (ch === BOX) {
        boxes.push([i, j]);
      } else if (ch === WALL) {
        walls.push([i, j]);
      }
    });
  })

  return new RoomState(
    boxes,
    walls,
    robot,
    size
  )
}

const readInstructions = (insStr: string) => insStr.split("\n")
  .map((i) => i.split("").filter((i) => i === DOWN || i === UP || i === LEFT || i === RIGHT) satisfies Direction[])
  .reduce((acc, i) => [...acc, ...i], []);

export default async function () {
  const [map, instructions] = await parseInputFile("day15/input.txt");

  // test the instructions
  instructions.map((i) => map.execute(i));

  // now for all the boxes we can then find the top and bottom locations
  const sum = map.boxes.map(i => map.toCoord(i)).reduce((acc, c) => acc + c, 0);
  console.log(sum);
}