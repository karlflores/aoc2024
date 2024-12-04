import { promises as fs } from 'fs'

type ValidChars = "X" | "M" | "A" | "S";
type Word = ValidChars[];
type Crossword = Word[];
type ValidWord = "XMAS" | "SAMX";

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

export default function solution(){
    parseInputFile('day4/input.txt').then((data => {
        // get row words
        let numWords = data.reduce((acc, r) => acc + countValidWordsInWord(r), 0);

        // get row words
        numWords += data[0].reduce((acc, _, i) => {
            const col = getColumn(i, data);
            return acc + countValidWordsInWord(col);
        }, 0);

        // now we have to do the diagonals -- do down right diag first
        for(let i = 1 ; i < data.length  ; i++){
            const word = getDownRightDiagonal(i, 0, data);
            numWords += countValidWordsInWord(word);
        }


        // now do the rows 
        numWords += data[0].reduce((acc, _, i) => acc + countValidWordsInWord(getDownRightDiagonal(0,i,data)) + countValidWordsInWord(getDownLeftDiagonal(0,i,data)),0);

        // do the last diagonal
        for(let i = 1 ; i < data.length  ; i++){
            const word = getDownLeftDiagonal(i, data.length-1, data);
            numWords += countValidWordsInWord(word);
        }

        console.log(numWords);
    }));
}