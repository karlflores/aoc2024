import {promises as fs} from 'fs'
type NumberPair = [number, number]
type Delimiter = "   "

async function parseInput(path: string): Promise<NumberPair[]> {
    const delimiter: Delimiter = "   ";
    const fileData = await fs.readFile(path, 'ascii');
    const lines = fileData.split("\n");
    return lines.map(line => {
        const nums = line.split(delimiter).map(l => l.trimEnd());
        return [parseInt(nums[0]), parseInt(nums[1])];
    });
}

function calculateDistance(pair: NumberPair): number {
    return Math.abs(pair[0] - pair[1]);
}

function similarityScore(val: number, list: number[]) : number{
    return list.filter(n => n === val).length * val;
}

export default function(): void {
    parseInput("day1/input.txt").then(d => {
        const list1 = d.map( pair => pair[0]).sort((a,b) => a - b)
        const list2 = d.map( pair => pair[1]).sort((a,b) => a - b)
        const zipped: NumberPair[] = list1.map((num, i) => [num, list2[i]])
        const value: number = zipped
            .reduce((curr, a) => curr + calculateDistance(a), 0)
        console.log("Diff sum: " ,value);
        const similarity = list1.map(r => similarityScore(r, list2))
            .reduce((curr, s) => s + curr, 0);
        console.log("Similarity score: ", similarity);
    });
}


