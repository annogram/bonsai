import * as R from "ramda"

export const defaultMiddleware = {
    $getFirstElement: (x: unknown[]): unknown => x[0],
    $identity: (x: unknown): unknown => x,
    $mergeObjects: (x: unknown[]): unknown => Object.assign({}, ...x),
    $override: ({ x, y }: { x: unknown, y: unknown }): unknown => y != null ? y : x,
    $unique: R.uniq,
    $union: ({ x, y }: { x: unknown[], y: unknown[] }): unknown[] => R.union(x, y),
    $intersection: ({ x, y }: { x: unknown[], y: unknown[] }): unknown[] => R.intersection(x, y),
    $some: ({ x, arr }: { x: unknown, arr: unknown[] }): boolean => arr.some((y => y === x)),
    $every: ({ x, arr }: { x: unknown, arr: unknown[] }): boolean => arr.every(y => y === x)
}

export default defaultMiddleware