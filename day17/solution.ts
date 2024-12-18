import { promises as fs } from "fs";
const RegisterARegex: RegExp = /Register A: (\d+)/;
const RegisterBRegex: RegExp = /Register B: (\d+)/;
const RegisterCRegex: RegExp = /Register C: (\d+)/;
const ProgramRegex: RegExp = /Program: ([,?\d+,?]+)/;

type Code = 0n | 1n | 2n | 3n | 4n | 5n | 6n | 7n;

type Register = bigint;

class VM {
  A: Register;
  B: Register;
  C: Register;

  output: bigint[];

  constructor(a: Register, b: Register, c: Register) {
    this.A = a;
    this.B = b;
    this.C = c;
    this.output = [];
  }

  run(program: Code[]) {
    // we need to reverse this 
    let ip = 0;

    for (ip = 0; ip < program.length - 1; ip += 2) {
      // we need to execute the instruction

      // halt if we try to read an opcode past the length of the program
      const opCode = program[ip];
      const operand = program[ip + 1];

      switch (opCode) {
        case 0n:
          this.adv(operand);
          break;
        case 1n:
          this.bxl(operand);
          break;
        case 2n:
          // console.log("at bst -- a: ", this.A, `(${toBin(this.A)})`, "b: ", this.B, "c: ", this.C);
          this.bst(operand);
          break;
        case 3n: {
          // console.log("at jmp -- a: ", this.A, `(${toBin(this.A)})`, "b: ", this.B, "c: ", this.C);
          if (this.A !== 0n) {
            ip = Number(operand - 2n);
          }
          break
        }
        case 4n:
          this.bxc(operand);
          break;
        case 5n:
          this.out(operand);
          break
        case 6n:
          this.bdv(operand);
          break
        case 7n:
          this.cdv(operand);
          break
      }
    }
    return this.output;
  }

  private combo(operand: Code) {
    switch (operand) {
      case 0n:
      case 1n:
      case 2n:
      case 3n:
        return operand;
      case 4n:
        return this.A;
      case 5n:
        return this.B;
      case 6n:
        return this.C;
      case 7n:
        throw new Error("fatal: program invalid");
    }
  }

  private bxl(operand: Code) {
    this.B = this.B ^ operand;
  }

  private bxc(operand: Code) {
    this.B = this.B ^ this.C;
  }

  private bdv(operand: Code) {
    this.B = this.divide(operand);
  }

  private cdv(operand: Code) {
    this.C = this.divide(operand);
  }

  private adv(operand: Code) {
    this.A = this.divide(operand);
  }

  private bst(operand: Code) {
    this.B = this.combo(operand) % 8n;
  }

  private out(operand: Code) {
    const out = this.combo(operand) % 8n;
    this.output.push(out);
  }

  private divide(operand: Code) {
    const numerator = this.A;
    const denom = 2n ** this.combo(operand);

    const result = numerator / denom;
    return result;
  }
}


// this is what the program reduces down to 
const simulate = (A: bigint) => {
  let B = A % 8n;
  B = B ^ 5n;
  const C = A / 2n ** B;
  B = B ^ 6n;
  A = A / 8n;
  B = B ^ C;
  return [A, B, C];
}

const simulateCondensed = (A: bigint) => [A >> 3n, (((A & 7n) ^ 5n) ^ 6n) ^ (A >> ((A & 7n) ^ 5n)), A >> ((A & 7n) ^ 5n)];

async function parseInputFile(
  path: string
): Promise<[VM, Code[]]> {
  const str = await fs.readFile(path, "ascii");
  const A = BigInt(str.match(RegisterARegex)[1]);
  const B = BigInt(str.match(RegisterBRegex)[1]);
  const C = BigInt(str.match(RegisterCRegex)[1]);
  const prog = str.match(ProgramRegex)[1].split(",").map(t => {
    const num = BigInt(t);
    if (num < 0 || num > 7) throw new Error("invalid program");
    return num as Code;
  });

  return [new VM(A, B, C), prog]
}

/*
A = ? 
B = 0
C = 0

2,4 : B = A % 8; (B is either 0 1 2 3 4 5 6 7)
1,5 : B = B ^ 5;
7,5 : C = A / (2**B);
1,6 : B = B ^ 6;
0,3 : A = A / (2**3) = A / 8
4,6 : B = B ^ C;
5,5 : out;
3,0 : jump to 0


2,4 : B = A % 8; (B is either 0 1 2 3 4 5 6 7)
1,5 : B = B ^ 5;
7,5 : C = A / (2**B); => shift by B bits to the right
1,6 : B = B ^ 6;
0,3 : A = A / (2**3) = A / 8 => shift by 3 bits to the right
4,6 : B = B ^ C;
5,5 : out;
3,0 : jump to 0

on each iteration A is shifted to the right 3 times 
so we know for it to print out a number there has to be 3 

we can then work backwards 

2,4,1,5,7,5,1,6,0,3,4,6,5,5,3,0

so to get 0 , the end of the string has to be 0
then to get an output of 3 A must be 101. The next itr A must be 0 to stop the  execution

our output is the following 
 1000
*/

const findSelfPrintingProgram = (program: Code[]) => {
  const output = [...program];
  output.reverse();
  console.log(output)
  let candidates = new Set<bigint>();

  // start with 0; -- terminating
  candidates.add(0n);

  // now we cangenerate
  for (let j = 0; j < output.length; j++) {
    // we are trying to find the output output[1]...,output[0]
    // so the number of bits we are looking for is whatever is in our current set with 3 extra bits
    const newCandidates = new Set<bigint>();
    for (const b of candidates) {

      // add 000 ... 111 to the end of the candidate number
      for (let i = 0n; i < 8n; i++) {

        // using the next candidate number strip off the last 3 digits and add 000 ... 111
        // and simulate it 
        const a = (BigInt(b) << BigInt(3n)) + BigInt(i);

        const sim = simulate(a);

        // generate output 
        if (sim[1] % 8n === output[j]) {
          newCandidates.add(a);
        }
      };
    }

    // we have a set of new candidate numbers so now run until we have generated the required
    // output
    candidates = newCandidates;
  }

  // minimise 
  return [...candidates].sort((a, b) => Number(a - b))[0]
}

const simulateTillEnd = (a: bigint) => {
  const output: bigint[] = [];
  while (a !== 0n) {
    const out = simulateCondensed(a);
    output.push(out[1] % 8n);
    a = out[0];
  }
  return output;
}

const generateProgram = (program: Code[]) => {
  const expected = program.join(",");
  let i = 0n;

  while (true) {
    const out = simulateTillEnd(i);
    const vmOut = out.join(",");
    if (expected === vmOut) return i;
    if (expected.endsWith(vmOut)) {
      i = i * 8n;
    } else {
      i++;
    }
  }
}

const toDec = (b: string) => parseInt(b, 2);
const toBin = (n: number) => (n >>> 0).toString(2);

export default async function () {
  const [vm, program] = await parseInputFile("day17/input.txt");
  const output = vm.run(program);
  console.log("output: ", output);

  // find the self printing config
  //console.log("self printing: ", findSelfPrintingProgram(program));
  console.log("self printing: ", generateProgram(program));
}