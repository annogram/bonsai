export type Template = Record<string, unknown>;
export type SourceObject = Record<string, unknown>;
export type MappedObject = Record<string, unknown>;
export type MiddleWare = Record<string, (data: any, query: boolean) => unknown> //eslint-disable-line
/**
 * Middleware template is the data type of the middleware format passed into the template string
 * This will determine what middleware function to apply to the mapper. 
 * The query field indicates weather the data passed in is a query in the source file or a literal value
 * for the middleware to use
 */
export type MiddleWareTemplate = {
  [key: string]: string
} & {
  literal?: boolean
}

export class MiddlewareExecutionError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = MiddlewareExecutionError.name; // stack traces display correctly now 
  }
}