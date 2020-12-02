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

    test("test getFirstElement", () => {
        // arrange
        const template = {
            firstValue: { $getFirstElement: "$..allValues" }
        }
        const source = {
            foo: { data: { allValues: [100, 2, 12, 3] } }
        }
        const expectedValue = {
            firstValue: 100
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("test mergeObjects", () => {
        // arrange
        const template = {
            mergedObjects: { $mergeObjects: "$.foo" }
        }
        const source = {
            foo: [
                {
                    value: "cheese"
                },
                {
                    number: 1
                },
                {
                    deeper: {
                        hello: "world"
                    }
                }
            ]
        }
        const expectedValue = {
            mergedObjects: {
                value: "cheese",
                number: 1,
                deeper: {
                    hello: "world"
                }
            }
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("unique", () => {
        // arrange
        const expectedValue = { onlyOne: [1, 2, 4, 5, 7, 8] }
        const template = {
            onlyOne: { $unique: "$.foo" }
        }
        const source = {
            foo: [1, 1, 2, 4, 4, 4, 4, 4, 5, 7, 8, 8,]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("intersection", () => {
        // arrange
        const expectedValue = { both: ["apple", "orange", "pizza"] }
        const template = {
            both: { $intersection: { x: "$.daisy", y: "$.paul" } }
        }
        const source = {
            daisy: [
                "apple",
                "pineapple",
                "plumb",
                "orange",
                "pizza",
                "grapes"
            ],
            paul: [
                "kiwi",
                "orange",
                "apricot",
                "apple",
                "banana",
                "pizza"
            ]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("union", () => {
        // arrange
        const expectedValue = {
            combined: [
                "apple",
                "pineapple",
                "plumb",
                "orange",
                "pizza",
                "grapes",
                "kiwi",
                "apricot",
                "banana"
            ]
        }
        const template = {
            combined: { $union: { x: "$.daisy", y: "$.paul" } }
        }
        const source = {
            daisy: [
                "apple",
                "pineapple",
                "plumb",
                "orange",
                "pizza",
                "grapes"
            ],
            paul: [
                "kiwi",
                "orange",
                "apricot",
                "apple",
                "banana",
                "pizza"
            ]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("some", () => {
        // arrange
        const expectedValue = { valid: true }
        const template = { valid: { $some: { x: "beans", arr: "$.items" } } }
        const source = {
            items: [
                "cheese",
                "chicken",
                "water",
                "beans"
            ]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("every", () => {
        // arrange
        const expectedValue = { totalSuccess: true }
        const template = {
            totalSuccess: { $every: { x: "passed", arr: ["$..passed"] } }
        }
        const source = {
            processed: [
                { item: 1, duration: 19.2, passed: "passed" },
                { item: 2, duration: 31, passed: "passed" },
                { item: 3, duration: 104, passed: "passed" },
                { item: 4, duration: 12, passed: "passed" },
                { item: 5, duration: 4, passed: "passed" },
            ]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

    test("every with failure", () => {
        // arrange
        const expectedValue = { totalSuccess: false }
        const template = {
            totalSuccess: { $every: { x: "passed", arr: ["$..passed"] } }
        }
        const source = {
            processed: [
                { item: 1, duration: 19.2, passed: "passed" },
                { item: 2, duration: 31, passed: "passed" },
                { item: 3, duration: 104, passed: "failed" },
                { item: 4, duration: 12, passed: "passed" },
                { item: 5, duration: 4, passed: "passed" },
            ]
        }
        // act
        const mapper = new Mapper(template, defaultMiddleware)
        const actualValue = mapper.map(source)
        // assert
        expect(actualValue).toEqual(expectedValue)
    })

})