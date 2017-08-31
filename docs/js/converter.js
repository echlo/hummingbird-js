function convert() {
    const inputText = document.getElementById("json-area").value;
    const outputArea = document.getElementById("hbon-area");
    const inputByteDiv = document.getElementById("json-area-bytes");
    const outputByteDiv = document.getElementById("hbon-area-bytes");

    const strippedInputText = inputText.replace(/[\ \n\t]/g, "");
    const byteAmount = unescape(encodeURIComponent(strippedInputText)).length;
    inputByteDiv.innerText = "Byte length: " + byteAmount;

    let inputObj;
    try {
        inputObj = JSON.parse(inputText);        
    } catch (err) {
        outputByteDiv.innerText = "";
        outputArea.value = "The JSON is not valid";
        return;
    }

    const schema = getSchema();
    const hbon = Hummingbird.serialize(schema, inputObj);

    outputArea.value = hbon.map(function(value) {
        let hex = value.toString(16).toUpperCase();
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    }).join(" ");
    outputByteDiv.innerText = "Byte length: " + hbon.length;
}

function getSchema() {
    const schemaObj = {};
    const selectEls = Array.from(document.getElementsByTagName("select"));
    for (const el of selectEls) {        
        const value = el.options[el.selectedIndex].value;
        set(schemaObj, el.name, value);        
    }        
    return new Hummingbird.Schema(schemaObj);
}

function set(obj, path, value) {
    let pathParts = path.split(".");    
    let toSetObj = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
        const pathPart = pathParts[i];
        if (!toSetObj[pathPart]) {
            toSetObj[pathPart] = {};            
        }
        toSetObj = toSetObj[pathPart];
    }
    const lastPart = pathParts[pathParts.length - 1];
    toSetObj[lastPart] = value;
}

function validate() {
    const inputText = document.getElementById("json-area").value;
    const inputByteDiv = document.getElementById("json-area-bytes");

    const strippedInputText = inputText.replace(/[\ \n\t]/g, "");
    var byteAmount = unescape(encodeURIComponent(strippedInputText)).length;
    inputByteDiv.innerText = "Byte length: " + byteAmount;

    let inputObj;
    try {
        inputObj = JSON.parse(inputText);        
    } catch (err) {
        return;
    }

    const types = tryObjectType(inputObj);    

    let htmlContent = "<h5>Type picker</h5>";
    htmlContent += "<p>Because Hummingbird requires objects to be typed, and JSON is untyped, for this demo we try to infer what the type is. This demo does not currently support arrays.</p>";
    htmlContent += "<table>";
    for (const item of types) {
        htmlContent += buildHTMLContent(item);
    }
    htmlContent += "</table>";

    const inferArea = document.getElementById("type-inferer");
    inferArea.innerHTML = htmlContent;
}

function tryObjectType(obj, parentPath) {
    const result = [];
    
    Object.keys(obj).forEach(function(key) {
        const value = obj[key];
        const type = typeof value;

        let fullpath = key;
        if (parentPath != null) {
            fullpath = parentPath + "." + fullpath;
        }

        let determinedType;
        if (type === "number") {
            if (value % 1 === 0) {
                if (value >= 0) {
                    if (value <= 255) {
                        determinedType = Hummingbird.Types.uint8;
                    } else if (value <= 65535) {
                        determinedType = Hummingbird.Types.uint16;
                    } else if (value <= 4294967295) {
                        determinedType = Hummingbird.Types.uint32;
                    } else {
                        determinedType = Hummingbird.Types.uint64;
                    }
                } else {
                    if (value >= -128 && value <= 127) {
                        determinedType = Hummingbird.Types.int8;
                    } else if (value >= -32768 && value <= 32767) {
                        determinedType = Hummingbird.Types.int16;
                    } else if (value >= -2147483648 && value <=  2147483647) {
                        determinedType = Hummingbird.Types.int32;
                    } else {
                        determinedType = Hummingbird.Types.int64;
                    }
                }                
            } else {
                determinedType = Hummingbird.Types.float;
            }
        } else if (type === "string") {
            determinedType = Hummingbird.Types.string;            
        } else if (type === "boolean") {
            determinedType = Hummingbird.Types.bool;            
        } else if (type === "object") {
            const subResult = tryObjectType(value, fullpath);            
            Array.prototype.push.apply(result, subResult);
        }

        if (determinedType != null) {
            result.push({
                name: fullpath,
                type: determinedType,
            });
        }
    });

    return result;
}

function buildHTMLContent(item) {
    let result = "";
    result += '<tr>';
    result += '<td class="type-name">' + item.name + '</td>';
    result += '<td><select name="' + item.name + '">';

    Object.keys(Hummingbird.Types).forEach(function(typeName) {
        let innerResult = '<option value="' + Hummingbird.Types[typeName] + '"';
        if (item.type === Hummingbird.Types[typeName]) {
            innerResult += ' selected';
        }
        innerResult += ' >';
        innerResult += typeName;
        innerResult += '</option>'
        result += innerResult;
    });
    result += '</select></td>';
    result += '</tr>';
    return result;
}

// Script starts here
validate();