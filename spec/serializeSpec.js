/* eslint-env node, jasmine */
import Long from "long";
import { Types, Schema, serialize, Mapping } from "../src/hummingbird";
import { base64ToByteArray } from "../src/encodingutils";

describe("serialize", () => {
    it("serializes an empty object", () => {
        const schema = new Schema({});
        const input = {};
        expect(serialize(schema, input)).toEqual([13, 0]);
    });
    describe("when the object contains keys not in the schema", () => {
        it("ignores them", () => {
            const schema = new Schema({});
            const input = { foo: 5 };
            expect(serialize(schema, input)).toEqual([13, 0]);
        });
    });
    describe("when the schema contains keys not in the object", () => {
        it("ignores them", () => {
            const schema = new Schema({ foo: Types.uint8 });
            const input = { };
            expect(serialize(schema, input)).toEqual([13, 0]);
        });
    });
    describe("when the schema contains a byte key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.uint8 });
            const input = { foo: 5 };
            expect(serialize(schema, input)).toEqual([13, 1, 3, 102, 111, 111, 1, 5]);
        });
    });
    describe("when the schema contains a signed short key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.int16 });
            const input = { foo: -500 };
            expect(serialize(schema, input)).toEqual([13, 1, 3, 102, 111, 111, 2, 12, 254]);
        });
    });
    describe("when the schema contains an unsigned short key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.uint16 });
            const input = { foo: 500 };
            expect(serialize(schema, input)).toEqual([13, 1, 3, 102, 111, 111, 3, 244, 1]);
        });
    });
    describe("when the schema contains a signed int key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.int32 });
            const input = { foo: -500000 };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 4, 224, 94, 248, 255]
            );
        });
    });
    describe("when the schema contains an unsigned int key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.uint32 });
            const input = { foo: 500000 };
            expect(serialize(schema, input)).toEqual([13, 1, 3, 102, 111, 111, 5, 32, 161, 7, 0]);
        });
    });
    describe("when the schema contains a signed long key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.int64 });
            const input = { foo: Long.fromNumber(-5000000000) };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 6, 0, 14, 250, 213, 254, 255, 255, 255]
            );
        });
    });
    describe("when the schema contains an unsigned long key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.uint64 });
            const input = { foo: Long.fromNumber(5000000000, true) };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 7, 0, 242, 5, 42, 1, 0, 0, 0]
            );
        });
    });
    describe("when the schema contains a double key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.double });
            const input = { foo: -5000000000.0 };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 8, 0, 0, 0, 32, 95, 160, 242, 193]
            );
        });
    });
    describe("when the schema contains a float key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.float });
            const input = { foo: -5.0 };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 9, 0, 0, 160, 192]
            );
        });
    });
    describe("when the schema contains a string key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.string });
            const input = { foo: "bar" };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 10, 3, 98, 97, 114]
            );
        });
    });
    describe("when the schema contains a bool key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.bool });
            const input = { foo: true };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 11, 1]
            );
        });
    });
    describe("when the schema contains a guid key", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.guid });
            const input = { foo: base64ToByteArray("ICDsIeo6aUCi3QgAKzAwnQ==") };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 14,
                32, 32, 236, 33, 234, 58, 105, 64, 162, 221, 8, 0, 43, 48, 48, 157]
            );
        });
    });
    describe("when the schema contains a byte array", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: [Types.uint8] });
            const input = { foo: [5, 6] };
            expect(serialize(schema, input)).toEqual(
              [13, 1, 3, 102, 111, 111, 12, 2, 1, 5, 6]
            );
        });
    });
    describe("when the object contains a null key", () => {
        it("omits the null key", () => {
            const schema = new Schema({ foo: Types.string });
            const input = { foo: null };
            expect(serialize(schema, input)).toEqual(
                [13, 0]
            );
        });
    });
    describe("when the object contains an undefined key", () => {
        it("omits the undefined key", () => {
            const schema = new Schema({ foo: Types.string });
            const input = { foo: undefined };
            expect(serialize(schema, input)).toEqual(
                [13, 0]
            );
        });
    });
    describe("when the object contains an undefined variable", () => {
        it("omits the undefined key", () => {
            const schema = new Schema({ foo: Types.string });
            const baa = {};
            const input = { foo: baa.bar };
            expect(serialize(schema, input)).toEqual(
                [13, 0]
            );
        });
    });
    describe("when the object is serialized using short keys", () => {
        it("serializes", () => {
            const schema = new Schema({ foo: Types.bool });
            const input = { foo: true };
            const mapping = new Mapping({ foo: 9 });
            expect(serialize(schema, input, mapping)).toEqual(
                [13, 1, 0, 9, 11, 1]
            );
        });
    });
});
