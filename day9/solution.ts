import { promises as fs } from "fs";

type File = number;
type Space = File | null;
type Block = {
  headSpace: number
  head: File[]
  tail: File[]
  tailSpace: number
}

async function parseInputFile(
  path: string
): Promise<Block[]> {
  const str = (await fs.readFile(path, "ascii")).trimEnd().split("").map(s => Number(s));
  const blocks: Block[] = [];
  let id = 0;
  while(str.length > 0){
    // pop the first two elements out 
    const usedSpace = str.shift();
    const freeSpace = str.shift();
    blocks.push({
      headSpace: 0,
      head: Array.from(Array(usedSpace).keys()).map(() => id),
      tail: [],
      tailSpace : freeSpace ?? 0,
    });
    id++;
  }  
  return blocks;
}

function findFreeBlockIndex(blocks: Block[], src: Block, startIdx: number, endIdx: number) : number | null {
  for(let i = startIdx ; i <= endIdx ; i++) {
    if(blocks[i].tailSpace >= src.head.length) return i;
  }
  return null;
}

function sortBlocks(blocks: Block[]) : Space[] {
  // assume we are going to be moving files into the first block first 

  let srcIdx = blocks.length - 1;
  while(srcIdx >= 0){

    // now find the free block index to insert into
    const targetIdx = findFreeBlockIndex(blocks, blocks[srcIdx], 0, srcIdx-1);

    if(targetIdx !== null){
      blocks[targetIdx].tail = [...blocks[targetIdx].tail, ...blocks[srcIdx].head]
      blocks[targetIdx].tailSpace -= blocks[srcIdx].head.length;
      blocks[srcIdx].headSpace += blocks[srcIdx].head.length;
      blocks[srcIdx].head = [];
    }
    srcIdx--;
  }
  return flattenBlocks(blocks);
}

function flattenBlocks(blocks: Block[]) : (File | null)[] {
  let files: File[] = [];
  for(const b of blocks) {
    files = [...files, ...Array.from(Array(b.headSpace).keys()).map(() => null), ...b.head, ...b.tail, ...Array.from(Array(b.tailSpace).keys()).map(() => null)];
  }
  return files;
}

export default function () {
  parseInputFile("day9/input.txt").then(b => {
    console.log(sortBlocks(b).reduce((acc, id, i) => acc + (id !== null ? id * i : 0), 0));
  });
}