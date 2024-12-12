import { promises as fs } from "fs";


type Plant = string
type Garden = Plant[][]
type Position = [number, number]
type PositionHash = `${number}-${number}`

type CartesianCoordinate = [number, number];

type Plot = {
    plant: Plant, 
    plotInfo: PlotInfo[]
    positions: Map<PositionHash, Position>
}

type PlotInfo = {
  positions: Position[],
  perimeter: number,
  area: number,
  edges: number,
}

const NEWLINE = '\n';
const DIR_OFFSETS = [[0,1],[1,0],[0,-1],[-1,0]];

const withinGarden = (position: Position, garden: Garden) => {
    const [r, c] = position;
    if (r < 0 || r >= garden.length) return false
    if (c < 0 || c >= garden[0].length) return false
    return true;
}

function getPlotInfo(garden: Garden, positions: Map<PositionHash, Position>, position: Position, plotInfo: PlotInfo) {
    const [r, c] = position;

    if(!positions.has(`${r}-${c}`)) return 

    if(!withinGarden(position, garden)) return 

    // mark visited
    positions.delete(`${r}-${c}`)

    // calculate how many neighbours are of the same type and how many are different 
    const validDirs = DIR_OFFSETS.filter(([dr, dc]) => withinGarden([r+dr, c+dc], garden))
    const edges = 4 - validDirs.length;

    const neighbours = validDirs.filter(([dr, dc]) => garden[r][c] == garden[dr+r][dc+c]);
    const freeEdge = edges + (validDirs.length - neighbours.length);

    plotInfo.area++;
    plotInfo.perimeter += freeEdge;
    plotInfo.positions.push([r,c])

    for(const [dr, dc] of neighbours){
        getPlotInfo(garden, positions, [r+dr, c+dc], plotInfo)
    }
    return;
}

function calculatePlotInfoOfPlants(garden: Garden, plot: Plot) {
    while(plot.positions.size > 0){
        // get the first position
        const plotInfo = {
          perimeter: 0,
          area: 0,
          edges: 0,
          positions: [],
        }
        const positions = Array.from(plot.positions.values())
        getPlotInfo(garden, plot.positions, positions[0], plotInfo);
        plot.plotInfo.push(plotInfo)
    }
    return;
}

const areEqual = (c1: CartesianCoordinate, c2: CartesianCoordinate) : boolean => c1[0] === c2[0] && c2[1] === c1[1];

const findNextNode = (current: EdgeSegment, edges: EdgeSegment[]) : number | null => {
  // if there is a from node in the 
  for(let i = 0 ; i < edges.length ; i++){
    if(areEqual(current.to, edges[i].from)) return i;
    if(areEqual(current.from, edges[i].to)) return i;
  }
  return null;
}

// given a list of coordinates we can then construct the edges 
function constructEdges(edges: EdgeSegment[]) : EdgeSegment[] {
  // lets keep popping stuff off the edge list until we get 
  let sorted = [...edges]

  let node = sorted[0];

  let constructed: EdgeSegment[] = [];
  while(sorted.length > 0){
    const next = findNextNode(node, sorted);

    if(next === null){
      // then there is no edge in this list - we have created the edge
      // pop a new node and then construct again
      constructed = [...constructed, node];
      node = sorted.pop()
    } else {

      // merge the node
      if(areEqual(node.to, sorted[next].from)){
        node.to = sorted[next].to;
      } else {
        node.from = sorted[next].from;
      }
      sorted = sorted.filter((_,i) => i !== next);
      
    }
    // now remove the node from the sorted list 
  }
  return constructed
}

function getEdgeCoordinatesForPlot(edgePlants: Position[], garden: Garden) : EdgeSegment[]{
  return edgePlants.reduce((acc, e) => [...acc, ...getEdgeCoordinateForPosition(e, garden)], []);
}

type VerticalEdgeSegment = {
  type: "left" | "right",
}

type Node = {
  from: CartesianCoordinate,
  to: CartesianCoordinate
}

type HorizontalEdgeSegment = {
  type: "top" | "bottom",
  from: CartesianCoordinate,
  to: CartesianCoordinate
}
type EdgeSegment = (HorizontalEdgeSegment | VerticalEdgeSegment) & Node;

function getEdgeCoordinateForPosition(position: Position, garden: Garden) : EdgeSegment[]{
  // get edges  
  const edges: EdgeSegment[] = [];
  const maxY = garden.length;

  // top edge 
  const [r, c] = position;
  let [offR, offC] = [-1,0]

  if(!withinGarden([r+offR, c+offC], garden) || garden[offR+r][offC+c] !== garden[r][c]) {
    // we have a top edge
    const lCoord: CartesianCoordinate = [c, maxY-r];
    const rCoord: CartesianCoordinate = [c+1, maxY-r];
    edges.push({
      type: "top",
      from: lCoord,
      to: rCoord
    })

  }

  // bottom edge 
  offR = 1;
  offC = 0;

  if(!(withinGarden([r+offR, c+offC], garden) && garden[offR+r][offC+c] === garden[r][c])) {
    // we have a bottom edge
    const lCoord: CartesianCoordinate = [c, maxY-r-1];
    const rCoord: CartesianCoordinate = [c+1, maxY-r-1];
    edges.push({
      type: "bottom",
      from: lCoord,
      to: rCoord
    })
  }

  // left edge 
  offR = 0;
  offC = -1;

  if(!(withinGarden([r+offR, c+offC], garden) && garden[offR+r][offC+c] === garden[r][c])) {
    const tCoord: CartesianCoordinate = [c, maxY-r];
    const bCoord: CartesianCoordinate = [c, maxY-r-1];

    edges.push({
      type: "left",
      to: tCoord,
      from: bCoord
    })
  }

  // right edge 
  offR = 0;
  offC = 1;

  if(!(withinGarden([r+offR, c+offC], garden) && garden[offR+r][offC+c] === garden[r][c])) {
    const tCoord: CartesianCoordinate = [c+1, maxY-r];
    const bCoord: CartesianCoordinate = [c+1, maxY-r-1];
    edges.push({
      type: "right",
      to: tCoord,
      from: bCoord
    })
  }

  return edges;
}

async function parseInputFile(
  path: string
): Promise<[Garden, Map<Plant, Plot>]> {
  const str = await fs.readFile(path, "ascii");
  const inputRows = str.split(NEWLINE).map((row) => row.trimEnd());
  const plantSet = new Map<Plant, Plot>();

  const map = inputRows.map((r,i) => {
    const row = r.split("")
      .map((p,j) => {
        if(!plantSet.has(p)){
            plantSet.set(p, {
                plant: p, 
                plotInfo: [],
                positions: new Map<PositionHash, Position>()
            })
        }
        const plot = plantSet.get(p);
        plot.positions.set(`${i}-${j}`, [i,j])
        return p;
      });
    return row;
  })
  return [map, plantSet];
}

export default function () {
  parseInputFile("day12/input.txt").then(([map, plot]) => {
    const plants = Array.from(plot.keys());
    plants.map(p => calculatePlotInfoOfPlants(map, plot.get(p)))
    const price = plants
      .map(p => plot.get(p).plotInfo.reduce((acc, i) => acc + i.area*i.perimeter, 0))
      .reduce((acc, p) => acc + p,0)

    console.log("OLD PRICE: ", price);

    const newPrice = plants
      .map(p => plot.get(p).plotInfo.map(i => {
        const edges = getEdgeCoordinatesForPlot(i.positions, map);
        const top = edges.filter(e => e.type === "top");
        const bot = edges.filter(e => e.type === "bottom");
        const left = edges.filter(e => e.type === "left");
        const right = edges.filter(e => e.type === "right");

        const constructedTop = constructEdges([...top]);
        const constructedBot = constructEdges([...bot]);
        const constructedLeft = constructEdges([...left]);
        const constructedRight = constructEdges([...right]);

        const numEdges = constructedBot.length + constructedTop.length + constructedLeft.length + constructedRight.length;

        i.edges = numEdges;

        return numEdges * i.area;
      }).reduce((acc, price)=> acc + price, 0))
      .reduce((acc, price) => acc + price ,0);

    console.log("NEW PRICE: ", newPrice);
  });
}