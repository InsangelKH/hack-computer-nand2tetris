import { CodeWriter } from './code-writer';
import { Divider } from './divider';
import { operands, operatingSystem, unaryOperands } from './jack-grammar';
import { SymbolTable } from './symbol-table';
import { Tokenized, TokenizedFile } from './types';
import { promises as fs } from 'fs';

export class CompilationEngine {
    tokenizedFiles: TokenizedFile[];
    divider: Divider;
    symbolTable: SymbolTable;
    codeWriter: CodeWriter;
    className: string;
    constructor(tokenizedFiles: TokenizedFile[]) {
        this.tokenizedFiles = tokenizedFiles;
        this.divider = new Divider();
        this.symbolTable = new SymbolTable();
        this.codeWriter = new CodeWriter();
        this.className = '';
    }

    public updateFiles(tokenizedFiles: TokenizedFile[]): void {
        this.tokenizedFiles = tokenizedFiles;
    }

    public async compile(): Promise<void> {
        await Promise.all(
            this.tokenizedFiles.map(async (file) => {
                this.className = file.filename.replace('.jack', '');
                const vm = this.compileClass(file.content);
                await fs.writeFile(
                    `${file.filename.replace('.jack', '')}.vm`,
                    vm,
                    'utf8'
                );
                this.className = '';
            })
        );
    }

    private compileClass(content: Tokenized[]): string {
        try {
            let vmCode: string = '';
            const curlyBracket = content.findIndex(
                (token) => token.value === '{'
            );
            const classBody = content.slice(
                curlyBracket + 1,
                content.length - 1
            );

            const classVarDecs: Array<Tokenized[]> =
                this.divider.divideClassVarDecs(classBody);

            this.symbolTable.createClassTable(classVarDecs);

            const subroutines: Array<Tokenized[]> =
                this.divider.divideSubroutines(classBody);

            this.symbolTable.createMethods(subroutines);
            subroutines.forEach((subroutine) => {
                vmCode += this.compileSubroutine(subroutine);
            });

            return vmCode;
        } catch (error) {
            console.error('complileClass error: ', error);
            return '';
        }
    }

    private compileSubroutine(subroutine: Tokenized[]): string {
        try {
            let vmCode: string = '';

            this.symbolTable.resetSubroutineTable();

            const subroutineBody =
                this.divider.divideSubroutineBody(subroutine);

            const varDec = this.divider.divideVarDecs(subroutineBody);
            const functionCode = this.codeWriter.writeFunction(
                subroutine.slice(0, 3),
                this.symbolTable.classTable,
                this.symbolTable.subroutineTable,
                varDec,
                this.className
            );

            const subroutineType = subroutine[0].value as string;
            const parameters = this.divider.divideParameterList(subroutine);
            const body = this.compileSubroutineBody(
                subroutineBody,
                parameters,
                subroutineType
            );

            vmCode += `// function ${subroutine[0].value}.${subroutine[1].value}.${subroutine[2].value}\n`;
            vmCode += `${functionCode}\n\n`;
            vmCode += `${body}`;
            return vmCode;
        } catch (error) {
            console.error('compileSubroutine error: ', error);
            return '';
        }
    }

    private compileSubroutineBody(
        content: Tokenized[],
        parameters: Tokenized[][],
        type: string
    ): string {
        try {
            let vmCode: string = '';
            const varDec = this.divider.divideVarDecs(content);
            this.symbolTable.createSubroutineTable(
                [...parameters, ...varDec],
                type,
                this.className
            );

            const statements = this.divider.divideStatements(content);
            if (statements.length) {
                const statement = this.compileStatements(statements, type);
                vmCode += `${statement}`;
            }
            return vmCode;
        } catch (error) {
            console.error('compileSubroutineBody error: ', error);
            return '';
        }
    }

    private compileStatements(
        statements: Tokenized[][],
        subroutineType: string
    ): string {
        try {
            let vmCode: string = '';
            statements.forEach((statement) => {
                const type = statement[0].value as string;
                switch (type) {
                    case 'let':
                        const codeLet = this.compileLet(statement);
                        vmCode += `// let ${statement[1].value}\n`;
                        vmCode += `${codeLet}\n\n`;
                        break;
                    case 'if':
                        const codeIf = this.compileIf(
                            statement,
                            subroutineType
                        );
                        vmCode += `// if\n`;
                        vmCode += `${codeIf}\n\n`;
                        break;
                    case 'while':
                        vmCode += `// while\n`;
                        vmCode += `${this.compileWhile(
                            statement,
                            subroutineType
                        )}\n\n`;
                        break;
                    case 'do':
                        const codeDo = this.compileDo(
                            statement,
                            subroutineType
                        );
                        vmCode += `// do\n`;
                        vmCode += `${codeDo}\n\n`;
                        break;
                    case 'return':
                        const codeReturn = this.compileReturn(statement);
                        vmCode += `// return\n`;
                        vmCode += `${codeReturn}\n\n`;
                        break;
                    default:
                        break;
                }
            });

            return vmCode;
        } catch (error) {
            console.error('compileStatements error: ', error);
            return '';
        }
    }

    private compileLet(content: Tokenized[]): string {
        try {
            let vmCode: string = '';

            const declaration = content.slice(
                0,
                content.findIndex((item) => item.value === '=')
            );

            const isArray = declaration.some((token) => token.value === '[');

            const commonTable = this.symbolTable.classTable.concat(
                this.symbolTable.subroutineTable
            );

            const name = content[1].value as string;
            const popOptions: { kind: string | null; index: number } = {
                kind: null,
                index: 0,
            };
            const checkTable = commonTable.find((item) => item.name === name);

            if (checkTable) {
                popOptions.kind = checkTable.kind;
                popOptions.index = checkTable.index;
            }

            for (let i = 0; i < content.length; i++) {
                const token = content[i];
                switch (token.type) {
                    case 'SYMBOL':
                        if (token.value === '=') {
                            const semiColonIndex = content.findIndex(
                                (item) => item.value === ';'
                            );
                            vmCode += this.compileExpression(
                                content.slice(i + 1, semiColonIndex),
                                'let'
                            );
                            i = semiColonIndex - 1;
                        } else if (token.value === '[') {
                            let closingBracketIndex = -1;
                            let openingBracketCount = 1;
                            for (let j = i + 1; j < content.length; j++) {
                                if (content[j].value === '[') {
                                    openingBracketCount++;
                                } else if (content[j].value === ']') {
                                    openingBracketCount--;
                                    if (openingBracketCount === 0) {
                                        closingBracketIndex = j;
                                        break;
                                    }
                                }
                            }

                            const namePush = this.codeWriter.writePush(
                                this.codeWriter.transformKind(
                                    popOptions.kind as string
                                ),
                                popOptions.index.toString()
                            );
                            const expression = this.compileExpression(
                                content.slice(i + 1, closingBracketIndex),
                                'let'
                            );
                            vmCode += `${expression}\n${namePush}\nadd\n`;
                            i = closingBracketIndex;
                        }
                        break;
                }
            }

            if (isArray) {
                vmCode += `${this.codeWriter.writePop('temp', '0')}\n`;
            }

            if (typeof popOptions.kind === 'string') {
                const kind = this.codeWriter.transformKind(popOptions.kind);
                const code = this.codeWriter.writePop(
                    kind,
                    popOptions.index.toString()
                );
                vmCode += `${code}\n`;
            }

            if (isArray) {
                vmCode += `${this.codeWriter.writePush('temp', '0')}\n`;
                vmCode += `${this.codeWriter.writePop('that', '0')}\n`;
            }
            // console.log('vmCode: ', vmCode);
            return vmCode;
        } catch (error) {
            console.error('compileLet error: ', error);
            return '';
        }
    }

    private compileIf(content: Tokenized[], subroutineType: string): string {
        try {
            let vmCode: string = '';
            const expression = this.divider.divideExpression(content);
            const labels = this.codeWriter.writeIfLabels();
            if (expression.length) {
                const exp = this.compileExpression(expression, 'if');
                vmCode += `${exp}\n`;
            }
            const statements = this.divider.divideIfStatements(content);
            const ifStatements = this.compileStatements(
                statements.if,
                subroutineType
            );
            vmCode += `${labels.if}\n${labels.goto}\n`;
            vmCode += `${labels.labelIf}\n`;
            vmCode += `${ifStatements}`;
            const elseCheck = content.some((token) => token.value === 'else');
            if (elseCheck) {
                vmCode += `${labels.gotoEnd}\n`;
                vmCode += `${labels.labelElse}\n`;
                const elseStatements = this.compileStatements(
                    statements.else,
                    subroutineType
                );
                vmCode += `${elseStatements}`;
                vmCode += `${labels.labelEnd}\n`;
            } else {
                vmCode += `${labels.labelEnd}\n`;
            }
            return vmCode;
        } catch (error) {
            console.error('compileIf error: ', error);
            return '';
        }
    }

    private compileWhile(content: Tokenized[], subroutineType: string): string {
        try {
            let vmCode: string = '';
            const labels = this.codeWriter.writeWhileLabels();
            vmCode += `${labels.labelStart}\n`;
            const expression = this.divider.divideExpression(content);
            if (expression.length) {
                const exp = this.compileExpression(expression, 'while');
                vmCode += `${exp}`;
                vmCode += 'not\n';
            }
            vmCode += `${labels.if}\n`;

            const statements = this.divider.divideWhileStatements(content);
            if (statements.length) {
                const whileStatements = this.compileStatements(
                    statements,
                    subroutineType
                );
                vmCode += `${whileStatements}`;
            }
            vmCode += `${labels.goto}\n${labels.labelEnd}\n`;

            return vmCode;
        } catch (error) {
            console.error('compileWhile error: ', error);
            return '';
        }
    }

    private compileDo(content: Tokenized[], subroutineType: string): string {
        try {
            let vmCode: string = '';
            const expressionList = this.divider.divideExpression(content);
            let caller;
            let name;
            let length = 0;
            const commonTable = this.symbolTable.classTable.concat(
                this.symbolTable.subroutineTable
            );
            const method = commonTable.find(
                (item) => item.name === content[1].value
            );

            if (method && method.kind === 'field') {
                vmCode += `${this.codeWriter.writePush('this', '0')}\n`;
                caller = content[1].value as string;
                name = content[3].value as string;
                length++;
            } else {
                const osName = operatingSystem.includes(
                    content[1].value as string
                );

                if (osName) {
                    caller = content[1].value as string;
                    name = content[3].value as string;
                } else {
                    vmCode += `${this.codeWriter.writePush('pointer', '0')}\n`;
                    caller = this.className;
                    name = content[1].value as string;
                    length++;
                }
            }
            if (expressionList.length) {
                const expressionCode =
                    this.compileExpressionList(expressionList);
                vmCode += `${expressionCode.code}`;
                length += expressionCode.args;
            }

            vmCode += `${this.codeWriter.writeCall(
                `${caller}.${name}`,
                length
            )}\n`;
            vmCode += `${this.codeWriter.writePop('temp', '0')}\n`;
            return vmCode;
        } catch (error) {
            console.error('compileDo error: ', error);
            return '';
        }
    }

    private compileReturn(content: Tokenized[]): string {
        try {
            let vmCode: string = '';
            const expressions = content.slice(1, content.length - 1);
            if (expressions.length) {
                const expression = this.compileExpression(
                    expressions,
                    'return'
                );
                vmCode += `${expression}\nreturn\n`;
            } else {
                vmCode += 'push constant 0\nreturn\n';
            }

            return vmCode;
        } catch (error) {
            console.error('compileReturn error: ', error);
            return '';
        }
    }

    private compileExpression(content: Tokenized[], from: string): string {
        try {
            let vmCode: string = '';
            let terms: Tokenized[][] = [];
            if (from === 'let') {
                terms = this.divider.divideVarTerms(content);
            } else {
                terms = this.divider.divideTerms(content);
            }

            terms = this.divider.shuffleTerms(terms);
            outerLoop: for (let i = 0; i < terms.length; i++) {
                const term = terms[i];
                if (
                    term[0] &&
                    terms.length == 2 &&
                    unaryOperands.includes(terms[1][0].value as string)
                ) {
                    vmCode += `${this.compileTerm(terms[0])}\n`;
                    switch (terms[1][0].value as string) {
                        case '-':
                            vmCode += 'neg\n';
                            break;
                        case '~':
                            vmCode += 'not\n';
                            break;
                    }

                    break outerLoop;
                } else if (
                    term[0] &&
                    operands.includes(term[0].value as string)
                ) {
                    let value = term[0].value as string;
                    switch (value) {
                        case '<':
                            vmCode += 'lt\n';
                            break;
                        case '>':
                            vmCode += 'gt\n';
                            break;
                        case '&':
                            vmCode += 'and\n';
                            break;
                        case '|':
                            vmCode += 'or\n';
                            break;
                        case '=':
                            vmCode += 'eq\n';
                            break;
                        case '+':
                            vmCode += 'add\n';
                            break;
                        case '-':
                            vmCode += 'sub\n';
                            break;
                        case '*':
                            vmCode += 'call Math.multiply 2\n';
                            break;
                        case '/':
                            vmCode += 'call Math.divide 2\n';
                            break;
                    }
                } else if (term[0] && term[0].value === '(') {
                    const termVm = this.compileTerm(term);
                    vmCode += `${termVm}\n`;
                } else {
                    const termVm = this.compileTerm(term);
                    vmCode += `${termVm}\n`;
                }
            }

            return vmCode;
        } catch (error) {
            console.error('compileExpression error: ', error);
            return '';
        }
    }

    private compileTerm(content: Tokenized[]): string {
        try {
            let vmCode: string = '';
            for (let i = 0; i < content.length; i++) {
                const token = content[i];
                switch (token.type) {
                    case 'IDENTIFIER':
                        if (content[i + 1] && content[i + 1].value === '(') {
                            let closingBracketIndex = -1;
                            let openingBracketCount = 0;
                            for (let j = i + 1; j < content.length; j++) {
                                if (content[j].value === '(') {
                                    openingBracketCount++;
                                } else if (content[j].value === ')') {
                                    openingBracketCount--;
                                    if (openingBracketCount === 0) {
                                        closingBracketIndex = j;
                                        break;
                                    }
                                }
                            }
                            const expressionList = this.compileExpressionList(
                                content.slice(i + 2, closingBracketIndex)
                            );
                            vmCode += `${expressionList.code}`;
                            vmCode += this.codeWriter.writeCall(
                                `${content[i - 2].value}.${token.value}`,
                                expressionList.args
                            );

                            i = closingBracketIndex;
                        } else {
                            const commonTable =
                                this.symbolTable.classTable.concat(
                                    this.symbolTable.subroutineTable
                                );
                            const tableIndex = commonTable.findIndex(
                                (item) => item.name === token.value
                            );
                            if (tableIndex !== -1) {
                                const table = commonTable[tableIndex];
                                const kind = this.codeWriter.transformKind(
                                    table.kind
                                );
                                vmCode += this.codeWriter.writePush(
                                    kind,
                                    table.index.toString()
                                );
                            }
                        }
                        break;
                    case 'KEYWORD':
                        if (token.value === 'true') {
                            vmCode += `${this.codeWriter.writePush(
                                'constant',
                                '0'
                            )}\n`;
                            vmCode += 'not';
                        } else if (token.value === 'false') {
                            vmCode += `${this.codeWriter.writePush(
                                'constant',
                                '0'
                            )}`;
                        } else if (token.value === 'null') {
                            vmCode += `${this.codeWriter.writePush(
                                'constant',
                                '0'
                            )}`;
                        } else if (token.value === 'this') {
                            vmCode += `${this.codeWriter.writePush(
                                'pointer',
                                '0'
                            )}`;
                        }
                        break;
                    case 'SYMBOL':
                        if (
                            operands.includes(token.value as string) ||
                            unaryOperands.includes(token.value as string)
                        ) {
                            break;
                        } else if (token.value === '(') {
                            let closingBracketIndex = -1;
                            let openingBracketCount = 1;
                            for (let j = i + 1; j < content.length; j++) {
                                if (content[j].value === '(') {
                                    openingBracketCount++;
                                } else if (content[j].value === ')') {
                                    openingBracketCount--;
                                    if (openingBracketCount === 0) {
                                        closingBracketIndex = j;
                                        break;
                                    }
                                }
                            }

                            if (closingBracketIndex === -1) {
                                break;
                            }

                            const expression = this.compileExpression(
                                content.slice(i + 1, closingBracketIndex),
                                'term'
                            );
                            vmCode += `${expression}`;

                            i = closingBracketIndex;
                            break;
                        } else if (token.value === '[') {
                            let closingBracketIndex = -1;
                            let openingBracketCount = 1;
                            for (let j = i + 1; j < content.length; j++) {
                                if (content[j].value === '[') {
                                    openingBracketCount++;
                                } else if (content[j].value === ']') {
                                    openingBracketCount--;
                                    if (openingBracketCount === 0) {
                                        closingBracketIndex = j;
                                        break;
                                    }
                                }
                            }
                            const expression = this.compileExpression(
                                content.slice(i + 1, closingBracketIndex),
                                'term'
                            );

                            vmCode += `\n${expression}\nadd\npop pointer 1\npush that 0`;
                            i = closingBracketIndex;
                            break;
                        } else {
                            if (
                                content[i + 1] &&
                                content[i + 1].value === '('
                            ) {
                                const closingBracketIndex = content.findIndex(
                                    (item) => item.value === ')'
                                );
                                const expression = this.compileExpression(
                                    content.slice(i + 1, closingBracketIndex),
                                    'term'
                                );

                                i = closingBracketIndex;
                            }
                            break;
                        }
                    case 'STRING_CONST':
                        const string = this.codeWriter.writeString(
                            token.value as string
                        );
                        vmCode += `${string}`;
                        break;
                    case 'INT_CONST':
                        const code = this.codeWriter.writePush(
                            'constant',
                            token.value as string
                        );
                        vmCode += `${code}`;
                        break;
                }
            }

            return vmCode;
        } catch (error) {
            console.error('compileTerm error: ', error);
            return '';
        }
    }

    private compileExpressionList(content: Tokenized[]): {
        code: string;
        args: number;
    } {
        try {
            let vmCode: string = '';
            let counter: number = 0;
            const list = this.divider.divideExpressionList(content);
            list.forEach((expression) => {
                if (expression[0].value !== ',') {
                    const exp = this.compileExpression(
                        expression,
                        'expressionList'
                    );
                    vmCode += `${exp}`;
                    counter++;
                }
            });
            return {
                code: vmCode,
                args: counter,
            };
        } catch (error) {
            console.error('compileExpressionList error: ', error);
            return {
                code: '',
                args: 0,
            };
        }
    }
}
