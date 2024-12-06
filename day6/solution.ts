import { promises as fs } from "fs";

type Position = [number, number];

type MapState = "visited" | "start" | "blocked" | "unvisited";

type Map = MapState[][];

const Obstacle = "#";
const Empty = ".";
const NEWLINE = "\n";
const Left = "<";
const Right = ">";
const Top = "^";
const Down = "v";

type Direction = "left" | "right" | "top" | "down";

type PathInfo = {
  visited: number
  path: [Position, Direction][]
} & (
  {
    type: "cycle"

  } | 
  {
    type: "exit"
  }
)

function getVisitedPositions(
  map: Map,
  startPos: Position,
  startDir: Direction
): PathInfo {

  const visitedSet = new Set<string>();
  const visitedDirectionSet = new Set<string>();
  let direction = startDir;
  let position = startPos;
  const path: [Position, Direction][] = [];

  const inBounds = ([r, c]: Position): boolean => r >= 0 && r < map.length && c >= 0 && c < map[0].length

  while (inBounds(position)) {

    const [r, c] = position;
    
    // cycle detection
    if(path.length > 1 && visitedDirectionSet.has(`${r}-${c}-${direction}`)){
      return {
        type: "cycle",
        visited: visitedSet.size,
        path
      }
    } 

    // test whether we are facing an obstacle
    const [offR, offC] = getOffset(direction);

    const newR = r + offR;
    const newC = c + offC;

    // add this position to the path 
    path.push([[r,c], direction]);
    visitedSet.add(`${r}-${c}`);
    visitedDirectionSet.add(`${r}-${c}-${direction}`);

    // now do the action
    if(!inBounds([newR, newC])){
      break;
    }

    else if(map[newR][newC] === "blocked" ) {
      direction = turnRight(direction);
    }
    // else take a step
    else {
      position = [newR, newC];
      // mark this as visited only if we move off it 
    }
  }
  return {
    type: "exit",
    visited: visitedSet.size,
    path
  };
}

function turnRight(init: Direction): Direction {
  switch (init) {
    case "left":
      return "top";
    case "right":
      return "down";
    case "top":
      return "right";
    case "down":
      return "left";
  }
}

function getOffset(direction: Direction): Position {
  switch (direction) {
    case "left":
      return [0, -1];
    case "right":
      return [0, 1];
    case "top":
      return [-1, 0];
    case "down":
      return [1, 0];
  }
}

function applyBlockage(blockPos: Position, map: Map) : void{
  const [r,c] = blockPos;
  map[r][c] = "blocked";
}

function findValidBlockages(startPos: Position, startDirection: Direction, path: Position[], map: Map) : Position[] {
  const blockCandidates = [...path];
  const testedCandidates = new Set<string>(); 
  // first shift the array -- the first value is the start position 
  blockCandidates.shift();

  const blockages: Position[] = [];
  while(blockCandidates.length > 0) {
    const blockAttempt = blockCandidates.shift();
    const [r, c] = blockAttempt;

    // once processed we can then add to the visited set
    if(testedCandidates.has(`${r}-${c}`)){
      continue;
    }
    testedCandidates.add(`${r}-${c}`);

    // now test the map
    applyBlockage(blockAttempt, map);

    const pathInfo = getVisitedPositions(map, startPos, startDirection);
    if(pathInfo.type === "cycle"){
      blockages.push(blockAttempt);
    }

    // undo and then try the next candidate
    map[r][c] = "unvisited";
  }
  return blockages;
}

async function parseInputFile(
  path: string
): Promise<[Map, Position, Direction]> {
  const str = await fs.readFile(path, "ascii");
  const inputRows = str.split(NEWLINE).map((row) => row.trimEnd());
  let startRow: number;
  let startCol: number;
  let direction: Direction;
  const map = inputRows.map((r, i) => {
    const row: MapState[] = r.split("").map((ch, j) => {
      switch (ch) {
        case Obstacle:
          return "blocked";
        case Left:
          startRow = i;
          startCol = j;
          direction = "left";
          return "start";
        case Right:
          startRow = i;
          startCol = j;
          direction = "right";
          return "start";
        case Top:
          startRow = i;
          startCol = j;
          direction = "top";
          return "start";
        case Down:
          startRow = i;
          startCol = j;
          direction = "down";
          return "start";
        case Empty:
          return "unvisited";

        default:
          throw new Error("Invalid input");
      }
    });
    return row;
  });
  return [map, [startRow, startCol], direction];
}

export default function () {
  parseInputFile("day6/input.txt").then(([m, p, d]) => {
    const {path, visited} = getVisitedPositions(m, p, d);
    console.log("Part 1: ", visited);
    const blockages = findValidBlockages(p, d, path.map((p) => p[0]), m);
    console.log("Part 2: ", blockages.length);
  });
}