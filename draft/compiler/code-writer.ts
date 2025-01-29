import { Table, Tokenized } from './types';

export class CodeWriter {
    labelIfCount: number;
    labelWhileCount: number;
    constructor() {
        this.labelIfCount = 0;
        this.labelWhileCount = 0;
    }

    public writeFunction(
        declaration: Tokenized[],
        classTable: Table[],
        subroutineTable: Table[],
        parameters: Tokenized[][],
        className: string
    ): string {
        const functionType = declaration[0].value;
        let paramsLength = 0;
        parameters.forEach((param) => {
            const commaIndex = param.findIndex((token) => token.value === ',');
            if (commaIndex !== -1) {
                const vars = param
                    .slice(2, param.length - 1)
                    .filter((token) => token.value !== ',');
                vars.forEach(() => {
                    paramsLength++;
                });
            } else {
                paramsLength++;
            }
        });
        if (functionType === 'constructor') {
            const functionDec = `function ${declaration[1].value}.${declaration[2].value} ${paramsLength}`;
            const pushConstant = `push constant ${classTable.length}`;
            const callMemory = `call Memory.alloc 1`;
            const popPointer = `pop pointer 0`;

            return `${functionDec}\n${pushConstant}\n${callMemory}\n${popPointer}`;
        } else if (functionType === 'method') {
            const functionDec = `function ${className}.${declaration[2].value} ${paramsLength}`;
            const argument = 'push argument 0';
            const popPointer = 'pop pointer 0';

            return `${functionDec}\n${argument}\n${popPointer}`;
        } else {
            const functionDec = `function ${className}.${declaration[2].value} ${paramsLength}`;
            return functionDec;
        }
    }

    writeCall(name: string, args: number): string {
        return `call ${name} ${args}`;
    }

    public writePush(type: string, value: string): string {
        return `push ${type} ${value}`;
    }

    public writePop(type: string, value: string): string {
        return `pop ${type} ${value}`;
    }

    public writeIfLabels(): {
        if: string;
        goto: string;
        labelIf: string;
        labelElse: string;
        gotoEnd: string;
        labelEnd: string;
    } {
        const labels = {
            if: `if-goto IF_TRUE${this.labelIfCount}`,
            goto: `goto IF_FALSE${this.labelIfCount}`,
            labelIf: `label IF_TRUE${this.labelIfCount}`,
            labelElse: `label IF_FALSE${this.labelIfCount}`,
            gotoEnd: `goto IF_END${this.labelIfCount}`,
            labelEnd: `label IF_END${this.labelIfCount}`,
        };
        this.labelIfCount++;

        return labels;
    }

    public writeWhileLabels(): {
        labelStart: string;
        if: string;
        goto: string;
        labelEnd: string;
    } {
        const labels = {
            labelStart: `label WHILE_EXP${this.labelWhileCount}`,
            if: `if-goto WHILE_END${this.labelWhileCount}`,
            goto: `goto WHILE_EXP${this.labelWhileCount}`,
            labelEnd: `label WHILE_END${this.labelWhileCount}`,
        };
        this.labelWhileCount++;

        return labels;
    }

    public transformKind(kind: string): string {
        switch (kind) {
            case 'field':
                return 'this';
            case 'var':
                return 'local';
            default:
                return kind;
        }
    }

    public writeString(value: string): string {
        return (
            `push constant ${value.length}\n` +
            `call String.new 1\n` +
            value
                .split('')
                .map(
                    (char) =>
                        `push constant ${char.charCodeAt(0)}\n` +
                        'call String.appendChar 2\n'
                )
                .join('')
        );
    }
}
