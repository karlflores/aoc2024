import {promises as fs} from 'fs'

type Identifier = string;
type Expression = number;

type Function = {
    identifier: Identifier
    arguments: Expression[]
}

type Instruction = Function;

type ValidInstruction = 
    { identifier: "do", arguments: [] } | 
    { identifier: "don't", arguments: [] } | 
    { identifier: "mul", arguments: [number, number] } ;

type Lexer = {
    input: string;
    position: number; 
    readPosition: number;
    ch: string;
}

type Environment = {
    executeInstruction: boolean,
    output: number;
};

const APOSTROPHE = "'";
const LPAREN = "(";
const RPAREN = ")";
const COMMA = ",";
const EOF = "\x00";

const DO = "do";
const DONT = "don't";
const MUL = "mul";

// LEXER
function readChar(lexer: Lexer) : void {
    if(lexer.readPosition >= lexer.input.length){
        lexer.ch = '\0';
    } else {
        lexer.ch = lexer.input[lexer.readPosition];
    }
    lexer.position = lexer.readPosition;
    lexer.readPosition++;
}

function readNextIdentifier(lexer: Lexer) : Identifier | null {
    if(lexer.readPosition >= lexer.input.length){
        return null;
    }

    // assume that an identifer is just a string of letters 
    while(!isLetter(lexer.ch)){
        if(compareCurrentChar(lexer, EOF)){
            break;
        }        
        readChar(lexer);
    }

    // we have reached end of file
    if(compareCurrentChar(lexer, EOF)){
        return null;
    }

    // lexer is now on a letter so lets attempt to read an identifier
    const ident = readString(lexer);

    // now an identifier can have an apostrophe so we need to parse both forms 
    // str and str'str
    if(compareCurrentChar(lexer, LPAREN)){
        return ident;
    }

    if(!compareCurrentChar(lexer, APOSTROPHE)){
        return readNextIdentifier(lexer);
    }

    readChar(lexer);

    if(!isLetter(lexer.ch)){
        return readNextIdentifier(lexer);
    }

    const strEnd = readString(lexer);
    if(!compareCurrentChar(lexer, LPAREN)){
        return readNextIdentifier(lexer);
    }

    return `${ident}'${strEnd}`;
}

function readString(lexer: Lexer) : string {
    const start = lexer.position;
    // we want to read until we get to a '('
    while(isLetter(lexer.ch)){
        readChar(lexer);
    }
    return lexer.input.substring(start, lexer.position);
}

function readArguments(lexer: Lexer) : Expression[] | null {
    // lexer will now point to 123,23,23,44 or invalid
    const args: Expression[] = [];

    // try read till end of string
    while(lexer.ch !== '\x00') {
        
        // lexer points to )... or args...)...
        if(compareCurrentChar(lexer, RPAREN)){
            break;
        }

        // either the lexer points to num,num...)... or num)... or ,num)...

        // try to read a comma
        if(compareCurrentChar(lexer, COMMA)){
            readChar(lexer);
        }

        // either the lexer points to num,num...)... or num)... 
        if(!isNumber(lexer.ch)){
            return null;
        }

        const num = readNumber(lexer);

        args.push(num);
    }

    if(!compareCurrentChar(lexer, RPAREN)){
        return null;
    }

    // we have an RPAREN
    readChar(lexer);

    return args;
}

function readNextInstruction(lexer: Lexer) : Function | null {
    // input takes the form ident(...
    const identifier = readNextIdentifier(lexer);
    if(identifier === null) {
        return null;
    }

    // lexer is now at (args...
    if(!compareCurrentChar(lexer,LPAREN)){
        return readNextInstruction(lexer);
    }
    readChar(lexer);

    // lexer is now at args...
    const args = readArguments(lexer);
    if(args === null){
        return readNextInstruction(lexer);
    }

    // successfully read an instruction, now return
    return {
        identifier,
        arguments: args
    }
}

function compareCurrentChar(lexer: Lexer, char: string) : boolean {
    return lexer.ch === char;
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

async function parseInputFile(path: string) : Promise<string> {
    return await fs.readFile(path, 'ascii');
}

// INTERPRETER
async function executeCode(path: string) : Promise<number> {
    const input = await parseInputFile(path);

    const lexer = createLexer(input);
    const environment: Environment = {
        executeInstruction: true,
        output: 0,
    };

    // Get instructions from input code and try to execute
    let instruction = readNextInstruction(lexer);
    while(instruction !== null){
        executeInstruction(instruction, environment);
        instruction = readNextInstruction(lexer);
    }
    return environment.output;
}

function executeInstruction(instruction: Instruction, environment: Environment) : void {
    // test whether the current instruction is valid and execute it if it is 
    const validInstruction = GetValidInstruction(instruction);
    if(validInstruction === null){
        return;
    }
    executeValidInstruction(validInstruction, environment);
}

// coerce instruction into valid format for execution
function GetValidInstruction(instruction: Instruction): ValidInstruction | null {
    if(instruction.identifier.endsWith(DO)){
        return {
            identifier: DO,
            arguments: []
        };
    } 
    else if(instruction.identifier.endsWith(DONT)){
        return {
            identifier: DONT,
            arguments: []
        };
    }
    else if(instruction.identifier.endsWith(MUL) && instruction.arguments.length === 2){
        const [arg1, arg2] = instruction.arguments;
        return {
            identifier: MUL,
            arguments: [arg1, arg2]
        };
    }
    return null;
}

function executeValidInstruction<I extends ValidInstruction>(instruction: I, environment: Environment) {
    switch(instruction.identifier){
        case DO:
            environment.executeInstruction = true;
            break;
        case DONT:
            environment.executeInstruction = false;
            break;
        case MUL:
            if(environment.executeInstruction){
                environment.output += instruction.arguments.reduce((arg, res) => arg * res, 1);
            }
            break;
    }
}

// we only care about the following characters
export default function() : void{
    executeCode('day3/input.txt').then(
        d => {
            console.log("Total: ", d);
        }
    );
}