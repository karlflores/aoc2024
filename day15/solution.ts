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
  // store the left coordinate of the box
  boxes: Location[];
  walls: Location[];
  robot: Location;
  size: [number, number];
  lastExecuted: Direction;

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
    this.lastExecuted = instruction;

    // now lets get the cell of this location
    const toCell = this.getCell(toLocation);

    switch (toCell) {
      case WALL:
        // do nothing we are moving into a wall
        return;
      case BOX: {
        const leftSide = this.getLeftBoxLocation(toLocation);
        // now we have to move the boxes
        this.pushBox(leftSide, instruction)
        break;
      }
    }
    if (this.getCell(toLocation) === null) {
      this.robot = toLocation;
    }
  }

  private pushBoxVertically(box: Location, direction: typeof UP | typeof DOWN) {
    const [dr, dc] = Offsets[direction];
    const [r, c] = box;
    const leftCoord = [r + dr, c + dc] satisfies Location;
    const rightCoord = [r + dr, c + dc + 1] satisfies Location;

    if (this.getCell(leftCoord) === WALL || this.getCell(rightCoord) === WALL) {
      return;
    }

    // move two boxes
    if (this.getCell(leftCoord) === BOX && this.getCell(rightCoord) === BOX) {
      const leftBox = this.getLeftBoxLocation(leftCoord);
      const rightBox = this.getLeftBoxLocation(rightCoord);

      this.pushBoxVertically(leftBox, direction);

      // if left and right point to different boxes, we must move both boxes
      if (!this.areLocationsEqual(leftBox, rightBox)) {
        // we only need to call move box on the right box since the left has already been pushed up 
        this.pushBoxVertically(rightBox, direction);
      }
    } else if (this.getCell(leftCoord) === null && this.getCell(rightCoord) === BOX) {
      // we just need to move the right box before we can move the current box
      const rightBox = this.getLeftBoxLocation(rightCoord);
      this.pushBoxVertically(rightBox, direction)
    } else if (this.getCell(leftCoord) === BOX && this.getCell(rightCoord) === null) {
      const leftBox = this.getLeftBoxLocation(leftCoord);
      this.pushBoxVertically(leftBox, direction);
    }

    // check if there is a free space after a move and push the box
    if (this.getCell(leftCoord) === null && this.getCell(rightCoord) === null) {
      this.boxes = this.boxes = this.boxes.filter(l => !this.areLocationsEqual(l, box));
      this.boxes.push(leftCoord);
    }
    return;
  }

  private pushBoxLeft(box: Location) {
    const [r, c] = box;
    // do nothing if we are trying to move the box into a wall -- do nothing
    const toLocation = [r, c - 1] satisfies Location;

    switch (this.getCell(toLocation)) {
      case WALL:
        return;
      case BOX: {
        const leftBox = this.getLeftBoxLocation(toLocation);
        this.pushBox(leftBox, LEFT);
        break;
      }
      default:
        break;
    }

    if (this.getCell(toLocation) === null) {
      this.boxes = this.boxes.filter(l => !this.areLocationsEqual(l, box));
      this.boxes.push(toLocation);
    }
    return;
  }

  private pushBoxRight(box: Location) {
    // check the right box
    const [r, c] = box;
    const toLocation = [r, c + 2] satisfies Location;

    switch (this.getCell(toLocation)) {
      case WALL:
        return;
      case BOX: {
        const rightBox = this.getLeftBoxLocation(toLocation);
        this.pushBox(rightBox, RIGHT);
        break;
      }
      default:
        // now we have to do the move here
        break;
    }

    if (this.getCell(toLocation) === null) {
      this.boxes = this.boxes.filter(l => !this.areLocationsEqual(l, box));
      this.boxes.push([r, c + 1]);
    }
    return;

  }

  private pushBox(box: Location, direction: Direction) {
    switch (direction) {
      case UP:
      case DOWN: {
        if (!this.canPushBoxVertically(box, direction)) {
          return;
        }
        this.pushBoxVertically(box, direction);
        return;
      }
      case LEFT: {
        this.pushBoxLeft(box);
        return;
        // if it is 
      }
      case RIGHT: {
        this.pushBoxRight(box);
        return;
      }
    }
  }

  private canPushBoxVertically(box: Location, direction: typeof UP | typeof DOWN): boolean {
    // we are only considering up and down and this function is only called on the left coord of the box
    const [r, c] = box;
    const [dr, dc] = Offsets[direction];
    const left = [r + dr, c + dc] satisfies Location;
    const right = [r + dr, c + dc + 1] satisfies Location;

    if (this.getCell(left) === null && this.getCell(right) === null) return true;
    if (this.getCell(left) === WALL || this.getCell(right) === WALL) return false;

    // if one side is free test the other side
    if (this.getCell(left) === BOX && this.getCell(right) === null) return this.canPushBoxVertically(this.getLeftBoxLocation(left), direction);
    if (this.getCell(left) === null && this.getCell(right) === BOX) return this.canPushBoxVertically(this.getLeftBoxLocation(right), direction);

    // now if the left and right boxes are the same we only care about pushing the left box
    if (this.areLocationsEqual(this.getLeftBoxLocation(right), this.getLeftBoxLocation(left))) return this.canPushBoxVertically(left, direction);

    return this.canPushBoxVertically(this.getLeftBoxLocation(left), direction) && this.canPushBoxVertically(this.getLeftBoxLocation(right), direction);
  }


  toCoord([r, c]: Location) {
    return 100 * r + c
  }

  print(): string {
    const map = ".".repeat(this.size[0]).split("").map(() => ".".repeat(this.size[1]).split(""));
    const [rr, rc] = this.robot;
    map[rr][rc] = this.lastExecuted ?? ROBOT;
    this.walls.map(([r, c]) => map[r][c] = WALL);
    this.boxes.map(([r, c]) => {
      map[r][c] = "[";
      map[r][c + 1] = "]";
    });

    return map.map(r => r.join("")).join("\n");
  }

  private getCell(location: Location): Cell | null {

    const [lr, lc] = location;
    if (this.boxes.find((p1) => this.areLocationsEqual(location, p1))) return BOX;
    if (this.boxes.find(p1 => this.areLocationsEqual([lr, lc - 1], p1))) return BOX;
    if (this.walls.find((p1) => this.areLocationsEqual(location, p1))) return WALL;
    return null;
  }

  private getLeftBoxLocation(location: Location): Location {
    if (this.boxes.find(p1 => this.areLocationsEqual(location, p1))) return location;
    const [r, c] = location;
    const left = [r, c - 1] satisfies Location;
    if (this.boxes.find(p1 => this.areLocationsEqual(left, p1))) return left;
    throw new Error("this is not supposed to happen");
  }

  private areLocationsEqual([r1, c1]: Location, [r2, c2]: Location) {
    return r1 === r2 && c1 === c2;
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
    size[1] = cols.length * 2;
    cols.map((ch, j) => {
      if (ch === ROBOT) {
        robot = [i, 2 * j];
      } else if (ch === BOX) {
        boxes.push([i, 2 * j]);
      } else if (ch === WALL) {
        walls.push([i, 2 * j]);
        walls.push([i, 2 * j + 1]);
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
  const [map, instructions] = await parseInputFile("day15/longer.txt");
  instructions.map(i => map.execute(i));
  const sum = map.boxes.map(i => map.toCoord(i)).reduce((acc, c) => acc + c, 0);
  console.log(sum);
}