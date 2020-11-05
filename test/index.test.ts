import * as mod from "../src/index";
import { Mapper } from "../src/mapper";

describe("index.ts", () => {
    test("confirm exports", () => {
        expect(mod.Mapper).toBe(Mapper);
    });
});