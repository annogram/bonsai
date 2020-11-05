import { MiddlewareExecutionError } from "../src/types";

describe("types.ts", () => {
    test("Middleware error can be thrown", () => {
        // arrange
        const err = new MiddlewareExecutionError("Something wrong in middlewear")
        // act
        expect(() => { throw err }).toThrowError("Something wrong in middlewear")
        // assert
    })
})