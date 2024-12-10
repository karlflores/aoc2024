import { promises as fs } from "fs";

type Map = Elevation[][];

type Elevation = number;
type Position = [number, number]
type PositionKey = `${number}-${number}`;

const Directions = ["left", "right", "up", "down"] as const;
type Direction = typeof Directions[number];

const NEWLINE = "\n";

function getNextDirection([r, c]: Position, map: Map) : Direction[]{
  return Directions.filter(d => {
    const [offR, offC] = getOffset(d)
    if(!(r + offR >= 0 && r + offR < map.length && c + offC >= 0 && c + offC < map[0].length)){
      return false;
    }

    if(!(r >= 0 && r < map.length && c >= 0 && c < map[0].length)){
      return false;
    }

    return map[r+offR][c+offC] === map[r][c] + 1; 
  });
}

function getOffset(direction: Direction): Position {
  switch (direction) {
    case "left":
      return [0, -1];
    case "right":
      return [0, 1];
    case "up":
      return [-1, 0];
    case "down":
      return [1, 0];
  }
}

function getTrailHead(map: Map, [r, c]: Position, visited: Set<PositionKey>) : number {
  if(map[r][c] === 9){
    return 1;
  }

  const nextDirection = getNextDirection([r, c], map); 

  if(!nextDirection || nextDirection.length === 0){
    return 0
  }

  const nextMoves: Position[] = nextDirection.map(d => {
    const [i, j] = getOffset(d);
    return [r + i, c + j];
  })

  return nextMoves.reduce((acc, p) => acc + getTrailHead(map, p, visited), 0);
}

async function parseInputFile(
  path: string
): Promise<[Map, Position[]]> {
  const str = await fs.readFile(path, "ascii");
  const inputRows = str.split(NEWLINE).map((row) => row.trimEnd());
  const startPositions: Position[] = [];
  const map = inputRows.map((r, i) => {
    const row: Elevation[] = r.split("").map((ch, j) => {
        const elevation = Number(ch) as Elevation;
        if(elevation === 0) {
          startPositions.push([i,j]);
        }
        return elevation;
      });
      return row;
  });
  return [map, startPositions];
}

export default function () {
  parseInputFile("day10/input.txt").then(([map, startPositions]) => {
    const trailHeadSum = startPositions.reduce((acc, p) => {
      // instantiate a new visited array per start position
      const visited = new Set<PositionKey>();
      return acc + getTrailHead(map, p, visited);
    }, 0);
    console.log("Part 1: ", trailHeadSum);
  });
}