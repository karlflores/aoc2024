import { promises as fs } from 'fs'

type ValidChars = "X" | "M" | "A" | "S";
type Word = ValidChars[];
type Crossword = Word[];
type ValidWord = "XMAS" | "SAMX" | "SAM" | "MAS";  

const NEWLINE = "\n"

function countValidWordsInWord(word: Word) : number {
    let numFound = 0;
    for(let i = 0 ; i < word.length ; i++){
        if(word[i] === 'X' && isValidWord(i, word, 'XMAS')){
            numFound++; 
        } else if(word[i] === 'S' && isValidWord(i, word, 'SAMX')){
            numFound++; 
        }
    }

    return numFound;
}

function isValidCrossMas(row: number, column: number, crossword: Crossword) : boolean {
    if(row+2 >= crossword.length || column+2 >= crossword[0].length){
        return false;
    }

    if(crossword[row+1][column+1] !== 'A'){
        return false;
    }
 
    // now we can test the MAS or SAM on the diagonals one by one  
    const downRightValid = (crossword[row][column] === 'M' && crossword[row+2][column+2] === 'S' || crossword[row][column] === 'S' && crossword[row+2][column+2] === 'M' );
    const downLeftValid = (crossword[row][column+2] === 'S' && crossword[row+2][column] === 'M' || crossword[row][column+2] === 'M' && crossword[row+2][column] === 'S' );
    return downLeftValid && downRightValid;
}

function getColumn(column: number, crossword: Crossword) : Word {
    return crossword.map((_,i) => crossword[i][column]) 
}

function getDownRightDiagonal(row: number, column: number, crossword: Crossword) : Word {
    const maxLength = crossword.length;
    const word: Word = []
    for(let offset = 0 ; row+offset < maxLength && offset+column < crossword[0].length ; offset++) {
        word.push(crossword[row+offset][column+offset]) 
    }

    return word;
}

function getDownLeftDiagonal(row: number, column: number, crossword: Crossword) : Word {
    const maxLength = crossword.length;
    const word: Word = []
    for(let offset = 0 ; row+offset < maxLength && column-offset >= 0 ; offset++) {
        word.push(crossword[row+offset][column-offset]) 
    }

    return word;
}


function isValidWord(position: number, row: Word, validWord: ValidWord) : boolean {
    if(position + validWord.length > row.length ) {
        return false;
    }
    return validWord.split("").reduce((res, ch, i) => res && ch == row[position+i], true);
}

async function parseInputFile(path: string): Promise<Crossword> {
  const str = await fs.readFile(path, 'ascii');
  const crossword: Crossword = [];

  const inputRows = str.split(NEWLINE).map(row => row.trimEnd());
  for(const r of inputRows) {
    const row: Word = [];
    for(const s of r){
        switch(s){
            case "X":
            case "M":
            case "A":
            case "S":
                row.push(s);
                break;
            default: 
                Promise.reject("Input is invalid");
        } 
    }
    crossword.push(row)
  }
  return crossword;
}

function findValidWords(crossword: Crossword) : number {
    let numWords = crossword.reduce((acc, r) => acc + countValidWordsInWord(r), 0);

    // get row words
    numWords += crossword[0].reduce((acc, _, i) => {
        const col = getColumn(i, crossword);
        return acc + countValidWordsInWord(col);
    }, 0);

    // now we have to do the diagonals -- do down right diag first
    for(let i = 1 ; i < crossword.length  ; i++){
        const word = getDownRightDiagonal(i, 0, crossword);
        numWords += countValidWordsInWord(word);
    }


    // now do the rows 
    numWords += crossword[0].reduce((acc, _, i) => acc + countValidWordsInWord(getDownRightDiagonal(0,i,crossword)) + countValidWordsInWord(getDownLeftDiagonal(0,i,crossword)),0);

    // do the last diagonal
    for(let i = 1 ; i < crossword.length  ; i++){
        const word = getDownLeftDiagonal(i, crossword.length-1, crossword);
        numWords += countValidWordsInWord(word);
    }

    return numWords;
}

function findCrossMas(crossword: Crossword) : number {
    let numValid = 0;
    for(let row = 0 ; row + 2 < crossword.length ; row++) {
        for(let col = 0 ; col + 2 < crossword[0].length ; col++) {
            // now test the cross
            numValid += isValidCrossMas(row,col, crossword) ? 1 : 0;
        }
    }

    return numValid;
}

export default function solution(){
    parseInputFile('day4/input.txt').then((data => {
        console.log("Part 1: ",findValidWords(data));
        console.log("Part 2: ", findCrossMas(data));
    }));
}