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
        throw new Error(`Content type ${contentType} is incorrect.`);

    let reader = new BufferReader(buffer);
    let line = reader.readLine("buffer");
    let obj: FormPart = {} as any;
    let contentLines: Buffer[] = [];
    let formParts: FormPart[] = [];

    while (line != null) {
        let lineText = line.toString("utf-8").trim();
        if (lineText == `--${boundary}` || lineText == `--${boundary}--`) {

            if (contentLines.length > 0) {
                obj.content = Buffer.concat(contentLines);
                if (!obj["Content-Type"])
                    obj.content = obj.content.toString("utf-8");

                formParts.push(obj);

                obj = {} as any;
                contentLines = [];
            }

        }
        else if (lineText.startsWith("Content-Disposition") || lineText.startsWith("Content-Type")) {
            lineText.split(";").map(o => o.trim()).forEach((item, i) => {
                if (i == 0) {
                    let arr = item.split(":").map(o => o.trim());
                    obj[arr[0] as keyof FormPart] = arr[1];
                }
                else {
                    let arr = item.split("=").map(o => o.trim());
                    obj[arr[0] as keyof FormPart] = JSON.parse(arr[1]);
                }
            });
        }
        else if (lineText == "") {
            ;
        }
        else {
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

class BufferReader {
    private buffer: Buffer;
    private position: number;
    private rchar = Buffer.from('\r')[0];
    private nchar = Buffer.from('\n')[0];

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

            if (line[line.length - 1] == this.nchar) {
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
