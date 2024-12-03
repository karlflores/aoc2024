
import {promises as fs} from 'fs'

type Mul = "mul";
type Do = "do";
type Dont = "don't";
type InstructionIdentifier = Mul | Do | Dont

type Identifier = string;

type Expression = number;

type Instruction = Do | Dont | MulInstruction;

type MulInstruction = {
    l: number,
    r: number
}

type Function = {
    identifier: Identifier
    arguments: Expression[]
}

type Lexer = {
    input: string;
    position: number; 
    readPosition: number;
    ch: string;
}

function readChar(lexer: Lexer) : void {
    if(lexer.readPosition >= lexer.input.length){
        lexer.ch = '\0';
    } else {
        lexer.ch = lexer.input[lexer.readPosition];
    }
    lexer.position = lexer.readPosition;
    lexer.readPosition++;
}

function readNextIdentifier(lexer: Lexer) : InstructionIdentifier | null {
    if(lexer.readPosition >= lexer.input.length){
        return null;
    }

    // assume that an identifer is just a string of letters 
    while(!isLetter(lexer.ch)){
        if(lexer.ch == '\x00'){
            break;
        }        
        readChar(lexer);
    }

    // we have reached end of file
    if(lexer.ch == '\x00'){
        return null;
    }

    // lexer is now on a letter so lets attempt to read an identifier

    let ident = readString(lexer);

    // now test whether the identifier ends with do or don -- if they do replace the ident
    if(ident.endsWith('do')){
        ident = 'do'
    } else if (ident.endsWith('don')) {
        ident = 'don'
    }


    let compareChar = '('
    // now we have a substring note that if we have don - this could be 't
    // switch based on the current input
    switch(ident){
        // this might be a mul token
        case 'mul':
            if(lexer.ch !== compareChar){
                return readNextIdentifier(lexer);
            }
            return 'mul';
        // this might be a do / don't token
        case 'do':
            if(lexer.ch !== compareChar){
                return readNextIdentifier(lexer);
            }
            return "do";
        case 'don':
            compareChar = "'";
            if(lexer.ch !== compareChar){
                return readNextIdentifier(lexer);
            }
            readChar(lexer);
            compareChar = "t";
            if(lexer.ch !== compareChar){
                return readNextIdentifier(lexer);
            }
            readChar(lexer);

            // then we can read a string again 
            compareChar = '('
            if(lexer.ch !== compareChar){
                return readNextIdentifier(lexer);
            }
            return "don't";
        default: 
            return readNextIdentifier(lexer);
    }
}

function readString(lexer: Lexer) : string {
    const start = lexer.position;
    // we want to read until we get to a '('
    while(isLetter(lexer.ch)){
        readChar(lexer);
    }
    return lexer.input.substring(start, lexer.position);
}

function readNextInstruction(lexer: Lexer) : Instruction | null {
    const identifer = readNextIdentifier(lexer);
    if(identifer === null) {
        return null;
    }

    let compareChar = '(';
    // now we have to read the next token 
    if(lexer.ch !== compareChar){
        return readNextInstruction(lexer);
    }
    readChar(lexer);

    // we either have do( or don't(
    if(identifer !== 'mul') {
        compareChar = ')'
        if(lexer.ch !== compareChar){
            return readNextInstruction(lexer);
        }
        readChar(lexer);
        return identifer;
    }

    // now we have to try read a number
    if(!isNumber(lexer.ch)){
        return readNextInstruction(lexer);
    }

    const num1 = readNumber(lexer);
    if(num1 === null){
        return readNextInstruction(lexer);
    }

    compareChar = ','
    if(lexer.ch !== compareChar){
        return readNextInstruction(lexer);
    }
    readChar(lexer);

    // now we have to try read a number
    if(!isNumber(lexer.ch)){
        return readNextInstruction(lexer);
    }

    const num2 = readNumber(lexer);
    if(num2 === null) {
        return readNextInstruction(lexer);
    }

    compareChar = ')'

    if(lexer.ch !== compareChar){
        return readNextInstruction(lexer);
    }
    readChar(lexer);

    return {
        l: num1,
        r: num2
    }

}

function readNumber(lexer: Lexer) : number | null { 
    const start: number = lexer.position; 
    while(isNumber(lexer.ch)){
        readChar(lexer);
    }
    const num = Number(lexer.input.substring(start, lexer.position));
    return isNaN(num) ? null : num;
}

function isNumber(input: string) : boolean {
    return !isNaN(Number(input));
}

function isLetter(input: string) : boolean {
    return input.toLowerCase() !== input.toUpperCase();
}

function createLexer(input: string): Lexer {
    return {
        input,
        position: 0,
        readPosition: 0,
        ch: ''
    };
}

async function parseInput(path: string) : Promise<string> {
    return await fs.readFile(path, 'ascii');
}

async function executeCode(path: string) : Promise<number> {
    const input = await parseInput(path);

    const lexer = createLexer(input);
    let total = 0;
    let executeInstruction = true;
    // read the first mul instruction
    let instruction = readNextInstruction(lexer);
    while(instruction !== null){
        switch(instruction){
            case "do": 
                executeInstruction = true;
                break;
            case "don't":
                executeInstruction = false;
                break;
            default: 
                total += executeInstruction ? evaluate(instruction) : 0;
                
        }
        instruction = readNextInstruction(lexer);
    }

    return total;

}

function evaluate(instruction: MulInstruction) : number {
    return instruction.l * instruction.r;
}



// we only care about the following characters
export default function() : void{
    executeCode('day3/input.txt').then(
        d => {
            console.log("Total: ", d);
        }
    );
}