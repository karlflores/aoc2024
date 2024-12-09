import { promises as fs } from "fs";

type File = number;
type Block = {
  memory: File[]
  freeSpace: number
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
      memory: Array.from(Array(usedSpace).keys()).map(() => id),
      freeSpace : freeSpace ?? 0
    });
    id++;
  }  
  return blocks;
}

function sortBlocks(blocks: Block[]) : File[] {
  // assume we are going to be moving files into the first block first 

  let srcIdx = blocks.length - 1;
  let targetIdx = 0;
  while(targetIdx < srcIdx){
    // first we want to assume that this is the block we are reading into 
    if(blocks[targetIdx].freeSpace === 0){
      targetIdx++;
      continue;
    }

    // the target block has free space to utilise

    // now we can try to move as much free files as we can in the target block
    while(blocks[targetIdx].freeSpace > 0 && srcIdx > targetIdx){
      if(blocks[srcIdx].memory.length === 0) {
        srcIdx--;
        continue;
      }

      if(srcIdx <= targetIdx){
        blocks[Math.min(srcIdx,targetIdx)].freeSpace = 0;
        break;
      }

      blocks[targetIdx].memory.push(blocks[srcIdx].memory.pop());
      blocks[targetIdx].freeSpace--;
    }
  }
  return flattenBlocks(blocks);
}

function flattenBlocks(blocks: Block[]) : File[] {
  let files: File[] = [];
  for(const b of blocks) {
    if(b.memory.length === 0) {
      break;
    }

    // else we just want to keep spreading the files 
    files = files.concat(b.memory);
  }
  return files;
}

export default function () {
  parseInputFile("day9/input.txt").then(b => {
    console.log(sortBlocks(b).reduce((acc, id, i) => acc + id * i, 0));
  });
}