const shortInput = [
  "029A",
  "980A",
  "179A",
  "456A",
  "379A"
]

const input = [
  "341A",
  "083A",
  "802A",
  "973A",
  "780A",
]
type Location = {
  r: number,
  c: number
}

type Invalid = "INVALID"
type Submit = "A"
type CodeValues = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "A" | Invalid | Submit
type DirectionalValues = "<" | ">" | "^" | "v" | Invalid | Submit

const DirectionalKeyPad: DirectionalValues[][] = [
  ["INVALID", "^", "A"],
  ["<", "v", ">"],
] as const;

const NumericKeyPad: CodeValues[][] = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["INVALID", "0", "A"],
] as const;

type SystemState = {
  doorRobot: Location,
  dirRobot1: Location,
  dirRobot2: Location,
  human: DirectionalValues[]
  output: string
}

const initialState = {
  // robot 1 is in the 
  doorRobot: { r: 3, c: 2 },
  dirRobot1: { r: 0, c: 2 },
  dirRobot2: { r: 0, c: 2 },
  human: [],
  output: ""
} satisfies SystemState;

const DirectionMap = {
  "<": { r: 0, c: -1 },
  ">": { r: 0, c: 1 },
  "v": { r: 1, c: 0 },
  "^": { r: -1, c: 0 }
} as const;

const isLocationInbounds = <T extends (typeof DirectionalKeyPad | typeof NumericKeyPad)>(location: Location, keypad: T) => location.r >= 0 && location.r < keypad.length
  && location.c >= 0 && location.c < keypad[0].length;

const isDirectionalArmLocationValid = (location: Location) => isLocationInbounds(location, DirectionalKeyPad)
  && !(location.r == 0 && location.c == 0);

const isNumericalArmLocationvalid = (location: Location) => isLocationInbounds(location, NumericKeyPad)
  && !(location.r == 3 && location.c == 0);

const isStateValid = (state: SystemState, target: string) => isDirectionalArmLocationValid(state.dirRobot1)
  && isDirectionalArmLocationValid(state.dirRobot2)
  && isNumericalArmLocationvalid(state.doorRobot)
  && target.startsWith(state.output)

const actions: DirectionalValues[] = ["^", "v", ">", "<", "A"] as const;
const getValidActions = (state: SystemState, target: string) => {
  return actions.map(a => applyMove(a, state, target)).filter((s) => s);
}

// take in a state and return a new state
const applyMove = (move: DirectionalValues, state: SystemState, target: string): SystemState => {
  const {
    dirRobot1: { r: r1r, c: r1c },
    dirRobot2: { r: r2r, c: r2c },
    doorRobot: { r: dr, c: dc }
  } = state;

  const newState = {
    dirRobot1: { r: r1r, c: r1c },
    dirRobot2: { r: r2r, c: r2c },
    doorRobot: { r: dr, c: dc },
    human: [...state.human, move],
    output: state.output
  } satisfies SystemState;
  // we only need to update the state of the first directional robot
  switch (move) {
    case "^":
    case "v":
    case ">":
    case "<": {

      const robot1Offset = DirectionMap[move];
      newState.dirRobot1 = { r: r1r + robot1Offset.r, c: r1c + robot1Offset.c };
      return isStateValid(newState, target) ? newState : null;
    }
    // this is where we update the state of the subsequent robots
    case "A": {
      const robot1Action = DirectionalKeyPad[r1r][r1c];
      switch (robot1Action) {
        case "^":
        case "v":
        case ">":
        case "<": {
          const robot2Offset = DirectionMap[robot1Action];
          newState.dirRobot2 = { r: r2r + robot2Offset.r, c: r2c + robot2Offset.c };
          return isStateValid(newState, target) ? newState : null;
        }
        case "A": {
          const robot2Action = DirectionalKeyPad[r2r][r2c];
          switch (robot2Action) {
            case "^":
            case "v":
            case ">":
            case "<": {
              const doorOffset = DirectionMap[robot2Action];
              newState.doorRobot = { r: dr + doorOffset.r, c: dc + doorOffset.c };
              return isStateValid(newState, target) ? newState : null;
            }
            case "A": {
              if (NumericKeyPad[dr][dc] === 'INVALID') return null;
              newState.output = `${state.output}${NumericKeyPad[dr][dc]}`
              return newState;
            }
            case "INVALID":
              return null;
            default:
              return null;
          }
        }
        case "INVALID":
          return null;
        default:
          return null;
      }
    }
    case "INVALID":
      return null;
  }
}

const getLocationHash = (location: Location) => `${location.r}.${location.c}`;

const getStateHash = (state: SystemState) => `${getLocationHash(state.dirRobot1)}/${getLocationHash(state.dirRobot2)}/${getLocationHash(state.doorRobot)}/${state.output}`
// we care about the output and the location of the robots 

const getComplexityScore = (output: string) => {
  const val = Number(output.substring(0, output.length - 1));
  return (sequence: DirectionalValues[]) => val * sequence.length;
}


const findShortestPath = (target: string) => {
  const queue: SystemState[] = [];
  const visited = new Set<string>();
  queue.push(initialState);

  while (queue.length > 0) {
    const curr = queue.shift();

    // if we have seen the current state before we can just continue
    if (visited.has(getStateHash(curr))) continue;
    visited.add(getStateHash(curr));

    // if we have the desired output we can return the state 
    if (curr.output === target) return curr;

    // if we have pressed an A in the target we can continue

    if (curr.output.endsWith('A')) continue;

    if (curr.output.length >= target.length) continue;

    // get nextStates
    const nextStates = getValidActions(curr, target);
    nextStates.map(n => queue.push(n));
  }
}

export default async function () {
  const val = input.map(i => {
    console.log("processing:", i);
    const state = findShortestPath(i);
    return getComplexityScore(i)(state.human);
  }).reduce((acc, i) => acc + i, 0);

  console.log(val);
}