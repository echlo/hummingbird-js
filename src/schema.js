import { Types } from "./types";

export class Schema {
    constructor(schemaJson) {
        if (Array.isArray(schemaJson)) {
            this.type = Types.array;
            this.elementSchema = new Schema(schemaJson[0]);
        } else if (typeof(schemaJson) === "object") {
            this.type = Types.object;
            this.keySchema = {};
            for (const key of Object.getOwnPropertyNames(schemaJson)) {
                this.keySchema[key] = new Schema(schemaJson[key]);
            }
        } else {
            this.type = schemaJson;
        }
    }
    schemaFor(key) {
        return this.keySchema[key];
    }
    filterKeys(targetKeys) {
        return targetKeys.filter((key) => this.keySchema.hasOwnProperty(key));
    }
}
