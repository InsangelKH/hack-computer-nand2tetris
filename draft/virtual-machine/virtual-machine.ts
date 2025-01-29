import fs from 'fs';
import util from 'util';
import path from 'path';
import { IVMTranslator, VMFileContent } from './types';

class VirtualMachine implements IVMTranslator {
    file: VMFileContent;
    fileName: string;
    parsedContent: string[];
    code: string[];
    returnCounter: number;
    directory: boolean;

    constructor(file: string, directory: boolean = false) {
        this.directory = directory;
        this.file = '';
        this.fileName = file;
        this.parsedContent = [];
        this.code = [];
        this.returnCounter = 0;
    }

    private readFile(file: string): Promise<void> {
        const readFile = util.promisify(fs.readFile);

        return readFile(file, 'utf8')
            .then((data) => {
                const lines = data.split('\n');
                const modifiedLines = lines.map((line) => {
                    if (line.includes('static')) {
                        return (
                            line +
                            ' ' +
                            file.split('/').pop()?.split('.').shift()
                        );
                    } else {
                        return line;
                    }
                });
                this.file = this.file + modifiedLines.join('\n');
            })
            .catch((err) => {
                console.error('readFile: ', err);
                this.file = '';
            });
    }

    private async parse(): Promise<void> {
        if (!this.directory) {
            await this.readFile(this.file);
        }

        if (this.file === '') {
            console.error("parse: File wasn't read properly");
            return;
        }

        this.parsedContent = this.file
            .split('\n')
            .map((line) => line.trim())
            .map((line) => line.split('//')[0].trim())
            .filter((line) => line.length > 0);
    }

    public async writeFile(): Promise<void> {
        await this.translate();

        const writeFile = util.promisify(fs.writeFile);
        const fileName = this.fileName.split('.')[0];
        const content = this.code.join('\n');

        return writeFile(`${fileName}.asm`, content, 'utf8')
            .then(() => {
                console.log('File written successfully');
            })
            .catch((err) => {
                console.error('writeFile: ', err);
            });
    }

    public async parseDirectory(directory: string): Promise<void> {
        const readdir = util.promisify(fs.readdir);
        const files = await readdir(directory);
        const vmFiles = files.filter((file) => path.extname(file) === '.vm');

        for (const file of vmFiles) {
            await this.readFile(path.join(directory, file));
            await this.parse();
        }
    }

    private commandType(line: string): string {
        if (line.startsWith('push')) {
            return 'C_PUSH';
        } else if (line.startsWith('pop')) {
            return 'C_POP';
        } else if (line.startsWith('label')) {
            return 'C_LABEL';
        } else if (line.startsWith('goto')) {
            return 'C_GOTO';
        } else if (line.startsWith('if-goto')) {
            return 'C_IF';
        } else if (line.startsWith('function')) {
            return 'C_FUNCTION';
        } else if (line.startsWith('call')) {
            return 'C_CALL';
        } else if (line.startsWith('return')) {
            return 'C_RETURN';
        } else {
            return 'C_ARITHMETIC';
        }
    }

    private writePush(line: string): string {
        const args = line.split(' ');
        const segment = args[1];
        const index = args[2];
        const fileName = args[3];
        let code: string = '';

        switch (segment) {
            case 'constant':
                code = `// ${line}
                    @${index}
                    D=A
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'local':
                code = `// ${line}
                    @LCL
                    D=M
                    @${index}
                    A=D+A
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'argument':
                code = `// ${line}
                    @ARG
                    D=M
                    @${index}
                    A=D+A
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'this':
                code = `// ${line}
                    @THIS
                    D=M
                    @${index}
                    A=D+A
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'that':
                code = `// ${line}
                    @THAT
                    D=M
                    @${index}
                    A=D+A
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'temp':
                code = `// ${line}
                    @${Number(index) + 5}
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'pointer':
                const pointer = Number(index) === 0 ? 'THIS' : 'THAT';
                code = `// ${line}
                    @${pointer}
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            case 'static':
                const staticPointer = `${fileName}.${index}`;
                code = `// ${line.split(' ')[0] + ' ' + line.split(' ')[1]}
                    @${staticPointer}
                    D=M
                    @SP
                    M=M+1
                    A=M-1
                    M=D
                `;
                break;
            default:
                console.log(`Unknown segment: ${segment}`);
                break;
        }

        return code.replace(/^\s+/gm, '');
    }

    private writePop(line: string): string {
        const args = line.split(' ');
        const segment = args[1];
        const index = args[2];
        const fileName = args[3];
        let code: string = '';

        switch (segment) {
            case 'local':
                code = `// ${line}
                    @LCL
                    D=M
                    @${index}
                    D=D+A
                    @R13
                    M=D
                    @SP
                    AM=M-1
                    D=M
                    @R13
                    A=M
                    M=D
                `;
                break;
            case 'argument':
                code = `// ${line}
                    @ARG
                    D=M
                    @${index}
                    D=D+A
                    @R13
                    M=D
                    @SP
                    AM=M-1
                    D=M
                    @R13
                    A=M
                    M=D
                `;
                break;
            case 'this':
                code = `// ${line}
                    @THIS   
                    D=M
                    @${index}
                    D=D+A
                    @R13
                    M=D
                    @SP
                    AM=M-1
                    D=M
                    @R13
                    A=M
                    M=D
                `;
                break;
            case 'that':
                code = `// ${line}
                    @THAT
                    D=M
                    @${index}
                    D=D+A
                    @R13
                    M=D
                    @SP
                    AM=M-1
                    D=M
                    @R13
                    A=M
                    M=D
                `;
                break;
            case 'temp':
                code = `// ${line}
                    @${Number(index) + 5}
                    D=A
                    @R13
                    M=D
                    @SP
                    AM=M-1
                    D=M
                    @R13
                    A=M
                    M=D
                `;
                break;
            case 'pointer':
                const pointer = Number(index) === 0 ? 'THIS' : 'THAT';
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    @${pointer}
                    M=D
                `;
                break;
            case 'static':
                const staticPointer = `${fileName}.${index}`;
                code = `// ${line.split(' ')[0] + ' ' + line.split(' ')[1]}
                    @SP
                    AM=M-1
                    D=M
                    @${staticPointer}
                    M=D
                `;
                break;
            default:
                console.log(`Unknown segment: ${segment}`);
                break;
        }

        if (segment === 'static') {
            console.log(code.replace(/^\s+/gm, ''));
        }

        return code.replace(/^\s+/gm, '');
    }

    private writeArithmetic(line: string, index: number): string {
        let code: string = '';

        switch (line) {
            case 'add':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    M=M+D
                `;
                break;
            case 'sub':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    M=M-D
                `;
                break;
            case 'neg':
                code = `// ${line}
                    @SP
                    A=M-1
                    M=-M`;
                break;
            case 'eq':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    D=M-D
                    M=-1
                    @EQ${index}
                    D;JEQ
                    @SP
                    A=M-1
                    M=0
                    (EQ${index})
                `;
                break;
            case 'gt':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    D=M-D
                    M=-1
                    @GT${index}
                    D;JGT
                    @SP
                    A=M-1
                    M=0
                    (GT${index})
                `;
                break;
            case 'lt':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    D=M-D
                    M=-1
                    @LT${index}
                    D;JLT
                    @SP
                    A=M-1
                    M=0
                    (LT${index})
                `;
                break;
            case 'and':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    M=M&D
                `;
                break;
            case 'or':
                code = `// ${line}
                    @SP
                    AM=M-1
                    D=M
                    A=A-1
                    M=M|D
                `;
                break;
            case 'not':
                code = `// ${line}
                    @SP
                    A=M-1
                    M=!M
                `;
                break;
            default:
                console.log(`Unknown command: ${line}`);
                break;
        }

        return code.replace(/^\s+/gm, '');
    }

    private writeLabel(line: string): string {
        const [segment, label] = line.split(' ');

        const code = `// ${line}
            (${label})
        `;

        return code.replace(/^\s+/gm, '');
    }

    private writeGoto(line: string): string {
        const [segment, label] = line.split(' ');

        const code = `// ${line}
            @${label}
            0;JMP
        `;

        return code.replace(/^\s+/gm, '');
    }

    private writeIf(line: string): string {
        const [segment, label] = line.split(' ');

        const code = `// ${line}
            @SP
            AM=M-1
            D=M
            @${label}
            D;JNE
        `;

        return code.replace(/^\s+/gm, '');
    }

    private writeFunction(line: string): string {
        const [segment, functionName, numLocals] = line.split(' ');

        let code: string = '';

        code = `// ${line}
            (${functionName})
        `;

        for (let i = 0; i < Number(numLocals); i++) {
            code += `@SP
                AM=M+1
                A=A-1
                M=0
            `;
        }

        return code.replace(/^\s+/gm, '');
    }

    private writeReturn(line: string): string {
        const code = `// ${line}
            @LCL
            D=M
            @R13
            M=D
            @5
            A=D-A
            D=M
            @R14
            M=D
            @SP
            AM=M-1
            D=M
            @ARG
            A=M
            M=D
            @ARG
            D=M+1
            @SP
            M=D
            @R13
            AM=M-1
            D=M
            @THAT
            M=D
            @R13
            AM=M-1
            D=M
            @THIS
            M=D
            @R13
            AM=M-1
            D=M
            @ARG
            M=D
            @R13
            AM=M-1
            D=M
            @LCL
            M=D
            @R14
            A=M
            0;JMP
        `;

        return code.replace(/^\s+/gm, '');
    }

    private writeCall(line: string): string {
        const [segment, functionName, numArgs] = line.split(' ');
        const numArgsInt = parseInt(numArgs);

        const returnAddress = `${functionName}$ret.${this.returnCounter++}`;

        const code = `// ${line}
            @${returnAddress}
            D=A
            @SP
            A=M
            M=D
            @SP
            M=M+1
            @LCL
            D=M
            @SP
            AM=M+1
            A=A-1
            M=D
            @ARG
            D=M
            @SP
            AM=M+1
            A=A-1
            M=D
            @THIS
            D=M
            @SP
            AM=M+1
            A=A-1
            M=D
            @THAT
            D=M
            @SP
            AM=M+1
            A=A-1
            M=D
            @SP
            D=M
            @5
            D=D-A
            @${numArgsInt}
            D=D-A
            @ARG
            M=D
            @SP
            D=M
            @LCL
            M=D
            @${functionName}
            0;JMP
            (${returnAddress})`;

        return code.replace(/^\s+/gm, '');
    }

    public async translate(): Promise<void> {
        if (this.directory) {
            await this.parseDirectory(path.join(__dirname));
        } else {
            await this.parse();
        }

        if (this.parsedContent.length === 0) {
            console.error('translate: No content to translate');
            return;
        }

        this.parsedContent.forEach((line, index) => {
            const type = this.commandType(line);
            let code: string = '';

            switch (type) {
                case 'C_PUSH':
                    code = this.writePush(line);
                    this.code.push(code);
                    break;
                case 'C_POP':
                    code = this.writePop(line);
                    this.code.push(code);
                    break;
                case 'C_ARITHMETIC':
                    code = this.writeArithmetic(line, index);
                    this.code.push(code);
                    break;
                case 'C_LABEL':
                    code = this.writeLabel(line);
                    this.code.push(code);
                    break;
                case 'C_GOTO':
                    code = this.writeGoto(line);
                    this.code.push(code);
                    break;
                case 'C_IF':
                    code = this.writeIf(line);
                    this.code.push(code);
                    break;
                case 'C_FUNCTION':
                    code = this.writeFunction(line);
                    this.code.push(code);
                    break;
                case 'C_CALL':
                    code = this.writeCall(line);
                    this.code.push(code);
                    break;
                case 'C_RETURN':
                    code = this.writeReturn(line);
                    this.code.push(code);
                    break;
                default:
                    console.log(`Unknown command: ${line}`);
                    break;
            }
        });

        // console.log(this.code);
    }

    public loadBootstrapCode(): void {
        const code = `// Bootstrap code
            @256
            D=A
            @SP
            M=D
            @Sys.init$RETURN0
            D=A
            @SP
            A=M
            M=D
            @SP
            M=M+1	// push return-address
            @LCL
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1	// push LCL
            @ARG
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1	// push ARG
            @THIS
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1	// push THIS
            @THAT
            D=M
            @SP
            A=M
            M=D
            @SP
            M=M+1	// push THAT
            @SP
            D=M
            @0
            D=D-A
            @5
            D=D-A
            @ARG
            M=D	// ARG = SP-n-5
            @SP
            D=M
            @LCL
            M=D	// LCL = SP
            @Sys.init
            0;JMP
            (Sys.init$RETURN0)`;

        const bootstrapCode = code.replace(/^\s+/gm, '');

        this.code.unshift(bootstrapCode);
    }
}

const vm = new VirtualMachine('StaticsTest', true);
// vm.translate();
vm.loadBootstrapCode();
vm.writeFile();
