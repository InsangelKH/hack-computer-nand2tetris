import fs from 'fs';
import util from 'util';
import { AsmFileContent, IAssembler } from './types';

class Assembler implements IAssembler {
    file: AsmFileContent;
    fileName: string;
    parsedContent: string[];
    code: string[];
    nextAddress: number;
    symbolTable: Record<string, number>;

    constructor(file: AsmFileContent) {
        this.file = file;
        this.fileName = file;
        this.parsedContent = [];
        this.code = [];
        this.nextAddress = 16;
        this.symbolTable = {
            SP: 0,
            LCL: 1,
            ARG: 2,
            THIS: 3,
            THAT: 4,
            R0: 0,
            R1: 1,
            R2: 2,
            R3: 3,
            R4: 4,
            R5: 5,
            R6: 6,
            R7: 7,
            R8: 8,
            R9: 9,
            R10: 10,
            R11: 11,
            R12: 12,
            R13: 13,
            R14: 14,
            R15: 15,
            SCREEN: 16384,
            KBD: 24576,
        };
    }

    private readFile(): Promise<void> {
        const readFile = util.promisify(fs.readFile);

        return readFile(this.file, 'utf8')
            .then((data) => {
                this.file = data;
            })
            .catch((err) => {
                this.file = '';
            });
    }

    private async parse(): Promise<void> {
        await this.readFile();
        if (this.file === '') {
            console.log("File wasn't read properly");
            return;
        }

        this.parsedContent = this.file
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith('//'));
    }

    public async writeFile(): Promise<void> {
        await this.translate();

        const writeFile = util.promisify(fs.writeFile);
        const fileName = this.fileName.split('.')[0];
        const content = this.code.join('\n');

        return writeFile(`${fileName}.hack`, content, 'utf8')
            .then(() => {
                console.log('File written successfully');
            })
            .catch((err) => {
                console.log(err);
            });
    }

    private instrucationType(line: string): string {
        if (line.startsWith('@')) {
            return 'A';
        } else if (line.startsWith('(')) {
            return 'L';
        } else {
            return 'C';
        }
    }

    private decodeAInstruction(line: string): string {
        const address = line.slice(1);
        let code;
        if (isNaN(parseInt(address))) {
            if (this.symbolTable[address] !== undefined) {
                code = this.symbolTable[address];
            } else {
                this.symbolTable[address] = this.nextAddress;
                code = this.nextAddress;
                this.nextAddress++;
            }
        } else {
            code = address;
        }

        if (code !== undefined) {
            return `0${parseInt(code.toString())
                .toString(2)
                .padStart(15, '0')}`;
        } else {
            return '';
        }
    }

    assignLabelAddress() {
        let lCounter = 0;
        this.parsedContent.forEach((line, index) => {
            if (line.startsWith('(')) {
                const label = line.slice(1, -1);
                const address = index - lCounter;
                this.symbolTable[label] = address;
                lCounter++;
            }
        });
    }

    private dest(dest: string): string {
        const destMap: { [key: string]: string } = {
            '': '000',
            M: '001',
            D: '010',
            MD: '011',
            A: '100',
            AM: '101',
            AD: '110',
            AMD: '111',
        };

        return destMap[dest];
    }

    private comp(comp: string): string {
        const compMap: { [key: string]: string } = {
            '0': '0101010',
            '1': '0111111',
            '-1': '0111010',
            D: '0001100',
            A: '0110000',
            '!D': '0001101',
            '!A': '0110001',
            '-D': '0001111',
            '-A': '0110011',
            'D+1': '0011111',
            'A+1': '0110111',
            'D-1': '0001110',
            'A-1': '0110010',
            'D+A': '0000010',
            'D-A': '0010011',
            'A-D': '0000111',
            'D&A': '0000000',
            'D|A': '0010101',
            M: '1110000',
            '!M': '1110001',
            '-M': '1110011',
            'M+1': '1110111',
            'M-1': '1110010',
            'D+M': '1000010',
            'D-M': '1010011',
            'M-D': '1000111',
            'D&M': '1000000',
            'D|M': '1010101',
        };

        return compMap[comp];
    }

    private jump(jump: string): string {
        const jumpMap: { [key: string]: string } = {
            '': '000',
            JGT: '001',
            JEQ: '010',
            JGE: '011',
            JLT: '100',
            JNE: '101',
            JLE: '110',
            JMP: '111',
        };

        return jumpMap[jump];
    }

    public async translate(): Promise<void> {
        await this.parse();

        if (this.parsedContent.length === 0) {
            console.log('No content to translate');
            return;
        }

        this.assignLabelAddress();

        this.parsedContent.forEach((line, index) => {
            const type = this.instrucationType(line);
            switch (type) {
                case 'A':
                    const address = this.decodeAInstruction(line);
                    if (address) {
                        this.code.push(address);
                    }
                    break;
                case 'C':
                    if (line !== '') {
                        let comp;
                        let dest;
                        let jump;
                        if (line.includes(';') && line.includes('=')) {
                            const [d, rest] = line.split('=');
                            const [c, j] = rest.split(';');
                            dest = d;
                            comp = c;
                            jump = j;
                        } else if (line.includes('=')) {
                            const [d, c] = line.split('=');
                            dest = d;
                            comp = c;
                        } else if (line.includes(';')) {
                            const [c, j] = line.split(';');
                            comp = c;
                            jump = j;
                        }

                        let code = '111';
                        code += comp ? this.comp(comp) : '0000000';
                        code += dest ? this.dest(dest) : '000';
                        code += jump ? this.jump(jump) : '000';
                        this.code.push(code);
                    }
                    break;
            }
        });
    }
}

const parser = new Assembler('Rect.asm');
parser.writeFile();
