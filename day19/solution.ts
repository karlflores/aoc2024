import { promises as fs } from "fs";

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
    if (candidate === towel) return true;
    for (const f of filtered) {
      const next = `${candidate}${f}`;

      if (towel.startsWith(next) && !processed.has(next)) {
        q.push(next);
      }
    }
  }

  return false
}

export default async function () {
  const [stripes, towels] = await parseInputFile("day19/input.txt");
  const numPossible = towels.filter(t => {
    const can = canConstruct(t, stripes)
    if (can) console.log(t)
    return can;
  }).length;
  console.log(numPossible);
}