import { describe, test, expect } from "@jest/globals";
import { promisify } from "util";
import { Mapper } from "../src/mapper";
import defaultMiddleware from "../src/middleware";

describe("mapper.ts", () => {
  test("mapSingleValue via JSONPath", () => {
    const mapper = new Mapper({
      "name": "$.foo"
    });

    expect(mapper.map({ foo: "ANAME" }, { foo: "BNAME" })).toEqual({ name: "BNAME" });
  });

  test("mapSingleValue - literal value", () => {
    const mapper = new Mapper({
      "name": "fred"
    });

    expect(mapper.map({ foo: "ANAME" })).toEqual({ name: "fred" });
  });

  test("mapArray - fetch array", () => {
    const mapper = new Mapper({
      "name": "$.foo"
    });

    expect(mapper.map({ foo: ["ANAME", "BNAME"] }, { foo: ["CNAME", "DNAME"] })).toEqual({ name: ["ANAME", "BNAME", "CNAME", "DNAME"] });
  });

  test("mapArray - fetch nested properties", () => {
    const mapper = new Mapper({
      "name": ["$..name"]
    });

    expect(mapper.map({ foo: { name: "ANAME" }, bar: { name: "BNAME" } })).toEqual({ name: ["ANAME", "BNAME"] });
  });

  test("mapArray - array of objects via nested template", () => {
    const mapper = new Mapper({
      "names": ["$.foo.names", { givenName: "$.givenName", familyName: "$.surname" }]
    });

    const source = {
      foo: {
        names: [
          {
            givenName: "Fred",
            surname: "Flintstone"
          },
          {
            givenName: "Wilma",
            surname: "Flintstone"
          },
          {
            givenName: "Barney",
            surname: "Rubble"
          }
        ]
      }
    };

    expect(mapper.map(source)).toEqual({
      names: [
        {
          givenName: "Fred",
          familyName: "Flintstone"
        },
        {
          givenName: "Wilma",
          familyName: "Flintstone"
        },
        {
          givenName: "Barney",
          familyName: "Rubble"
        }
      ]
    });
  });

  test("mapArray - array of objects with no subMapping", () => {
    // arrange
    const mapper = new Mapper({
      "names": [{ givenName: "$.foo.names[:1].givenName", familyName: "$.foo.names[:1].surname" }]
    });

    const source = {
      foo: {
        names: [
          {
            givenName: "Fred",
            surname: "Flintstone"
          },
          {
            givenName: "Wilma",
            surname: "Flintstone"
          },
          {
            givenName: "Barney",
            surname: "Rubble"
          }
        ]
      }
    };

    //act
    const actualValue = mapper.map(source);

    // assert
    expect(actualValue).toEqual({
      names: [
        {
          givenName: "Fred",
          familyName: "Flintstone"
        }
      ]
    });
  })

  test("mapArray - Iterative subMapping", () => {
    // arrange
    const mapper = new Mapper({
      "names": [
        "$.foo.names",
        { givenName: "$.givenName", familyName: "$.surname" },
        "$.some.other.source",
        { givenName: "$.firstName", familyName: "$.lastName" }
      ]
    });

    const source = {
      foo: {
        names: [
          {
            givenName: "Fred",
            surname: "Flintstone"
          },
          {
            givenName: "Wilma",
            surname: "Flintstone"
          },
          {
            givenName: "Barney",
            surname: "Rubble"
          }
        ]
      },
      some: {
        other: {
          source: [
            {
              firstName: "Mister",
              lastName: "PeanutButter"
            },
            {
              firstName: "Princess",
              lastName: "Carolyn"
            },
            {
              firstName: "Bojack",
              lastName: "Horseman"
            }
          ]
        }
      }
    };
    // act
    const actualValue = mapper.map(source);
    // assert
    expect(actualValue).toEqual({
      names: [
        {
          givenName: "Fred",
          familyName: "Flintstone"
        },
        {
          givenName: "Wilma",
          familyName: "Flintstone"
        },
        {
          givenName: "Barney",
          familyName: "Rubble"
        },
        {
          givenName: "Mister",
          familyName: "PeanutButter"
        },
        {
          givenName: "Princess",
          familyName: "Carolyn"
        },
        {
          givenName: "Bojack",
          familyName: "Horseman"
        }
      ]
    });
  })


  test("mapSingleValue via JSONPath - not matching values", () => {
    const mapper = new Mapper({
      "name": "$.foo"
    });

    expect(mapper.map({ bar: "ANAME" })).toEqual({ name: undefined });
  });

  test("mapArray - array of objects via nested template $.. JSONPATH", () => {
    const mapper = new Mapper({
      "names": ["$..name", { givenName: "$.givenName", familyName: "$.surname" }]
    });

    const source = {
      foo: {
        name: {
          givenName: "Fred",
          surname: "Flintstone"
        }
      },
      bar: {
        name: {
          givenName: "Wilma",
          surname: "Flintstone"
        }
      },
      aaa: {
        name: {
          givenName: "Barney",
          surname: "Rubble"
        }
      }
    };

    expect(mapper.map(source)).toEqual({
      names: [
        {
          givenName: "Fred",
          familyName: "Flintstone"
        },
        {
          givenName: "Wilma",
          familyName: "Flintstone"
        },
        {
          givenName: "Barney",
          familyName: "Rubble"
        }
      ]
    });
  });

  test("applyMiddleWare - Applies a function on a data element before writing", () => {
    // arrange
    const mapper = new Mapper({
      "name": "$.bar",
      "type": { $identity: "TEST_NAME" }
    }, { "$identity": (s, q) => !q ? s : undefined });
    const source = { bar: "ANAME" }
    // act
    const actualValue = mapper.map(source)
    // assert
    expect(actualValue).toEqual({ name: "ANAME", type: "TEST_NAME" });
  })

  test("applyMiddleWare - Applies a function on a data element query before writing", () => {
    // arrange
    const mapper = new Mapper({
      "name": "$.bar",
      "password": "$.foo",
      "protectedPassword": { $protect: "$.foo" },
    }, {
      "$protect": (s) => {
        let i = s.length
        let out = ""
        while (i--) {
          out += '*'
        }
        return out
      }
    });

    const source = { bar: "ANAME", foo: "ManagementL1amaWonderC@t" }
    // act
    const actualValue = mapper.map(source)
    // assert
    expect(actualValue).toEqual({
      name: "ANAME",
      protectedPassword: "************************",
      password: "ManagementL1amaWonderC@t"
    });
  })

  test("applyMiddleWare - passes through named key when no middleware supplied", () => {
    // arrange
    const mapper = new Mapper({
      "name": "$.bar",
      "type": { $identity: "TEST_NAME", literal: false }
    });
    const source = { bar: "ANAME" }
    // act
    const actualValue = mapper.map(source);
    // assert
    expect(actualValue).toEqual({
      name: "ANAME",
      type: {
        $identity: "TEST_NAME", literal: false // this is optional
      }
    })
  })

  test("applyMiddleWare - passes through named key when specific middleware not supplied", () => {
    // arrange
    const mapper = new Mapper({
      "name": "$.bar",
      "type": { $ego: "TEST_NAME", literal: true }
    }, { "$identity": (s, q) => !q ? s : undefined });
    const source = { bar: "ANAME" }
    // act
    const actualValue = mapper.map(source);
    // assert
    expect(actualValue).toEqual({
      name: "ANAME",
      type: { $ego: "TEST_NAME", literal: true }
    })
  })

  test("applyMiddleWare - Applies a function on a deep object before writing", () => {
    // arrange
    const mapper = new Mapper(
      {
        "name": "$.bar",
        "type": {
          complexInnerType: "$.innerType",
          innerName: { $identity: "TEST_NAME", literal: true }
        }
      },
      { "$identity": (s, q) => q ? s : undefined });
    const source = { bar: "ANAME", innerType: true }
    // act
    const actualValue = mapper.map(source)
    // assert
    expect(actualValue).toEqual({
      name: "ANAME", type: {
        complexInnerType: true,
        innerName: "TEST_NAME"
      }
    });
  })

  test("applyMiddleWare - Applies a function on data elements in array before writing", () => {
    // arrange
    let count = 0
    const mapper = new Mapper(
      {
        "names": ["$..name", { givenName: "$.givenName", familyName: "$.surname", nameNo: { $count: null, literal: true } }]
      },
      { $count: () => ++count }
    );

    const source = {
      foo: {
        name: {
          givenName: "Fred",
          surname: "Flintstone"
        }
      },
      bar: {
        name: {
          givenName: "Wilma",
          surname: "Flintstone"
        }
      },
      aaa: {
        name: {
          givenName: "Barney",
          surname: "Rubble"
        }
      }
    };

    // act /assert
    expect(mapper.map(source)).toEqual({
      names: [
        {
          givenName: "Fred",
          familyName: "Flintstone",
          nameNo: 1
        },
        {
          givenName: "Wilma",
          familyName: "Flintstone",
          nameNo: 2
        },
        {
          givenName: "Barney",
          familyName: "Rubble",
          nameNo: 3
        }
      ]
    });
  })

  test("applyMiddleware - Operates on an entire mapped array", () => {
    // arrange
    const mapper = new Mapper(
      {
        "names": { $orderByName: ["$..name", { givenName: "$.givenName", familyName: "$.surname" }] }
      },
      {
        $orderByName: (s: Array<any>) => s.sort((a, b) =>
          a.givenName.localeCompare(b.givenName))
      }
    )

    const source = {
      foo: {
        name: {
          givenName: "Fred",
          surname: "Flintstone"
        }
      },
      bar: {
        name: {
          givenName: "Wilma",
          surname: "Flintstone"
        }
      },
      aaa: {
        name: {
          givenName: "Barney",
          surname: "Rubble"
        }
      }
    };

    const expectedValue = {
      names: [
        {
          givenName: "Barney",
          familyName: "Rubble"
        },
        {
          givenName: "Fred",
          familyName: "Flintstone",
        },
        {
          givenName: "Wilma",
          familyName: "Flintstone",
        }
      ]
    }
    // act
    const actualValue = mapper.map(source)
    // assert
    expect(actualValue).toEqual(expectedValue)
  })


  test("Asynchronous middleware", async () => {
    const promisedTimeout = promisify(setTimeout)
    // arrange
    const customMiddleware = {
      "$write5Ones": async () => {
        await promisedTimeout(1000)
        return 11111
      }
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
    const actualValue = await mapper.map(source)
    // assert
    expect(actualValue).toEqual(expectedValue)
  })

  test("dynamic keys", () => {
    // arrange
    const mapper = new Mapper({
      people: [
        "$..names",
        {
          "$.givenName": "$.surname"
        }
      ]
    })

    const source = {
      foo: {
        names: [
          {
            givenName: "Fred",
            surname: "Flintstone"
          },
          {
            givenName: "Wilma",
            surname: "Flintstone"
          },
          {
            givenName: "Barney",
            surname: "Rubble"
          }
        ]
      }
    };
    // act
    const actualValue = mapper.map(source);
    // assert
    expect(actualValue).toEqual({
      people: [
        {
          Fred: "Flintstone"
        },
        {
          Wilma: "Flintstone"
        },
        {
          Barney: "Rubble"
        }
      ]
    })
  })
});