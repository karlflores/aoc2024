import { promises as fs } from "fs";

type Node = string;
type NodeMap = Node[][];
type Position = [number, number];
type NodePositions = Map<Node, Position[]>;
type AntinodeHash = `${number},${number}`;

const EMPTY = '.';
const NEWLINE = '\n';

async function parseInputFile(
  path: string
): Promise<[NodeMap, NodePositions]> {
  const str = await fs.readFile(path, "ascii");
  const inputRows = str.split(NEWLINE).map((row) => row.trimEnd());

  const positionMap = new Map<Node, Position[]>();

  const map = inputRows.map((row, r) => {
    const nodes = row.split("")
      .map((n, c) => {
        if (n !== EMPTY) {
          if(!positionMap.has(n)){
            positionMap.set(n, []);
          }
          const positions = positionMap.get(n);
          positions.push([r,c]);
        }
        return n;
      });
    return nodes;
  })
  return [map, positionMap];
}


function* generateAntinodes(p1: Position, [offR, offC]: Position): Generator<Position> {
  let [r, c] = p1;
  while(true){
    r += offR
    c += offC
    yield [r, c];
  }
}

const getAntinodeHash = ([r, c]: Position) : AntinodeHash => `${r},${c}`;

const getOffset = (p1: Position, p2: Position) : [number, number] => [(p2[0]-p1[0]),(p2[1]-p1[1])];

const generateValidAntinodes = (node: Position, offset: Position) => {
  const positions: Position[] = [];
  const generator = generateAntinodes(node, offset);
  return (map: NodeMap) => {
    const rows = map.length;
    const cols = map[0].length;

    // is coord inbounds
    const inBounds = ([r, c]: Position): boolean => r >= 0 && r < rows && c >= 0 && c < cols; 

    while(true){
      const antinode: Position = generator.next().value;
      if(!inBounds(antinode)){
        break;
      }
      positions.push(antinode);
    }
    return positions; 
  }
}

function getAntinodes(map: NodeMap, positions: NodePositions) : Set<AntinodeHash> {
  const antinodes = new Set<AntinodeHash>();
  Array.from(positions.keys())
    .map(p => {
      const node = positions.get(p);
      // iterate through the pairs of nodes
      for(let i = 0 ; i < node.length ; i++){
        for(let j = i + 1 ; j < node.length ; j++) {
          const [offR, offC] = getOffset(node[i], node[j]);
          // first start with the antinodes going in the relative negative direction
          generateValidAntinodes(node[j], [-offR, -offC])(map).map(p => antinodes.add(getAntinodeHash(p)));

          // then generate the antinodes going in the relative positive direction
          generateValidAntinodes(node[i], [offR, offC])(map).map(p => antinodes.add(getAntinodeHash(p))); 
      }
    }
  });
  return antinodes;
}

export default function(){
  parseInputFile("day8/input.txt").then(([map, positions]) => {
    const antinodes = getAntinodes(map, positions);
    console.log("Part 2: ", antinodes.size);
  });
}