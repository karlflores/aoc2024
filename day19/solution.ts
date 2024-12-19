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

  return false
}

const getAllCombinations = (towel: Towel, stripes: Stripe[]) => {
  const filtered = stripes.filter(s => towel.includes(s));

  const pq = new Heap<string>((a, b) => a.length - b.length || a.localeCompare(b));
  const processed = new Set<string>();
  pq.add("");
  let n = 0;

  while (pq.length > 0) {
    const candidate = pq.pop();
    processed.add(candidate);
    // add the candidate to the numPossibilities dict

    if (towel === candidate) {
      n++;
      while (pq.peek() == towel) {
        n++;
        pq.pop();
      }

      return n;
    }

    for (const f of filtered) {

      // construct the next string to test 
      const next = `${candidate}${f}`;
      // here we have constructed a next candidate we have seen before therefore we can increment 
      // count
      if (towel.startsWith(next) && !processed.has(next)) {
        pq.push(next);
      }
    }
  }

  return 0;
}

export default async function () {
  const [stripes, towels] = await parseInputFile("day19/input.txt");

  const p = towels.filter((t, i) => {
    const y = canConstruct(t, stripes)
    if (y) console.log(i, t)
    return y;
  });

  console.log("Possible towels:", p.length);

  const possible = p.map((t, i) => {
    const p = getAllCombinations(t, stripes)
    console.log(i, "string:", t, p)
    return p;
  });

  // now we have the possible towels we need to work out all combinations that lead to
  // that towel

  console.log(possible.reduce((acc, c) => acc + c, 0));
}