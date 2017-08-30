const atob = require("atob");
const btoa = require("btoa");

export function stringToUtf8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                      0x80 | ((charcode >> 6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
            // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                      0x80 | ((charcode >> 12) & 0x3f),
                      0x80 | ((charcode >> 6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

export function byteArrayToString(array) {
    return String.fromCharCode.apply(null, array);
}

export function arrayBufferToString(buffer) {
    return byteArrayToString(new Uint8Array(buffer));
}

export function floatToBase64(floatVal) {
    var float32Array = new Float32Array([floatVal]);
    return arrayBufferToBase64(float32Array.buffer);
}

export function base64ToFloat(base64) {
    var arrayBuffer = base64ToArrayBuffer(base64);
    var floatArray = new Float32Array(arrayBuffer);
    return floatArray[0];
}

export function base64ToByteArray(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    return byteArrayToBase64(bytes);
}

export function base64ToArrayBuffer(base64) {
    return base64ToByteArray(base64).buffer;
}

export function byteArrayToBase64(bytes) {
    var binary = "";
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function stringToVariableLengthByteArray(message) {
    const stringBytes = new Uint8Array(stringToUtf8Array(message));
    const size = sizeToArrayBuffer(stringBytes.length);
    return new Uint8Array(concatBuffers(size, stringBytes.buffer));
}

export function getCommandsBytes(commands) {
    const commandsBytes = new Uint8Array(commands.length * 2);
    for (let i = 0; i < commands.length; i++) {
        commandsBytes[i * 2] = commands[i].type;
        commandsBytes[(i * 2) + 1] = commands[i].command;
    }
    return commandsBytes;
}

// / Returns the size number as an array buffer
export function sizeToArrayBuffer(size) {
    let sizeBuffer;
    if (size >= 65535) {
        sizeBuffer = new ArrayBuffer(7);
        let dataView = new DataView(sizeBuffer);
        dataView.setUint8(0, 255);
        dataView.setUint16(1, 65535, true);
        dataView.setUint32(3, size, true);
    } else if (size >= 255) {
        sizeBuffer = new ArrayBuffer(3);
        let dataView = new DataView(sizeBuffer);
        dataView.setUint8(0, 255);
        dataView.setUint16(1, size, true);
    } else {
        sizeBuffer = new ArrayBuffer(1);
        let dataView = new DataView(sizeBuffer);
        dataView.setUint8(0, size);
    }
    return sizeBuffer;
}

export function generateCommandBuffer(commandByte /* Int */, commandBody /* Uint8Array or buffer */) /* returns ArrayBuffer */ {
    // If we passed in a buffer, we type it correctly
    if (commandBody && !commandBody.buffer) {
        commandBody = new Uint8Array(commandBody);
    }

    let commandArray = new Uint8Array(1);
    commandArray[0] = commandByte;

    const size = commandBody != null ? commandBody.length : 0;
    const sizeBuffer = sizeToArrayBuffer(size);

    let concatables = [commandArray, sizeBuffer];
    if (size > 0) {
        concatables.push(commandBody);
    }

    return concatBuffers.apply(this, concatables);
}

export function concatBuffers() {
    let args = Array.prototype.slice.apply(arguments).map(function (obj) { return new Uint8Array(obj.buffer || obj); });
    let array = concatTypedArrays.apply(this, args);
    return array.buffer;
}

export function concatTypedArrays(...args) {
    if (args.length == 0) {
        return new Uint8Array();
    }

    if (args.length == 1) {
        return args[0];
    }

    // Used for type checking, ensuring that array is the smae type as the previous array
    let previousType = null;
    // Count up the lengths of all the arrays
    let length = 0;
    for (let i = 0; i < args.length; i++) {
        const array = args[i];
        const currentType = Object.prototype.toString.call(array);

        // Type checking, make sure that every array is of the same type
        if (previousType != null) {
            if (currentType !== previousType) {
                throw 'Attempting to concatenate arrays of different types.  First type: ' + previousType + ' inconsistentType: ' + currentType;
            }
        }

        previousType = currentType;

        length += array.length;
    }

    const result = new (args[0].constructor)(length);

    let offset = 0;
    for (let i = 0; i < args.length; i++) {
        result.set(args[i], offset);
        offset += args[i].length;
    }

    return result;
}

export class ByteEncoder {
    constructor() {
        // This is an array of Uint8Arrays
        this.items = [];
    }
    addByteArray(byteArray) {
        this.items.push(byteArray);
    }
    addGuid(guid /* Base64EncodedString */) {
        this.items.push(base64ToByteArray(guid));
    }
    addString(string /* string */) {
        this.items.push(stringToVariableLengthByteArray(string));
    }
    addByte(byte /* integer */) {
        this.items.push(Uint8Array.from([byte]));
    }
    addBool(bool) {
        const boolArray = new Uint8Array(1);
        boolArray[0] = bool ? 1 : 0;
        this.items.push(boolArray);
    }
    addFloat64(floatItem) {
        const array = new Float64Array(1);
        array[0] = floatItem;
        this.items.push(new Uint8Array(array.buffer));
    }
    addVariableLengthItem(encoder) {
        const bytes = encoder.getByteArray();
        const sizeBytes = new Uint8Array(sizeToArrayBuffer(bytes.length));
        this.items.push(concatTypedArrays(sizeBytes, bytes));
    }
    getByteArray() {
        return concatTypedArrays(...this.items);
    }
}
