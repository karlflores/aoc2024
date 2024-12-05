import { promises as fs } from 'fs'

type Rule = {
    to: Page, 
    from: Page
};

type Rules = Map<number, Set<Page>>;
type Update = Page[];
type Page = number;

const NEWLINE = "\n"

async function parseInputFile(path: string): Promise<[Rules, Rules, Update[]]> {
  const str = await fs.readFile(path, 'ascii');

  const inputRows = str.split(NEWLINE).map(row => row.trimEnd());
  const splitPoint = inputRows.indexOf("");
  const rules: Rule[] = inputRows.slice(0, splitPoint).map(str => {
    const [to, from] = str.split("|").map(s => Number(s));
    return {
        to, from
    };
  })
  const updates: Update[] = inputRows.slice(splitPoint+1, inputRows.length).map(str => str.split(",").map(s => Number(s)));
  const forwardRuleMap: Rules = new Map(); 
  const backwardRuleMap: Rules = new Map(); 

  rules.map(r => {
    if(!forwardRuleMap.get(r.from)){
        forwardRuleMap.set(r.from, new Set());
    }
    if(!backwardRuleMap.get(r.to)){
        backwardRuleMap.set(r.to, new Set());
    }
    forwardRuleMap.get(r.from).add(r.to);
    backwardRuleMap.get(r.to).add(r.from);
  });

  return [forwardRuleMap, backwardRuleMap, updates]
}

function isPageValid(pageIdx: number, forwardRules: Rules, backwardRules: Rules, updates: Update) : boolean {
    if(pageIdx < 0 || pageIdx >= updates.length ) return false;
    const page = updates[pageIdx];

    // if we are at index 0 we can just check forward rules 
    if(pageIdx === 0){
        const [from,...rest] = updates;
        return rest.reduce((acc, to) => !backwardRules.get(from).has(to) && acc , true);
    }

    if(pageIdx === updates.length-1){
        const rest = [...updates]
        const from = rest.pop();
        return rest.reduce((acc, to) => !forwardRules.get(from).has(to) && acc , true);
    }

    const forward = forwardRules.get(page);
    const backward = backwardRules.get(page);
    const back = [...updates];
    const front = back.splice(pageIdx);

    // now we just need to check the elements before the page and after the page to check if the rules are satisfied   
    const backValid = back.reduce((acc,to) => !forward.has(to) && acc, true);
    const frontValid = front.reduce((acc,to) => !backward.has(to) && acc, true);
    return backValid && frontValid;
}

function isUpdateValid(updates: Update, forwardRules: Rules, backwardRules: Rules) : boolean {
    return updates.reduce((acc, _, idx) => acc && isPageValid(idx, forwardRules, backwardRules, updates), true);
}

export default function solution(){
    parseInputFile('day5/input.txt').then((([backward, forward, updates]) => {
        const valid = updates.filter((u) => isUpdateValid(u, forward, backward));
        const invalid = updates.filter((u) => !isUpdateValid(u, forward, backward));
        console.log(invalid);
        console.log(valid.reduce((acc, rule) => {
            const idx = Math.floor(rule.length / 2);
            return acc + rule[idx];
        }, 0));
    }));
}