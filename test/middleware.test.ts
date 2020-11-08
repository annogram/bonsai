import defaultMiddleware from "../src/middleware";
import { Mapper } from "../src/index";

describe("middleware.ts", () => {
    test("default middleware used with mapper correctly", () => {
        // arrange
        const customMiddleware = {
            "$write5Ones": () => 11111
        }
        const template = {
            "name": { $override: { x: "$.bar", y: "$.info.name" } },
            "type": {
                complexInnerType: "$.innerType",
                innerName: { $write5Ones: null, literal: true }
            }
        }
        const source = {
            bar: "ANAME",
            innerType: true,
            info: {
                name: "Tony"
            }
        }

        const expectedValue = {
            name: "Tony",
            type: {
                complexInnerType: true,
                innerName: 11111
            }
        }

        // act
        const mapper = new Mapper(template, {
            ...defaultMiddleware,
            ...customMiddleware
        })
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })
})