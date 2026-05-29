const VARIANT_NAMES = { 10: 'Bullet', 30: 'Blitz', 90: 'Classical' };

export function variantName(rules) {
    return VARIANT_NAMES[rules?.roundTime] ?? 'Game';
}
