import Long from "long";
import { Types } from "./types";
import { byteArrayToString } from "./encodingutils";
import { Mapping } from "./mapping";

/* eslint-disable no-use-before-define */
const parserForType = {
    [Types.uint8]: parserForArrayType(Uint8Array, 1),
    [Types.int16]: parserForArrayType(Int16Array, 2),
    [Types.uint16]: parserForArrayType(Uint16Array, 2),
    [Types.int32]: parserForArrayType(Int32Array, 4),
    [Types.uint32]: parserForArrayType(Uint32Array, 4),
    [Types.int64]: parserForLong(false),
    [Types.uint64]: parserForLong(true),
    [Types.double]: parserForArrayType(Float64Array, 8),
    [Types.float]: parserForArrayType(Float32Array, 4),
    [Types.string]: parseString,
    [Types.bool]: parseBool,
    [Types.object]: parseObject,
    [Types.array]: parseArray,
    [Types.guid]: parseGuid,
};
/* eslint-enable no-use-before-define */

function typedParse(target, mapping) {
    const parser = parserForType[target[0]];
    return parser(target.subarray(1), mapping);
}

const stringHeaders = [
    { type: Types.uint8, byteLength: 1 },
    { type: Types.uint16, byteLength: 2 },
    { type: Types.uint32, byteLength: 4 },
];

function parseVariableLengthHeaders(target) {
    const dataView = new DataView(new Uint8Array(target).buffer);

    let value = dataView.getUint8(0);
    let offset = 1;

    if (value === 255) {
        value = dataView.getUint16(1, true);
        offset = 3;
        if (value === 65535) {
            value = dataView.getUnt32(3, true);
            offset = 7;
        }
    }

    const nextTarget = target.subarray(offset);

    return { value, nextTarget };
}

function parseString(target) {
    let nextTarget = target;
    let value = "";

    for (const header of stringHeaders) {
        const parser = parserForType[header.type];
        const maxValue = Math.pow(2, 8 * header.byteLength) - 1;
        const parsedLength = parser(nextTarget);
        nextTarget = parsedLength.nextTarget;

        if (parsedLength.value < maxValue) {
            value = byteArrayToString(nextTarget.subarray(0, parsedLength.value));
            nextTarget = nextTarget.subarray(parsedLength.value);
            break;
        }
    }

    return { value, nextTarget };
}

function parseKey(target, mapping) {
    const keyLength = target[0];
    let value = "";
    let nextTarget = target;
    if (keyLength === 0) {
        const shortKey = target[1];
        value = mapping.getKey(shortKey);
        nextTarget = nextTarget.subarray(2);
    } else {
        const parsedValue = parseString(target);
        value = parsedValue.value;
        nextTarget = parsedValue.nextTarget;
    }

    return { value, nextTarget };
}

function parseObject(target, mapping) {
    const parsedLength = parseVariableLengthHeaders(target);

    const numKeys = parsedLength.value;
    let nextTarget = parsedLength.nextTarget;

    const value = {};
    for (let i = 0; i < numKeys; i++) {
        const parsedKey = parseKey(nextTarget, mapping);
        nextTarget = parsedKey.nextTarget;

        const parsedValue = typedParse(nextTarget);
        value[parsedKey.value] = parsedValue.value;
        nextTarget = parsedValue.nextTarget;
    }

    return { value, nextTarget };
}

function parseArray(target, mapping) {
    const parsedLength = parseVariableLengthHeaders(target);

    const numElements = parsedLength.value;
    let nextTarget = parsedLength.nextTarget;

    const parser = parserForType[nextTarget[0]];
    const value = [];
    nextTarget = nextTarget.subarray(1);

    for (let i = 0; i < numElements; i++) {
        const parsedValue = parser(nextTarget, mapping);
        value.push(parsedValue.value);
        nextTarget = parsedValue.nextTarget;
    }

    return { value, nextTarget };
}

function parserForArrayType(ArrayType, byteLength) {
    return (target) => {
        const byteBuffer = target.buffer.slice(target.byteOffset, target.byteOffset + byteLength);
        return {
            value: new ArrayType(byteBuffer)[0],
            nextTarget: target.subarray(byteLength),
        };
    };
}

function parserForLong(unsigned) {
    return (target) => {
        const byteBuffer = target.buffer.slice(target.byteOffset, target.byteOffset + 8);
        const array = new Uint32Array(byteBuffer);
        return {
            value: new Long(array[0], array[1], unsigned),
            nextTarget: target.subarray(8),
        };
    };
}

function parseBool(target) {
    return {
        value: target[0] === 1,
        nextTarget: target.subarray(1),
    };
}

function parseGuid(target) {
    return {
        value: target.subarray(0, 16),
        nextTarget: target.subarray(16),
    };
}

export function parse(target, mapping = new Mapping()) {
    return typedParse(target, mapping).value;
}
