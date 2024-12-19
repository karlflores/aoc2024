import { promises as fs } from "fs";
import { Heap } from "heap-js"

type Stripe = string
type Towel = string

async function parseInputFile(
  path: string
): Promise<[Stripe[], Towel[]]> {
  const [stripeStr, towelStr] = (await fs.readFile(path, "ascii")).split("\r\n\r\n");
  const stripes = stripeStr.split(", ");
  const towels = towelStr.split("\r\n");
  return [stripes, towels];
}

const canConstruct = (towel: Towel, stripes: Stripe[]) => {
  // first filter out the stripes so that it contains only substrings found in towel 
  const filtered = stripes.filter(s => towel.includes(s));

  const q: string[] = [''];
  const processed = new Set<string>();

  while (q.length > 0) {
    const candidate = q.shift();
    processed.add(candidate);
    if (towel === candidate) {
      return true;
    }
    const rem = filtered.filter(f => towel.startsWith(`${candidate}${f}`));
    for (const f of rem) {
      const next = `${candidate}${f}`;

      if (!processed.has(next)) {
        q.push(next);
      }
    }
  }

  return false;
}

const getAllCombinations = (towel: Towel, stripes: Stripe[]) => {
  const dp = `${towel} `.split("").map(() => 0);
  dp[0] = 1;

  towel
    .split("")
    .map((_, i) => towel.substring(0, i + 1))
    .map(target => {
      stripes.filter(t => target.endsWith(t))
        .map(c => dp[target.length] += dp[target.length - c.length]);
    })

  return dp[towel.length];
}


export default async function () {
  const [stripes, towels] = await parseInputFile("day19/input.txt");

  const p = towels.map((t, i) => {
    const y = getAllCombinations(t, stripes)
    console.log(i, t, y)
    return y;
  }).filter(t => t > 0);

  // now we have the possible towels we need to work out all combinations that lead to
  // that towel

  console.log("part 1:", p.length);
  console.log("part 2:", p.reduce((acc, c) => acc + c, 0));
}