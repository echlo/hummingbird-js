import { stringToVariableLengthByteArray } from "./encodingutils";

export class Mapping {
    constructor(mapping = {}) {
        this.mapping = mapping;
        const mapKeys = Object.getOwnPropertyNames(mapping);
        this.reverseMapping = {};
        for (const key of mapKeys) {
            const value = this.mapping[key];
            this.reverseMapping[value] = key;
        }
    }
    getByteArray(key) {
        const mapValue = this.mapping[key];
        if (mapValue) {
            return Array.from([0, mapValue]);
        }
        return Array.from(stringToVariableLengthByteArray(key));
    }
    getKey(shortKey) {
        const mapKey = this.reverseMapping[shortKey];
        if (mapKey) {
            return mapKey;
        }
        return shortKey;
    }
}
