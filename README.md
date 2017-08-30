# Hummingbird-JS

This is an implementation of the Hummingbird parser and serializer for JavaScript.

## Synopsis

Hummingbird is a binary serialization format. See the project page for more details
and format specification.

## Code Example

```javascript
const json = { foo: "bar" };
const hbon = HummingBird.serialize({ foo: Hummingbird.Types.string }, json);
```

## Installing

Include the distribution javascript from the `dist` folder.

## Demo

Here's an [online converter](docs/index.html)

## Development

Download this repository and install dependencies via NPM or yarn.

This project uses webpack. To build, simply
```bash
npm run webpack
```

## API Reference

(More documentation to follow)

### Serializing a JSON object
```javascript
const hbon = Hummingbird.serialize(schema, object, mapping);
// - schema is a Hummingbird.Schema object
// - object is a JSON object
// - mapping is an optional mapping object for shortkey support
```

### Parsing a HBON object
```javascript
const json = Hummingbird.parse(object, mapping);
// - object is a JSON object
// - mapping is an optional mapping object for shortkey support
```

## Tests

This project uses Jasmine

```
npm run test
```

## Contributors

Current maintainer
- [Chong Han Chua](https://github.com/johncch)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details