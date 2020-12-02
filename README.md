# Bonsai

Ever had an integration project with constantly changing data structures? Connecting to public api and want to transform the payload to fit your requirements? Bonsai might be the right choice for you. 

With Bonsai you can perform powerful transformations on bulk payloads with little to no code changes using the powerful JSONPath library to query for fields from your source payload and shape them into the data structures you desire. With a easy to use middleware layer you can even do database look ups, further api calls and extremely complicated logic based on the data that is in your source payloads.

## Overview
This library provides a means to map a JSON document to another JSON document using JSONPath and a template defined as JSON document.  

## JSONPath 
The JSONPath evaluation is implemented by the Node library [jsonpath](https://www.npmjs.com/package/jsonpath). Please refer to the documentation of this library for all supported JSONPath expressions.

Here are syntax and examples adapted from [Stefan Goessner's original post](http://goessner.net/articles/JsonPath/) introducing JSONPath in 2007.

JSONPath         | Description
-----------------|------------
`$`               | The root object/element
`@`                | The current object/element
`.`                | Child member operator
`..`	         | Recursive descendant operator; JSONPath borrows this syntax from E4X
`*`	         | Wildcard matching all objects/elements regardless their names
`[]`	         | Subscript operator
`[,]`	         | Union operator for alternate names or array indices as a set
`[start:end:step]` | Array slice operator borrowed from ES4 / Python
`?()`              | Applies a filter (script) expression via static evaluation
`()`	         | Script expression via static evaluation 

Given this sample data set, see example expressions below:

```javascript
{
  "store": {
    "book": [ 
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      }, {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      }, {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      }, {
         "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}
```

Example JSONPath expressions:

JSONPath                      | Description
------------------------------|------------
`$.store.book[*].author`       | The authors of all books in the store
`$..author`                     | All authors
`$.store.*`                    | All things in store, which are some books and a red bicycle
`$.store..price`                | The price of everything in the store
`$..book[2]`                    | The third book
`$..book[(@.length-1)]`         | The last book via script subscript
`$..book[-1:]`                  | The last book via slice
`$..book[0,1]`                  | The first two books via subscript union
`$..book[:2]`                  | The first two books via subscript array slice
`$..book[?(@.isbn)]`            | Filter all books with isbn number
`$..book[?(@.price<10)]`        | Filter all books cheaper than 10
`$..book[?(@.price==8.95)]`        | Filter all books that cost 8.95
`$..book[?(@.price<30 && @.category=="fiction")]`        | Filter all fiction books cheaper than 30
`$..*`                         | All members of JSON structure

## Template
The template document is defined as JSON document itself.

## Inspiration
This implementation is modelled on that provided by [jsonpath-object-transform](https://www.npmjs.com/package/jsonpath-object-transform).  The latest version was published more than 5 years ago.

## Usage
```typescript
import { Mapper } from "bonasi-json";

const template = {
    name: "$.foo.name",
    values: [ "$..foo.items.values" ],
    products: [
        "$.foo.products", 
        {
            sku: "$.id",
            description: "$.info.description",
            price: "$.unitPrice"
        }
    ]
}

const mapper = new Mapper( template );

// load source document
// {
//     "foo": {
//         "name": "Company Holdings Ltd.",
//         "items": {
//             "values": [
//                 "bandana",
//                 "soleless shoes",
//                 "rugsack"
//             ]
//         },
//         "products": [
//             {
//                 "Id": 0001,
//                 "info": {
//                     "description": "bandana",
//                 },
//                 "unitPrice": 12.00
//             },
//             {
//                 "Id": 0002,
//                 "info": {
//                     "description": "soleless shoes",
//                 },
//                 "unitPrice": 120.00
//             },
//             {
//                 "Id": 0003,
//                 "info": {
//                     "description": "rugsack",
//                 },
//                 "unitPrice": 200.00
//             }
//         ]
//     }
// }
const source = ....
const mappedObject = mapper.map( source );

// Output
// {
//     "name": "Company Holdings Ltd.",
//     "values": [
//         "bandana",
//         "soleless shoes",
//         "rugsack"
//     ],
//     "products": [
//         {
//             "sku": 0001,
//             "description": "bandana",
//             "price": 12.00
//         },
//         {
//             "sku": 0001,
//             "description": "soleless shoes",
//             "price": 120.00
//         },
//         {
//             "sku": 0001,
//             "description": "rugsack",
//             "price": 200.00
//         }
//     ]
// }
```

## Template Example: Fetching single property.
```typescript
{
    propertyName: "$.path.to.field.with.value.in.source"
}
```

## Template Example: Fetching an array.
```typescript
{
    propertyName: [ "$.path.to.array.field.in.source" ]
}
```

## Template Example: Populating array of values a given field in array of objects.
```typescript
{
    propertyName: [ "$..path.to.field.in.object.in.source.array" ]
}
```

## Template Example: Transforming array of objects in source.
```typescript
{
    propertyName: [ 
        "$.path.to.field.with.array.of.objects", 
        {
            propertName: "$.item.field"
        } 
    ]
}
```

## Template Example: Creating a target array manually.

```typescript
{
    {
        "names": [{ 
            givenName: "$.foo.names[:1].givenName", 
            familyName: "$.foo.names[:1].surname" 
        }]
    }
}
```

## Template Example: Transforming array of objects in source from multiple destinations.

> Note that if this must be done in string object pairs as shown. Breaking the pattern below will cause runtime errors

```typescript
{
    "names": [
        "$.foo.names",
        { givenName: "$.givenName", familyName: "$.surname" },
        "$.some.other.source",
        { givenName: "$.firstName", familyName: "$.lastName" }
    ]
}

```

## Template Example: Merge multiple sources

When you have multiple data payloads and want to merge overwriting any information from right to left you can do this by passing multiple entries into the `map` function

```typescript
import { Mapper } from "bonasi-json";

const template = {
    name: "$.foo.name",
    values: [ "$..foo.items.values" ],
    products: [
        "$.foo.products", 
        {
            sku: "$.id",
            description: "$.info.description",
            price: "$.unitPrice"
        }
    ]
}

const mapper = new Mapper( template );

const source = ....
const source1 = ....

const mappedObject = mapper.map( source, source1 );

```

Any properties in _source_ that differ from _source1_ will be overridden. Arrays will be concatenated.

# Using middleware

Middleware are custom functions passed in by the caller to perform arbitrary functionality on a property before mapping it to the destination

You may define by passing in a Record of them into the mappers constructor.

## Mapping with middleware

```typescript
const mapper = new Mapper(...template, 
        { 
            "$identity": (s, q) => q ? s : undefined,
            "$lookup": lookup,
            "$instanceExample" : this.someFunction
            ...
        }
    );
```

## Writing middleware functions

Middleware functions are operations that operate on some input on the template and provide an output that will be used for the template. The type of a middleware function is:

```typescript
(data: any, literal?: boolean) => unknown
```

The `data` parameter is a value that is defined in the template. The `literal` parameter is an optional flag which denotes that the data is JSONpath query not a type to act on directly. This is returned by convenience so you can know if the data being passed to your functions is literal or not as defined by the template.

if you want to pass more than one value into your function you will need to make the signature something like this:

```typescript
$intersection: ({ x, y }: { x: unknown[], y: unknown[] }): unknown[] => ...
```

Then when your template will look something like this:

```json
{
    "both": {
        "$intersection": {
            "x": "$.daisy",
            "y": "$.paul"
            }
    }
}

```

### Non-query example

Say you have a type with a static property in your _target_ mapping but the field doesn't exist in your _source_ mapping. A way to solve this problem would be to use middleware like so

```typescript
const mapper = new Mapper(...template, 
        { 
            "$identity": (s, q) => q ? s : undefined
        }
    );
```

This middleware function simply returns whatever value is passed into it without looking up the value in the source. If the query flag is true then this identity function will return a JSONpath which is useless therefore we return undefined in that case.

The template might look something like this:

```json
{
    "name": "$.bar",
    "type": { "$identity": "TEST_NAME", "literal": true }
}
```

and the payload might look like this:

```json
{ "bar": "ANAME" }
```

This indicates that we want to pass the string `TEST_NAME` literally into the type field. The result will be:

> Note that the any string that does not begin with a `$` is not attempted to be resolved. The literal exists for valid situations where the strings which are passed through the template begin with a `$` and you **DO NOT** want bonsai to evaluate it.

```json
{ "name": "ANAME", "type": "TEST_NAME" }
```

### Query example

When you want to act on data in the _source_ payload before writing it to the _target_ you will use a query middleware function. These functions will perform a JSONPath query before passing it to your middleware so you can operate on the source data.

Your mapper might look something like:

```typescript
const mapper = new Mapper(...template, 
        { 
            "$protect": (s) => {
                let i = s.length
                let out = ""
                while (i--) {
                    out += '*'
                }
                return out
            }
        }
    );
```

This middleware replaces all characters in a _"protected"_ field with asterixs.

The template might look like this:

```json
{
    "name": "$.bar",
    "password": "$.foo",
    "protectedPassword": { "$protect": "$.foo", "literal": false },
}
```

The template above indicates that:
- We want to map a value to the `protectedPassword` property in the _target_
- We want to get the `foo` property in the _source_
- We are doing a JSONPath query with the value of the `$protect` field, **not** passing it literally.
- We are applying the `$protect` middleare to the result of the json query before mapping

The payload might look like:

```json
{ "bar": "ANAME", "foo": "ManagementL1amaWonderC@t" }
```

and the output would be:

```json
{
    "name": "ANAME",
    "protectedPassword": "************************",
    "password": "ManagementL1amaWonderC@t"
}
```

## Templates with middleware

Passing middleware will enable you to write middleware templates. Templates have this interesting type:

```typescript
export type MiddleWareTemplate = {
    [key: string]: string
} & {
    literal?: boolean
}
```

This type means that there is always one property in the type called literal, but there is another field with an arbitrary name that's a string with a property type of string.

An example of this would be:

```json
{
    "$maybe": "$.some.value",
    "literal": false
}
```

or

```json
{
    "$maybe": "$.some.value",
}
```

or

```json
{
    "$identity": "HUMAN",
    "literal": true
}
```

You may also apply middleware on complex objects

```json
{
    "names": { "$orderByName": ["$..name", { "givenName": "$.givenName", "familyName": "$.surname" }], "literal": false }
}
```

## Default middleware

There is an object with default middleware that you can import which contains some utility functions that I found are used often when transforming payloads

To use this in alongside your own custom middleware you can add it to the constructor using the spread operator

```typescript
import defaultMiddleware from "bonsai/middleware"

const mapper = new Mapper(template, 
        { 
            ...defaultMiddleware,
            "$protect": (s) => {
                let i = s.length
                let out = ""
                while (i--) {
                    out += '*'
                }
                return out
            }
        }
    );
```

### List of default middleware

Below is a list of default middleware and their use cases.

### $getFirstElement

Signature:  `(x: unknown[]): unknown`

Description: Use primarily for when operating deep within an hierarchy and you want to simplify a query. Currently the only way to simplify a query is to use the pattern defined in _Transforming array of objects in source_ where you can make subqueries in an array. 

```typescript
{
    propertyName: [ 
        "$.path.to.field.with.array.of.objects", // path from root
        {
            propertName: "$.item.field" // sub path
        } 
    ]
}
```

you can use the pattern above with the `$getFirstElement` middleware to create an array of size one and then extract that value as a property instead of an array


Example: 

```typescript
{
    propertyName: {
        $getFirstElement: [ 
            "$.path.to.field.with.array.of.objects", // path from root
            {
                propertName: "$.item.field" // sub path
            } 
        ]
    }
}
```

### $identity

Signature:  `(x: unknown): unknown`

Description: This is primarily used when you want to pass a string value that starts with a dollar sign literally

Example: 

```typescript
{
    value: { $identity "$.Some non query value", literal: true }
}

```

### $mergeObjects

Signature:  `(x: unknown[]): unknown`

Description:  Used to merge two objects in source

Example: 

```typescript
template = {
    mergedObjects: { $mergeObjects: "$.foo" }
}
source = {
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
expectedValue = {
    mergedObjects: {
        value: "cheese",
        number: 1,
        deeper: {
            hello: "world"
        }
    }
}
```

### $override

Signature:  `({ x, y }: { x: unknown, y: unknown }): unknown`

Description: Will override a value if another value is present

Example: 

```typescript
template = {
    "name": { $override: { x: "$.bar", y: "$.info.name" } },
    "type": {
        complexInnerType: "$.innerType"
    }
}

source = {
    bar: "ANAME",
    innerType: true,
    info: {
        name: "Tony"
    }
}

expectedValue = {
    name: "Tony",
    type: {
        complexInnerType: true
}
```

### $unique

Signature:  `(list: readonly T[]): T[]`

Description: Removes duplicates from a list

Example: 

```typescript
template = {
    onlyOne: { $unique: "$.foo" }
}

source = {
    foo: [1, 1, 2, 4, 4, 4, 4, 4, 5, 7, 8, 8,]
}

expectedValue = { onlyOne: [1, 2, 4, 5, 7, 8] }

```

### $union

Signature:  `({ x, y }: { x: unknown[], y: unknown[] }): unknown[] `

Description: Get the union of two lists

Example: 

```typescript
template = {
    combined: { $union: { x: "$.daisy", y: "$.paul" } }
}

source = {
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

expectedValue = {
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
```

### $intersection

Signature:  `({ x, y }: { x: unknown[], y: unknown[] }): unknown[]`

Description: Get only the elements that are common in two lists

Example:

```typescript
template = {
    both: { $intersection: { x: "$.daisy", y: "$.paul" } }
}

source = {
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

expectedValue = { both: ["apple", "orange", "pizza"] }
```

### $some

Signature:  `({ x, arr }: { x: unknown, arr: unknown[] }): boolean`

Description: will return true if one of the values are present in the array. Remember that the array can be a queried object so you can create arrays using JSONPath and bonsai that are populated from multiple areas of your source data.

Example: 

```typescript
template = { valid: { $some: { x: "beans", arr: "$.items" } } }

source = {
    items: [
        "cheese",
        "chicken",
        "water",
        "beans"
    ]
}

expectedValue = { valid: true }
```

### $every

Signature:  `({ x, arr }: { x: unknown, arr: unknown[] }): boolean`

Description: will return true if all of the values in the array are equal to `x`. Remember that the array can be a queried object so you can create arrays using JSONPath and bonsai that are populated from multiple areas of your source data.

Example: 

```typescript
template = {
    totalSuccess: { $every: { x: "passed", arr: ["$..passed"] } }
}

source = {
    processed: [
        { item: 1, duration: 19.2, passed: "passed" },
        { item: 2, duration: 31, passed: "passed" },
        { item: 3, duration: 104, passed: "passed" },
        { item: 4, duration: 12, passed: "passed" },
        { item: 5, duration: 4, passed: "passed" },
    ]
}

expectedValue = { totalSuccess: true }
```