const FACE_VALUE = { A: 6, K: 5, Q: 4, J: 3, 8: 2, 7: 1 };

const HAND_RULES = [
    { name: "Repóker", rank: 7,
        matches: ({ counts }) => counts[0] === 5,
        tiebreaker: ({ uniqueValues }) => [uniqueValues[0]] },
    { name: "Póker", rank: 6,
        matches: ({ counts }) => counts[0] === 4,
        tiebreaker: ({ freq, uniqueValues }) => [uniqueValues.find(v => freq[v] === 4), uniqueValues.find(v => freq[v] === 1)] },
    { name: "Full House", rank: 5,
        matches: ({ counts }) => counts[0] === 3 && counts[1] === 2,
        tiebreaker: ({ freq, uniqueValues }) => [uniqueValues.find(v => freq[v] === 3), uniqueValues.find(v => freq[v] === 2)] },
    { name: "Straight", rank: 4,
        matches: ({ isStraight }) => isStraight,
        tiebreaker: ({ uniqueValues }) => [uniqueValues[0]] },
    { name: "Trío", rank: 3,
        matches: ({ counts }) => counts[0] === 3,
        tiebreaker: ({ freq, uniqueValues }) => [uniqueValues.find(v => freq[v] === 3), ...uniqueValues.filter(v => freq[v] === 1)] },
    { name: "Doble Pareja", rank: 2,
        matches: ({ counts }) => counts[0] === 2 && counts[1] === 2,
        tiebreaker: ({ freq, uniqueValues }) => [...uniqueValues.filter(v => freq[v] === 2), uniqueValues.find(v => freq[v] === 1)] },
    { name: "Pareja", rank: 1,
        matches: ({ counts }) => counts[0] === 2,
        tiebreaker: ({ freq, uniqueValues }) => [uniqueValues.find(v => freq[v] === 2), ...uniqueValues.filter(v => freq[v] === 1)] },
    { name: "Carta Alta", rank: 0,
        matches: () => true,
        tiebreaker: ({ uniqueValues }) => [...uniqueValues] }
];

export function evaluateHand(faces, includeStraight = false) {
    const values = faces.map(f => FACE_VALUE[f]);
    const sorted = values.slice().sort((a, b) => a - b);
    const freq = {};
    for (const v of sorted) freq[v] = (freq[v] || 0) + 1;
    const counts = Object.values(freq).sort((a, b) => b - a);
    const uniqueValues = Object.keys(freq).map(Number).sort((a, b) => b - a);
    const isStraight = includeStraight && sorted.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
    const context = { sorted, freq, counts, uniqueValues, isStraight };
    const rule = HAND_RULES.find(r => r.matches(context));
    return { faces, values: sorted, rank: rule.rank, name: rule.name, tiebreaker: rule.tiebreaker(context) };
}

export function compareHands(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    for (let i = 0; i < a.tiebreaker.length; i++) {
        if (a.tiebreaker[i] !== b.tiebreaker[i]) return a.tiebreaker[i] - b.tiebreaker[i];
    }
    return 0;
}

export function decideRound(players, includeStraight = false) {
    const hands = players.map(p => ({ userId: p.userId, ...evaluateHand(p.faces, includeStraight) }));
    let best = hands[0];
    for (const h of hands) if (compareHands(h, best) > 0) best = h;
    const winnerIds = hands.filter(h => compareHands(h, best) === 0).map(h => h.userId);
    return { hands, winnerIds };
}

export default { evaluateHand, compareHands, decideRound };
