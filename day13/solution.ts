import { promises as fs } from "fs";

const GAMESEP = "\r\n\r\n";
const ButtonARegex: RegExp = /Button A: X\+(\d+), Y\+(\d+)/;
const ButtonBRegex: RegExp = /Button B: X\+(\d+), Y\+(\d+)/;
const PrizeRegex: RegExp = /Prize: X=(\d+), Y=(\d+)/;

type Key = "A" | "B" | "Prize"
type Game = {
  [K in Key]: Location
}
type Location = [number, number]

// solution -- matrix mul

// return 1 / det to ensure int
function det(game: Game) {
  const denom = game.A[0] * game.B[1] - game.B[0] * game.A[1];
  if (denom === 0) {
    return null;
  }

  return denom;
}

function solve(game: Game): [number, number] | null {
  const d = det(game);
  if (d === 0) return null;

  return [(game.B[1] * game.Prize[0] - game.B[0] * game.Prize[1]) / d,
  (-game.A[1] * game.Prize[0] + game.A[0] * game.Prize[1]) / d]
}

async function parseInputFile(
  path: string
) {
  const str = await fs.readFile(path, "ascii");
  const games = str
    .split(GAMESEP)
    .map((game): Game => {
      const a = game.match(ButtonARegex);
      const b = game.match(ButtonBRegex);
      const p = game.match(PrizeRegex);
      return {
        A: [Number(a[1]), Number(a[2])],
        B: [Number(b[1]), Number(b[2])],
        Prize: [10000000000000 + Number(p[1]), 10000000000000 + Number(p[2])]
      }
    });
  return games;
}

export default function () {
  parseInputFile("day13/input.txt").then(games => {
    const cost = games.map((game) => solve(game))
      .filter((res) => {
        if (!res) return false;
        console.log(res)
        return Number.isInteger(res[0])
          && Number.isInteger(res[1])
          && res[0] > 0 && res[1] > 0;
      })
      .reduce((acc, [a, b]) => acc + 3 * a + b, 0)

    console.log(cost);
  });
}