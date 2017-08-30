import { stringToVariableLengthByteArray, sizeToArrayBuffer } from "./encodingutils";
import { Types } from "./types";
import { Mapping } from "./mapping";

/* eslint-disable no-use-before-define */
const serializerForType = {
    [Types.uint8]: serializerForArrayType(Types.uint8, Uint8Array),
    [Types.int16]: serializerForArrayType(Types.int16, Int16Array),
    [Types.uint16]: serializerForArrayType(Types.uint16, Uint16Array),
    [Types.int32]: serializerForArrayType(Types.int32, Int32Array),
    [Types.uint32]: serializerForArrayType(Types.uint32, Uint32Array),
    [Types.int64]: serializeLong,
    [Types.uint64]: serializeLong,
    [Types.double]: serializerForArrayType(Types.double, Float64Array),
    [Types.float]: serializerForArrayType(Types.float, Float32Array),
    [Types.string]: serializeString,
    [Types.bool]: serializeBool,
    [Types.array]: serializeArray,
    [Types.object]: serializeObject,
    [Types.guid]: serializeGuid,
};
/* eslint-enable no-use-before-define */

export function serialize(schema, target, mapping = new Mapping()) {
    const serializer = serializerForType[schema.type];
    return [schema.type].concat(serializer(schema, target, mapping));
}

function serializeObject(schema, target, mapping) {
    const targetKeys = Object.getOwnPropertyNames(target);
    const schemaKeys = schema.filterKeys(targetKeys);
    const keys = schemaKeys.filter((key) => target[key] !== null && typeof target[key] !== "undefined");
    const sizeBuffer = sizeToArrayBuffer(keys.length);
    let bytes = Array.from(new Uint8Array(sizeBuffer));
    for (const key of keys) {
        const serializedKey = mapping.getByteArray(key);
        const serializedValue = serialize(schema.schemaFor(key), target[key], mapping);
        bytes = bytes.concat(serializedKey, serializedValue);
    }
    return bytes;
}

function serializeArray(schema, target, mapping) {
    const elementType = schema.elementSchema.type;
    const serializer = serializerForType[elementType];
    const sizeBuffer = sizeToArrayBuffer(target.length);
    let bytes = Array.from(new Uint8Array(sizeBuffer));
    bytes.push(elementType);
    for (const element of target) {
        bytes = bytes.concat(serializer(schema.elementSchema, element, mapping));
    }
    return bytes;
}

function bytesForTypedArray(typedArray) {
    return Array.from(new Uint8Array(typedArray.buffer));
}

function serializerForArrayType(typeEnum, ArrayType) {
    return (schema, target) => bytesForTypedArray(new ArrayType([target]));
}

function serializeLong(schema, target) {
    return bytesForTypedArray(new Uint32Array([target.low, target.high]));
}

function serializeString(schema, target) {
    return Array.from(stringToVariableLengthByteArray(target));
}

function serializeBool(schema, target) {
    return [target ? 1 : 0];
}

function serializeGuid(schema, target) {
    return Array.from(target);
}
