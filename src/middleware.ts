export const defaultMiddleware = {
    $getFirstElement: (x: unknown[]): unknown => x[0],
    $identity: (x: unknown): unknown => x,
    $mergeObjects: (x: unknown[]): unknown => Object.assign({}, ...x),
    
}

export default defaultMiddleware