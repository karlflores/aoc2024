import { promises as fs } from "fs";

type EquationParams = number[]
type Equation = {
    total: number,
    params: EquationParams
}

const NEWLINE = "\n";
const DELIMITER = ": ";
const SPACE = " ";

async function parseInputFile(
  path: string
): Promise<Equation[]> {
  const str = await fs.readFile(path, "ascii");
  const inputRows = str.split(NEWLINE).map((row) => row.trimEnd());
  return inputRows.map(row => {
    const [lhs, rhs] = row.split(DELIMITER);
    const total = Number(lhs);
    const params = rhs.split(SPACE).map(n => Number(n));
    return {total, params}
  });
}

function areParamsValid(target: number, current: number, params: EquationParams) : boolean {
    if(params.length === 0){
        return current === target
    }

    if(current > target) {
        return false;
    }

    // now we can take the current number and do the operations we need
    const [next, ...rest] = params;
    return areParamsValid(target, current+next, rest) 
        || areParamsValid(target, current*next, rest) 
        || areParamsValid(target, Number(`${current}${next}`), rest);
}

export default function solution(){
    parseInputFile("day7/input.txt").then((eqns) => {
        const valid = eqns.filter(e => {
            const [head, ...rest] = e.params;
            return areParamsValid(e.total, head, rest)
        });
        const total = valid.reduce((acc, e) => acc + e.total ,0);
        console.log(total);
    }) 
}