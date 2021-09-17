import * as errors from "./errors";

export interface FormPart {
    "Content-Disposition": string
    "Content-Type"?: string
    name: string
    content: string | Buffer
}

export type MultipartResult = { [key: string]: string | Buffer | (string | Buffer)[] };

export function parseMultipart(buffer: Buffer, contentType: string) {
    if (!buffer) throw errors.argumentNull("buffer");
    if (!contentType) throw errors.argumentNull("contentType");

    let c = parseContentType(contentType);
    let boundary = c.boundary;
    if (!boundary)
        throw errors.notFindBoundaryInContentType(contentType);//new Error(`Content type ${contentType} is incorrect.`);

    let reader = new BufferReader(buffer);
    let line = reader.readLine("buffer");
    let currentFormPart: FormPart | null = null;
    let contentLines: Buffer[] | null = null;
    let formParts: FormPart[] = [];

    while (line != null) {
        let lineText = line.toString("utf-8").trim();
        if (lineText == `--${boundary}` || lineText == `--${boundary}--`) {
            if (currentFormPart == null) {
                currentFormPart = {} as FormPart;
            }
            else {
                if (contentLines == null)
                    throw new Error("Parse content fail.");

                let lastLine = contentLines[contentLines.length - 1];
                //==============================================================================
                // 去除最后一行的换行符
                contentLines[contentLines.length - 1] = trim(lastLine);
                //==============================================================================
                currentFormPart.content = Buffer.concat(contentLines);
                if (!currentFormPart["Content-Type"]) {
                    currentFormPart.content = currentFormPart.content.toString("utf-8");
                }

                formParts.push(currentFormPart);

                currentFormPart = {} as FormPart;
                contentLines = null;
            }
        }
        else if (lineText != "" && currentFormPart != null && contentLines == null) {
            let keyValues = lineText.split(";").map(o => o.trim());
            for (let i = 0; i < keyValues.length; i++) {
                let item = keyValues[i];

                if (i == 0) {
                    let arr = item.split(":").map(o => o.trim());
                    currentFormPart[arr[0] as keyof FormPart] = arr[1];
                }
                else {
                    let index = item.indexOf("=");
                    console.assert(index > 0, 'String is not contains \'=\' signal.');
                    let name: string = item.substr(0, index);
                    let value = item.substr(index + 1);
                    (currentFormPart as any)[name] = JSON.parse(value);
                    // let arr = item.split("=", 2).map(o => o.trim());
                    // currentFormPart[arr[0]] = JSON.parse(arr[1]);
                }
            }
        }
        else if (lineText == "" && currentFormPart != null && contentLines == null) {
            contentLines = [];
        }
        else if (contentLines != null) {
            contentLines.push(line);
        }
        line = reader.readLine("buffer");
    }

    let r: MultipartResult = {};
    for (let i = 0; i < formParts.length; i++) {
        let name = formParts[i].name;
        if (r[name]) {
            let value = r[name];
            if (Array.isArray(value)) {
                value.push(formParts[i].content);
            }
            else {
                r[name] = [value, formParts[i].content];
            }
        }
        else {
            r[name] = formParts[i].content;
        }
    }

    return r;
}

function parseContentType(contentType: string) {
    let r: { contentType: string, boundary: string } = {} as any;
    contentType.split(";").map(o => o.trim())
        .forEach((o, i) => {
            if (i == 0) {
                r.contentType = o
            }
            else {
                let arr = o.split('=').map(o => o.trim());
                r[arr[0] as keyof typeof r] = arr[1];
            }
        })

    return r;
}

const rchar = Buffer.from('\r')[0];
const nchar = Buffer.from('\n')[0];

export function trim(line: Buffer) {
    let latest = line[line.length - 1];
    let secondToLatest = line.length >= 2 ? line[line.length - 2] : null;
    if (latest == nchar && secondToLatest == rchar) {
        return line.slice(0, line.length - 2);
    }
    else if (latest == nchar || latest == rchar) {
        return line.slice(0, line.length - 1);
    }

    return line;
}

class BufferReader {
    private buffer: Buffer;
    private position: number;

    constructor(buffer: Buffer) {
        if (!buffer) throw errors.argumentNull("buffer");

        this.buffer = buffer;
        this.position = 0;
    }

    reset() {
        this.position = 0;
    }

    readLine(): string | null;
    readLine(resultType: "string"): string | null;
    readLine(resultType: "buffer"): Buffer | null;
    readLine(resultType?: "string" | "buffer"): string | Buffer | null {

        if (this.position > this.buffer.length - 1) {
            return null;
        }

        resultType = resultType || "string";

        let line: number[] = [];
        while (this.position < this.buffer.length) {
            line.push(this.buffer[this.position]);
            this.position = this.position + 1;

            if (line[line.length - 1] == nchar) {
                break;
            }
        }

        let lineBuffer = Buffer.from(line);
        if (resultType == "buffer") {
            return lineBuffer;
        }

        let lineText = lineBuffer.toString("utf-8");
        return lineText;

    }
}
