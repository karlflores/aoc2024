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
const DOWN = [1, 0];
const TOP = [-1, 0];
const LEFT = [0, -1];
const RIGHT = [0, 1];
const DIR_OFFSETS = [TOP, DOWN, LEFT, RIGHT];

const withinGarden = (position: Position, garden: Garden) => {
  const [r, c] = position;
  if (r < 0 || r >= garden.length) return false
  if (c < 0 || c >= garden[0].length) return false
  return true;
}

function getPlotInfo(garden: Garden, positions: Map<PositionHash, Position>, position: Position, plotInfo: PlotInfo) {
  const [r, c] = position;

  if (!positions.has(`${r}-${c}`)) return

  if (!withinGarden(position, garden)) return

  // mark visited
  positions.delete(`${r}-${c}`)

  // calculate how many neighbours are of the same type and how many are different 
  const validDirs = DIR_OFFSETS.filter(([dr, dc]) => withinGarden([r + dr, c + dc], garden))
  const edges = 4 - validDirs.length;

  const neighbours = validDirs.filter(([dr, dc]) => garden[r][c] == garden[dr + r][dc + c]);
  const freeEdge = edges + (validDirs.length - neighbours.length);

  plotInfo.area++;
  plotInfo.perimeter += freeEdge;
  plotInfo.positions.push([r, c])

  for (const [dr, dc] of neighbours) {
    getPlotInfo(garden, positions, [r + dr, c + dc], plotInfo)
  }
  return;
}

function calculatePlotInfoOfPlants(garden: Garden, plot: Plot) {
  while (plot.positions.size > 0) {
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

const areEqual = (c1: CartesianCoordinate, c2: CartesianCoordinate): boolean => c1[0] === c2[0] && c2[1] === c1[1];

const findNextNode = (current: EdgeSegment, edges: EdgeSegment[]): number | null => {
  // if there is a from node in the 
  for (let i = 0; i < edges.length; i++) {
    if (areEqual(current.to, edges[i].from)) return i;
    if (areEqual(current.from, edges[i].to)) return i;
  }
  return null;
}

// given a list of coordinates we can then construct the edges 
function constructEdges(edges: EdgeSegment[]): EdgeSegment[] {
  let candidates = [...edges]

  let fromEdge = candidates[0];

  let mergedEdges: EdgeSegment[] = [];

  while (candidates.length > 0) {
    const toEdgeIdx = findNextNode(fromEdge, candidates);

    if (toEdgeIdx === null) {
      // then there is no edge in this list - we have created the edge
      mergedEdges = [...mergedEdges, fromEdge];
      fromEdge = candidates.pop()
    } else {
      // we can now merge the edges and then restart the search for the next edge to merge
      const toEdge = candidates[toEdgeIdx];

      if (areEqual(fromEdge.to, toEdge.from)) {
        fromEdge.to = toEdge.to;
      } else {
        fromEdge.from = toEdge.from;
      }
      candidates = candidates.filter((_, i) => i !== toEdgeIdx);
    }
  }
  return mergedEdges
}

function getEdgeCoordinatesForPlot(edgePlants: Position[], garden: Garden): EdgeSegment[] {
  return edgePlants.reduce((acc, e) => [...acc, ...getEdgeCoordinateForPosition(e, garden)], []);
}

type VerticalEdge = {
  type: "left" | "right",
}

type Node = {
  from: CartesianCoordinate,
  to: CartesianCoordinate
}

type HorizontalEdge = {
  type: "top" | "bottom",
}

type EdgeSegment = (HorizontalEdge | VerticalEdge) & Node;

function getEdgeCoordinateForPosition(position: Position, garden: Garden): EdgeSegment[] {
  // get edges  
  const edges: EdgeSegment[] = [];
  const maxY = garden.length;

  // top edge 
  const [r, c] = position;
  let [offR, offC] = TOP

  if (!withinGarden([r + offR, c + offC], garden) || garden[offR + r][offC + c] !== garden[r][c]) {
    // we have a top edge
    const lCoord: CartesianCoordinate = [c, maxY - r];
    const rCoord: CartesianCoordinate = [c + 1, maxY - r];
    edges.push({
      type: "top",
      from: lCoord,
      to: rCoord
    })

  }

  // bottom edge 
  offR = DOWN[0];
  offC = DOWN[1];

  if (!(withinGarden([r + offR, c + offC], garden) && garden[offR + r][offC + c] === garden[r][c])) {
    // we have a bottom edge
    const lCoord: CartesianCoordinate = [c, maxY - r - 1];
    const rCoord: CartesianCoordinate = [c + 1, maxY - r - 1];
    edges.push({
      type: "bottom",
      from: lCoord,
      to: rCoord
    })
  }

  // left edge 
  offR = LEFT[0];
  offC = LEFT[1];

  if (!(withinGarden([r + offR, c + offC], garden) && garden[offR + r][offC + c] === garden[r][c])) {
    const tCoord: CartesianCoordinate = [c, maxY - r];
    const bCoord: CartesianCoordinate = [c, maxY - r - 1];

    edges.push({
      type: "left",
      to: tCoord,
      from: bCoord
    })
  }

  // right edge 
  offR = RIGHT[0];
  offC = RIGHT[1];

  if (!(withinGarden([r + offR, c + offC], garden) && garden[offR + r][offC + c] === garden[r][c])) {
    const tCoord: CartesianCoordinate = [c + 1, maxY - r];
    const bCoord: CartesianCoordinate = [c + 1, maxY - r - 1];
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

  const map = inputRows.map((r, i) => {
    const row = r.split("")
      .map((p, j) => {
        if (!plantSet.has(p)) {
          plantSet.set(p, {
            plant: p,
            plotInfo: [],
            positions: new Map<PositionHash, Position>()
          })
        }
        const plot = plantSet.get(p);
        plot.positions.set(`${i}-${j}`, [i, j])
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
      .map(p => plot.get(p).plotInfo.reduce((acc, i) => acc + i.area * i.perimeter, 0))
      .reduce((acc, p) => acc + p, 0)

    console.log("OLD PRICE: ", price);

    const newPrice = plants
      .map(p => plot.get(p).plotInfo.map(i => {
        const edges = getEdgeCoordinatesForPlot(i.positions, map);
        const top = edges.filter(e => e.type === "top");
        const bot = edges.filter(e => e.type === "bottom");
        const left = edges.filter(e => e.type === "left");
        const right = edges.filter(e => e.type === "right");

        const constructedTop = constructEdges(top);
        const constructedBot = constructEdges(bot);
        const constructedLeft = constructEdges(left);
        const constructedRight = constructEdges(right);
        const numEdges = constructedBot.length + constructedTop.length + constructedLeft.length + constructedRight.length;
        return numEdges * i.area;
      }).reduce((acc, price) => acc + price, 0))
      .reduce((acc, price) => acc + price, 0);

    console.log("NEW PRICE: ", newPrice);
  });
}