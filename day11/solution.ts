//const input: string = "8793800 1629 65 5 960 0 138983 85629" as const;
const input: string = "1" as const;

type Stone = [number, number] | [number];

type Action = (stone: Stone) => Stone
type Rule = (s: Stone) => boolean;

type RuleBook = {
    predicate: Rule, 
    action: Action
}[]

type StoneState = Map<number, number>;

type Process = {
    ruleBook: RuleBook,
    default: Action
}

const multiplyBy2024 = (stone: Stone) : Stone => [stone[0] * 2024];

const splitStone = (stone: Stone) : Stone => {
    const str = `${stone[0]}`;
    const strLen = str.length / 2;
    return [Number(str.substring(0, strLen)), Number(str.substring(strLen))];
}

const changeStone = (stone: Stone) : Stone => {
    return [1];
}

const isStoneAZero = (stone: Stone) => stone[0] === 0;
const isStoneEven = (stone: Stone) => `${stone[0]}`.length % 2 === 0;

const Rules: Process = {
    ruleBook: [
        {predicate: isStoneAZero, action: changeStone},
        {predicate: isStoneEven, action: splitStone}
    ],
    default: multiplyBy2024
}

function singleStoneBlink(stone: Stone, memo: Map<number, Stone>): Stone {
    if(memo.has(stone[0])) return memo.get(stone[0])
    for( let ruleIdx = 0 ; ruleIdx < Rules.ruleBook.length ; ruleIdx++){ 
        const rule = Rules.ruleBook[ruleIdx];
        if(rule.predicate(stone)){
            const s = rule.action(stone);
            const old = stone[0];
            memo.set(old, s);
            return s;
        }
    }
    return Rules.default(stone);
}

function blink(stones: Stone[], stoneMemo: Map<number, Stone>, blinkMemo: Map<string, Stone[]>) : Stone[]{
    const stoneStr = stones.map(s => s[0]).join(" ");

    if(blinkMemo.has(stoneStr)) return blinkMemo.get(stoneStr);

    stones = stones.map(s => singleStoneBlink(s, stoneMemo));
    // now we can consolidate the stones
    const newConfig =  stones.reduce((acc, stone) => {
        if(stone.length === 2){
            return [...acc, [stone[0]], [stone[1]]]
        }
        return [...acc, stone]
    },[]);

    blinkMemo.set(stoneStr, newConfig)
    return newConfig;
}

const getStartingStores = () : Stone[] => input.split(" ").map(s => [Number(s)]);

const toStartingStoneState = (stones : Stone[]) : StoneState => {
    const state = new Map<number,number>();

    stones.map(s => {
        if(state.has(s[0])){
            state.set(s[0], state.get(s[0])+1);
            return;
        }
        state.set(s[0], 1)
    });
}

export default function(){
    let stones = getStartingStores();
    const memo = new Map<string, Stone[]>();
    const stoneMemo = new Map<number, Stone>();
    for(let i = 0 ; i < 75 ; i++) {
        stones = blink(stones, stoneMemo, memo);
        console.log(i);
    }
    console.log(stones.length)
}