import { promises as fs } from "fs";
const RegisterARegex: RegExp = /Register A: (\d+)/;
const RegisterBRegex: RegExp = /Register B: (\d+)/;
const RegisterCRegex: RegExp = /Register C: (\d+)/;
const ProgramRegex: RegExp = /Program: ([,?\d+,?]+)/;

type Code = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Register = number;

class VM {
  A: Register;
  B: Register;
  C: Register;

  output: number[];

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
        case 0:
          this.adv(operand);
          break;
        case 1:
          this.bxl(operand);
          break;
        case 2:
          this.bst(operand);
          break;
        case 3: {
          if (this.A !== 0) {
            ip = operand - 2;
          }
          break
        }
        case 4:
          this.bxc(operand);
          break;
        case 5:
          this.out(operand);
          break
        case 6:
          this.bdv(operand);
          break
        case 7:
          this.cdv(operand);
          break
      }
    }
    return this.output.join(",");
  }

  private combo(operand: Code) {
    switch (operand) {
      case 0:
      case 1:
      case 2:
      case 3:
        return operand as number;
      case 4:
        return this.A;
      case 5:
        return this.B;
      case 6:
        return this.C;
      case 7:
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
    this.B = this.combo(operand) % 8;
  }

  private out(operand: Code) {
    const out = this.combo(operand) % 8;
    this.output.push(out);
  }

  private divide(operand: Code) {
    const numerator = this.A;
    const denom = Math.pow(2, this.combo(operand));

    const result = numerator / denom;
    return Math.floor(result);
  }
}

async function parseInputFile(
  path: string
): Promise<[VM, Code[]]> {
  const str = await fs.readFile(path, "ascii");
  const A = Number(str.match(RegisterARegex)[1]);
  const B = Number(str.match(RegisterBRegex)[1]);
  const C = Number(str.match(RegisterCRegex)[1]);
  const prog = str.match(ProgramRegex)[1].split(",").map(t => {
    const num = Number(t);
    if (num < 0 || num > 7) throw new Error("invalid program");
    return num as Code;
  });

  return [new VM(A, B, C), prog]
}
export default async function () {
  const [vm, program] = await parseInputFile("day17/short.txt");
  const output = vm.run(program);
  console.log(output);
}