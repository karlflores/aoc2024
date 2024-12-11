const input: string = "8793800 1629 65 5 960 0 138983 85629" as const;
// const input: string = "125 17" as const;

type Stone = number;

type Action = (stone: Stone, count: number) => [ActionResult] | [ActionResult, ActionResult]
type Predicate = (s: Stone) => boolean;

type Rule = {
    predicate: Predicate, 
    action: Action
}

type StoneState = Map<number, number>;

type ActionResult = {
    stone: Stone,
    count: number
}

type StateRules = {
    rules: Rule[],
    default: Action
}

const multiplyBy2024 = (stone: Stone, count: number) : [ActionResult] => {
    return [{
        count,
        stone: stone * 2024,
    }];
}

const splitStone = (stone: Stone, count: number) : [ActionResult, ActionResult] => {
    const str = `${stone}`;
    const strLen = str.length / 2;
    return [
        {
            count,
            stone: Number(str.substring(0, strLen)),
        }, 
        {
            count,
            stone: Number(str.substring(strLen))
        }
    ];
}

const changeStone = (stone: Stone, count: number) : [ActionResult] => {
    return [{
        stone: 1,
        count,
    }];
}

const isStoneAZero = (stone: Stone) => stone === 0;
const isStoneEven = (stone: Stone) => `${stone}`.length % 2 === 0;

const Rules: StateRules = {
    rules: [
        {predicate: isStoneAZero, action: changeStone},
        {predicate: isStoneEven, action: splitStone}
    ],
    default: multiplyBy2024
} as const;

function applyRule(stone: Stone, count: number) : ActionResult[] {
    for(const rule of Rules.rules){
        if(rule.predicate(stone)){
            return rule.action(stone, count);
        }
    }
    return Rules.default(stone, count);
}

function blink(state: StoneState) : StoneState{
    const nextState = new Map<number, number>();

    // generate next state
    for(const [stone, count] of Array.from(state.entries())){
        const res = applyRule(stone, count);
        res.map(r =>  nextState.has(r.stone) 
            ? nextState.set(r.stone, nextState.get(r.stone)+r.count) 
            : nextState.set(r.stone, r.count))
    }

    return nextState;
}

const getStartingStones = () : Stone[] => input.split(" ").map(s => Number(s));

const toState = (stones : Stone[]) : StoneState => {
    const state = new Map<number,number>();

    stones.map(s => {
        if(state.has(s)){
            state.set(s, state.get(s)+1);
            return;
        }
        state.set(s, 1)
    });
    return state;
}

export default function(){
    const stones = getStartingStones();
    let state = toState(stones);

    for(let i = 0 ; i < 75 ; i++){ 
        state = blink(state);
    }
    const val = Array.from(state.values()).reduce((acc, v) => acc + v,0) 
    console.log("Part 2: ", val);
}