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

const arePreviousPagesValid = (forwardRules: Rules, rest: Update, from: Page) : boolean =>
    rest.reduce((acc, to) => !forwardRules.get(from).has(to) && acc , true);

type Combination = [Page[], Page[]]

function generateCorrectOrdering(forwardRules: Rules, updates: Update) : Update | null{

    // dfs the solution
    const initCominbation = [...updates];
    const correctUpdate : Page[] = [];
    const queue: Combination[] = [[correctUpdate, initCominbation]];

    const visited = new Set<Page[]>();
    // treat options as a queue 
    while(queue.length > 0) { 
        // choose an element from the available options -- dequeue element 
        const [update, options] = queue.pop();

        if(update.length === updates.length){
            return update;
        }
        
        for(let i = 0; i < options.length ; i++){
            // only push valid combinations into the queue. 
            if(arePreviousPagesValid(forwardRules, update, options[i])){
                const newUpdate = [...update, options[i]];
                if(!visited.has(newUpdate)){
                    queue.push([[...update, options[i]], options.filter((_,idx) => idx !== i)]);
                }
            } else {
                continue; 
            }
        }
    }
    return null;
}

function sortToCorrectOrdering(rules: Rules, update: Update) : Update {
    return update.sort((a,b) => rules.get(a).has(b) ? 1 : -1 );
}

function isUpdateValid(updates: Update, forwardRules: Rules, backwardRules: Rules) : boolean {
    return updates.reduce((acc, _, idx) => acc && isPageValid(idx, forwardRules, backwardRules, updates), true);
}

export default function solution(){
    parseInputFile('day5/input.txt').then((([backward, forward, updates]) => {
        const valid = updates.filter((u) => isUpdateValid(u, forward, backward));
        const invalid = updates.filter((u) => !isUpdateValid(u, forward, backward));

        console.log(
            "Part 1: ", 
            valid.reduce((acc, rule) => {
                const idx = Math.floor(rule.length / 2);
                return acc + rule[idx];
            }, 0)
        );

        // now for each invalid update we can generate the valid combinations
        console.log(
            "Part 2: ", 
            invalid.map(i => sortToCorrectOrdering(forward, i)).reduce((acc, rule) => acc + rule[Math.floor(rule.length / 2)], 0)
        );
    }));
}