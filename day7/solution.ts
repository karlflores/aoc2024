import { promises as fs } from "fs";

type EquationParams = number[]
type Equation = {
    total: number,
    params: EquationParams
}

type Operator = "*" | "+" | "||";

type EquationResult = {
    solvable: false
} | {
    solvable: true, 
    operators: Operator[]
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

// // sad if only this was orderable via a bitmap
// function generateOperatorSequence(binaryRepresentation: number, bits: number): Operator[]{
//     // we just need to shift the bits 1 by 1 until we react the number of bits required. 
//     let operators: Operator[] = [];
//     for(let i = 0 ; i < bits ; i++){
//         if((binaryRepresentation & (1 << i)) > 0){
//             operators.push("*");
//         } else {
//             operators.push("+");
//         }
//     }
//     return operators
// }

function areParamsValid(target: number, current: number, params: EquationParams) : boolean {
    if(params.length === 0){
        return current === target
    }

    if(current > target) {
        return false;
    }

    // now we can take the current number and do the operations we need
    const [next, ...rest] = params;
    return areParamsValid(target, current+next, rest) || areParamsValid(target, current*next, rest) || areParamsValid(target, Number(`${current}${next}`), rest);
}

// function generateSolution(equation: Equation) : EquationResult {
//     const paramLength = equation.params.length; 
    
//     // now we generate the highest bitmask 
//     let l = 0;
//     let r = Math.pow(2, paramLength) - 1;
    
//     // mid point = 

//     while(l <= r) {
//         const mid = Math.floor((l + r) / 2);

//         // generate the operator sequence
//         const operators = generateOperatorSequence(mid, paramLength-1);

//         const number = applyParams(equation.params, operators);

//         if(number === equation.total){
//             return {
//                 solvable: true,
//                 operators
//             }
//         } else if (number < equation.total) {
//             // we need to search the right half
//             l = mid - 1;
//         } else {
//             r = mid + 1;
//         }
//     }

//     return {
//         solvable: false
//     }
// }

// function applyParams(params: number[], operators: Operator[]) : number {
//     const first = params.shift();
//     return params.reduce((acc, p, i) => operators[i] === "*" ? acc * p : acc + p, first);
// }

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