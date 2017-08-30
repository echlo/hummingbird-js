/* eslint-env node, jasmine */
import Long from "long";
import { parse, Mapping } from "../src/hummingbird";
import { base64ToByteArray } from "../src/encodingutils";

describe("parse", () => {
    it("parses an empty object", () => {
        const input = new Uint8Array([13, 0]);
        const output = {};
        expect(parse(input)).toEqual(output);
    });
    describe("when the object contains a byte key", () => {
        it("parses", () => {
            const input = new Uint8Array([13, 1, 3, 102, 111, 111, 1, 5]);
            const output = { foo: 5 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a signed short key", () => {
        it("parses", () => {
            const input = new Uint8Array([13, 1, 3, 102, 111, 111, 2, 12, 254]);
            const output = { foo: -500 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains an unsigned short key", () => {
        it("parses", () => {
            const input = new Uint8Array([13, 1, 3, 102, 111, 111, 3, 244, 1]);
            const output = { foo: 500 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a signed int key", () => {
        it("parses", () => {
            const input = new Uint8Array([13, 1, 3, 102, 111, 111, 4, 224, 94, 248, 255]);
            const output = { foo: -500000 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains an unsigned int key", () => {
        it("parses", () => {
            const input = new Uint8Array([13, 1, 3, 102, 111, 111, 5, 32, 161, 7, 0]);
            const output = { foo: 500000 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a signed long key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 6, 0, 14, 250, 213, 254, 255, 255, 255]
            );
            const output = { foo: Long.fromNumber(-5000000000) };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains an unsigned long key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 7, 0, 242, 5, 42, 1, 0, 0, 0]
            );
            const output = { foo: Long.fromNumber(5000000000, true) };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a double key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 8, 0, 0, 0, 32, 95, 160, 242, 193]
            );
            const output = { foo: -5000000000.0 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a float key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 9, 0, 0, 160, 192]
            );
            const output = { foo: -5.0 };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a string key", () => {
        describe("when the string uses first header", () => {
            it("parses", () => {
                const input = new Uint8Array(
                    [13, 1, 3, 102, 111, 111, 10, 3, 98, 97, 114]
                );
                const output = { foo: "bar" };
                expect(parse(input)).toEqual(output);
            });
        });
        describe("when the string uses second header", () => {
            it("parses", () => {
                const moreBytes = [];
                for (let i = 0; i < 256; i++) {
                    moreBytes.push(114);
                }
                const moreText = "r".repeat(256);
                const input = new Uint8Array(
                    [13, 1, 3, 102, 111, 111, 10, 255, 3, 1, 98, 97, 114].concat(moreBytes)
                );
                const output = { foo: `bar${moreText}` };
                expect(parse(input)).toEqual(output);
            });
        });
        describe("when the string uses third header", () => {
            it("parses", () => {
                const moreBytes = [];
                for (let i = 0; i < 70000; i++) {
                    moreBytes.push(114);
                }
                const moreText = "r".repeat(70000);
                const input = new Uint8Array(
                    [13, 1, 3, 102, 111, 111, 10, 255,
                      255, 255, 115, 17, 1, 0, 98, 97, 114].concat(moreBytes)
                );
                const output = { foo: `bar${moreText}` };
                expect(parse(input)).toEqual(output);
            });
        });
    });
    describe("when the object contains a bool key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 11, 1]
            );
            const output = { foo: true };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a guid key", () => {
        it("parses", () => {
            const input = new Uint8Array(
              [13, 1, 3, 102, 111, 111, 14,
                32, 32, 236, 33, 234, 58, 105, 64, 162, 221, 8, 0, 43, 48, 48, 157]
            );
            const output = { foo: base64ToByteArray("ICDsIeo6aUCi3QgAKzAwnQ==") };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object contains a byte array key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 3, 102, 111, 111, 12, 2, 1, 5, 6]
            );
            const output = { foo: [5, 6] };
            expect(parse(input)).toEqual(output);
        });
    });
    describe("when the object uses a short key", () => {
        it("parses", () => {
            const input = new Uint8Array(
                [13, 1, 0, 8, 10, 3, 98, 97, 114]
            );
            const output = { foo: "bar" };
            const mapping = new Mapping({ foo: 8 });
            expect(parse(input, mapping)).toEqual(output);
        });
    });
});
