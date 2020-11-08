export const defaultMiddleware = {
    $getFirstElement: (x: unknown[]): unknown => x[0],
    $identity: (x: unknown): unknown => x,
    $mergeObjects: (x: unknown[]): unknown => Object.assign({}, ...x),
    $override: (x: unknown, y: unknown): unknown => y != null ? y : x
}

export default defaultMiddleware