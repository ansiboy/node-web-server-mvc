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
    let obj: FormPart | null = null;
    let contentLines: Buffer[] | null = null;
    let formParts: FormPart[] = [];

    while (line != null) {
        let lineText = line.toString("utf-8").trim();
        if (lineText == `--${boundary}` || lineText == `--${boundary}--`) {
            if (obj == null) {
                obj = {} as any;
            }
            else {
                if (contentLines == null)
                    throw new Error("Parse content fail.");

                let lastLine = contentLines[contentLines.length - 1];
                //==============================================================================
                // 去除最后一行的换行符
                contentLines[contentLines.length - 1] = trim(lastLine);
                //==============================================================================
                obj.content = Buffer.concat(contentLines);
                if (!obj["Content-Type"]) {
                    obj.content = obj.content.toString("utf-8");
                }

                formParts.push(obj);

                obj = null;
                contentLines = null;
            }
        }
        else if (lineText != "" && obj != null && contentLines == null) {
            let arr = lineText.split(";").map(o => o.trim());
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i];

                if (i == 0) {
                    let arr = item.split(":").map(o => o.trim());
                    obj[arr[0] as keyof FormPart] = arr[1];
                }
                else {
                    let arr = item.split("=").map(o => o.trim());
                    obj[arr[0] as keyof FormPart] = JSON.parse(arr[1]);
                }
            }
        }
        else if (lineText == "" && obj != null && contentLines == null) {
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
