import { Template, SourceObject, MappedObject, MiddleWare, MiddleWareTemplate, MiddlewareExecutionError } from "./types"
import * as R from "ramda"
import { query } from "jsonpath"

const mergeResults: (x: MappedObject, y: MappedObject) => MappedObject = R.mergeDeepWith((x, y) => Array.isArray(x) && Array.isArray(y) ? R.concat(x, y) : y)

const isPromise = (promise: unknown) => !!promise && promise instanceof Promise;

export class Mapper {
  private asyncResults: Array<{ key: string, subResult: Record<string, unknown> }> = [];

  constructor(private template: Template, private middleWare?: MiddleWare, private specialOperand: string = "$") { }

  /**
   * Map the data using the schema provided to this object. If multiple payloads are required with congruent
   * keys, then the parameters further down the list will override previously mapped keys. Arrays will be concatenated.
   * @param source Input data to be shaped into a new format
   */
  map(...source: SourceObject[]): MappedObject | Promise<MappedObject> {
    const results: MappedObject[] = source.map(() => ({}))

    source.forEach(async (v, i) => this.walk(v, this.template, results[i], ""))

    if (this.asyncResults.length > 0) {
      return Promise.all(this.asyncResults.map(async ({ key, subResult }) => {
        subResult[key] = await subResult[key]
      }))
        .then(() => this.asyncResults = [])
        .then(() => R.reduce(mergeResults, results[0], results.slice(1)))
    }

    return R.reduce(mergeResults, results[0], results.slice(1))
  }

  private mapSingleValue(source: SourceObject, path: string, result: MappedObject, key: string): void {
    if (path.indexOf('$') < 0) {
      result[key] = path
    }
    else {
      const values = query(source, path)
      if (values.length) {
        result[key] = values[0]
      }
    }
  }

  private mapArray(source: SourceObject, paths: Array<any>, result: MappedObject, key: string): void {  // eslint-disable-line
    const firstPath = paths[0]
    if (typeof (firstPath) === 'string') {
      const templatePairs: Array<[string, unknown]> = paths.reduce((acc, _, i, arr) => {
        if (i % 2 === 0)
          acc.push(arr.slice(i, i + 2))
        return acc
      }, [])
      let shiftBy = 0
      const array = result[key] = []
      for (const [path, template] of templatePairs) {
        const values = query(source, path)
        if (values.length && template) {
          if (values.length === 1 && this.type(values[0]) === "array") {
            values[0].forEach((item: unknown, index: number) => this.walk(item, template, array, index + shiftBy))
            shiftBy += values[0].length
          }
          else {
            values.forEach((item: unknown, index: number) => this.walk(item, template, array, index + shiftBy))
            shiftBy += values.length
          }
        } else {
          result[key] = values
        }
      }
    } else {
      const array = result[key] = []
      paths.forEach((item: unknown, index: number) => this.walk(source, item, array, index))
    }
  }

  private mapObject(source: SourceObject, template: Template, result: MappedObject, key: string): void {
    let o = result
    if (key !== "") {
      o = result[key] = {}
    }
    Object.keys(template).forEach(name => this.walk(source, template[name], o, name))
  }

  private applyMiddleWare(source: SourceObject, template: MiddleWareTemplate, result: MappedObject, key: string): void {
    if (this.middleWare) {
      for (const fn in template) {
        if (Object.prototype.hasOwnProperty.call(template, fn) && fn !== "literal") {
          const data = template[fn]
          try {
            if (!template.literal) {
              const values: Record<string, unknown> = {}
              this.walk(source, data, values, key)
              result[key] = this.middleWare[fn](values[key], false)
            } else {
              result[key] = this.middleWare[fn](data, template.literal)
            }
            if (isPromise(result[key])) this.asyncResults.push({ key, subResult: result })
          } catch (error) {
            throw new MiddlewareExecutionError("Middleware execution failed for key: " + key
              + "\nFor the function: " + fn
              + "\nInner Error: " + error)
          }
        }
      }
    } else {
      throw new MiddlewareExecutionError("No middleware supplied to the mapper")
    }
  }

  private walk(source: any, path: any, result: any, key: any): void {
    const type = this.type(path)
    if (this.type(key) === "string" && key.indexOf('$') == 0 && key.indexOf('.') == 1) {
      key = query(source, key)
    }
    switch (type) {
      case "string": {
        this.mapSingleValue(source, path as string, result, key)
        break
      }
      case "array": {
        this.mapArray(source, path as Array<any>, result, key)
        break
      }
      case "object": {
        this.mapObject(source, path as Template, result, key)
        break
      }
      case "middleware": {
        this.applyMiddleWare(source, path as MiddleWareTemplate, result, key)
        break
      }
      case "boolean":
      case "number": {
        result[key] = path
        break
      }
      default: {
        throw new Error("Unsupported type: " + type)
      }
    }
  }

  private type(value: any): string { // eslint-disable-line
    const precheck = Array.isArray(value) ? "array" : typeof value
    if (precheck === "object") {
      const objectKeys = Object.keys(value)
      // Check that there is middleware and that the key format is correct
      if (this.middleWare && objectKeys.some(v => v[0] === this.specialOperand)) {
        // check there actually is a middleware
        if (objectKeys.some(s => Object.keys(this.middleWare!).includes(s))) {
          return "middleware"
        } else {
          return precheck
        }
      } else {
        return precheck
      }
    } else {
      return precheck
    }
  }
}
