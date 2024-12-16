import { dequeue, enqueue, getMoveCost, getNeighbours, Location, PriorityQueue } from "../day16/solution";

describe('test getMoveCost', () => {
    test("down down", () => {
        for (let i = -10; i < 10; i++) {
            for (let j = -10; j < 10; j++) {
                const [cost, dir] = getMoveCost("down", [i, j], [i + 1, j]);
                expect(cost).toBe(1);
                expect(dir).toBe("down");
            }
        }
    });
    test("down right", () => {
        const [cost, dir] = getMoveCost("down", [0, 0], [0, 1]);
        expect(cost).toBe(1001);
        expect(dir).toBe("right");
    });
    test("down left", () => {
        const [cost, dir] = getMoveCost("down", [0, 0], [0, -1]);
        expect(cost).toBe(1001);
        expect(dir).toBe("left");
    });
    test("down up", () => {
        const [cost, dir] = getMoveCost("down", [0, 0], [-1, 0]);
        expect(cost).toBe(2001);
        expect(dir).toBe("up");
    });

    test("up down", () => {
        const [cost, dir] = getMoveCost("up", [0, 0], [1, 0]);
        expect(cost).toBe(2001);
        expect(dir).toBe("down");
    });
    test("up right", () => {
        const [cost, dir] = getMoveCost("up", [0, 0], [0, 1]);
        expect(cost).toBe(1001);
        expect(dir).toBe("right");
    });
    test("up left", () => {
        const [cost, dir] = getMoveCost("up", [0, 0], [0, -1]);
        expect(cost).toBe(1001);
        expect(dir).toBe("left");
    });
    test("up up", () => {
        const [cost, dir] = getMoveCost("up", [0, 0], [-1, 0]);
        expect(cost).toBe(1);
        expect(dir).toBe("up");
    });

    test("left down", () => {
        const [cost, dir] = getMoveCost("left", [0, 0], [1, 0]);
        expect(cost).toBe(1001);
        expect(dir).toBe("down");
    });
    test("left right", () => {
        const [cost, dir] = getMoveCost("left", [0, 0], [0, 1]);
        expect(cost).toBe(2001);
        expect(dir).toBe("right");
    });
    test("left left", () => {
        const [cost, dir] = getMoveCost("left", [0, 0], [0, -1]);
        expect(cost).toBe(1);
        expect(dir).toBe("left");
    });
    test("left up", () => {
        const [cost, dir] = getMoveCost("left", [0, 0], [-1, 0]);
        expect(cost).toBe(1001);
        expect(dir).toBe("up");
    });

    test("right down", () => {
        const [cost, dir] = getMoveCost("right", [0, 0], [1, 0]);
        expect(cost).toBe(1001);
        expect(dir).toBe("down");
    });
    test("right right", () => {
        const [cost, dir] = getMoveCost("right", [0, 0], [0, 1]);
        expect(cost).toBe(1);
        expect(dir).toBe("right");
    });
    test("right left", () => {
        const [cost, dir] = getMoveCost("right", [0, 0], [0, -1]);
        expect(cost).toBe(2001);
        expect(dir).toBe("left");
    });
    test("right up", () => {
        const [cost, dir] = getMoveCost("right", [0, 0], [-1, 0]);
        expect(cost).toBe(1001);
        expect(dir).toBe("up");
    });
})

describe("get neighbours", () => {
    test("not empty", () => {
        const cells = [[0, 1], [1, 1], [2, 3], [4, 4], [4, 5], [3, 4]] satisfies Location[];
        const start = [4, 4] satisfies Location;
        const neighbours = getNeighbours(start, cells);
        expect(neighbours.length).toEqual(2);
        expect(neighbours.find(([r, c]) => r === 3 && c === 4)).not.toBeNull();
        expect(neighbours.find(([r, c]) => r === 4 && c === 5)).not.toBeNull();
    });

    test("not empty", () => {
        const cells = [[0, 1], [1, 1], [2, 3], [4, 4], [4, 5], [3, 4]] satisfies Location[];
        const start = [2, 3] satisfies Location;
        const neighbours = getNeighbours(start, cells);
        expect(neighbours.length).toEqual(0);
    });
})

describe("test priority queue", () => {
    test("create pq", () => {
        const pq: PriorityQueue = [];
        expect(pq).not.toBeNull();
    });

    test("enqueue pq", () => {
        const pq: PriorityQueue = [];
        const dir = 'left';
        const loc = [0, 0] satisfies Location;
        const val = 1;
        enqueue([[loc, dir], val], pq);
        expect(pq.length).toEqual(1);
    });

    test("dequeue pq", () => {
        const pq: PriorityQueue = [];
        const dir = 'left';
        const loc = [0, 0] satisfies Location;
        const val = 1;
        enqueue([[loc, dir], val], pq);
        const el = dequeue(pq);
        expect(pq.length).toEqual(0);
        expect(el).not.toBeFalsy();
        expect(el[0][1]).toEqual('left');
    });

    test("dequeue pq", () => {
        const pq: PriorityQueue = [];

        enqueue([[[0, 1], 'left'], 0], pq);
        enqueue([[[0, 1], 'up'], 1], pq);
        enqueue([[[0, 1], 'down'], -1], pq);
        enqueue([[[0, 1], 'right'], 2], pq);

        let el = dequeue(pq);
        expect(pq.length).toEqual(3);
        expect(el[0][1]).toEqual('down');

        el = dequeue(pq);
        expect(pq.length).toEqual(2);
        expect(el[0][1]).toEqual('left');

        el = dequeue(pq);
        expect(pq.length).toEqual(1);
        expect(el[0][1]).toEqual('up');

        el = dequeue(pq);
        expect(pq.length).toEqual(0);
        expect(el[0][1]).toEqual('right');
    });
})