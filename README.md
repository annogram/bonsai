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
import { Mapper } from "@ot-sync-platform/json-to-json-mapper";

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
const source = ....
const mappedObject = mapper.map( source );
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
(data: any, query: boolean) => unknown
```

The `data` parameter is a value that is defined in the template. The `query` parameter is an optional flag which denotes that the data is JSONpath query not a type to act on directly.

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

## Templates with mddleware

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