import {
    classVarDec,
    operands,
    statements,
    subroutineDec,
    unaryOperands,
} from './jack-grammar';
import { IDivider, Tokenized, ifStatements } from './types';

export class Divider implements IDivider {
    divideClassVarDecs(content: Tokenized[]): Tokenized[][] {
        const classVarDecs: Tokenized[][] = [];
        let startIndex = 0;

        while (startIndex < content.length) {
            let keywordIndex = content.findIndex((item, index) => {
                return (
                    classVarDec.includes(item.value as string) &&
                    index >= startIndex
                );
            });

            if (keywordIndex === -1) {
                break;
            }

            let semicolonIndex = content.findIndex(
                (item, index) => item.value === ';' && index > keywordIndex
            );

            if (semicolonIndex === -1) {
                break;
            }

            const declaration = content.slice(keywordIndex, semicolonIndex + 1);

            classVarDecs.push(declaration);

            startIndex = semicolonIndex;
        }

        return classVarDecs;
    }

    divideSubroutines(content: Tokenized[]): Tokenized[][] {
        const subroutines: Tokenized[][] = [];
        let startIndex = 0;

        while (startIndex < content.length) {
            let keywordIndex = content.findIndex((item, index) => {
                return (
                    subroutineDec.includes(item.value as string) &&
                    index >= startIndex
                );
            });

            if (keywordIndex === -1) {
                break;
            }

            let closingBracketIndex = -1;
            let bracketCount = 0;
            outerLoop: for (let i = keywordIndex; i < content.length; i++) {
                if (content[i].value === '{') {
                    bracketCount++;
                } else if (content[i].value === '}') {
                    bracketCount--;
                    if (bracketCount === 0) {
                        closingBracketIndex = i;
                        break outerLoop;
                    }
                }
            }

            if (closingBracketIndex === -1) {
                break;
            }

            const subroutine = content.slice(
                keywordIndex,
                closingBracketIndex + 1
            );

            subroutines.push(subroutine);
            startIndex = closingBracketIndex;
        }

        return subroutines;
    }

    divideParameterList(content: Tokenized[]): Tokenized[][] {
        let openingBracketIndex = content.findIndex(
            (item) => item.value === '('
        );
        let closingBracketIndex = content.findIndex(
            (item, index) =>
                item.value === ')' && content[index + 1].value === '{'
        );

        const parameters = content.slice(
            openingBracketIndex + 1,
            closingBracketIndex
        );

        const list: Tokenized[][] = [];
        for (let i = 0; i < parameters.length; i++) {
            const comma = parameters.findIndex(
                (item, index) => item.value === ',' && index >= i
            );
            if (comma !== -1) {
                list.push(parameters.slice(i, comma));
                i = comma;
            } else {
                list.push(parameters.slice(i, parameters.length));
                break;
            }
        }
        return list;
    }

    divideSubroutineBody(content: Tokenized[]): Tokenized[] {
        let openingBracketIndex = content.findIndex(
            (item, index) =>
                item.value === '{' && content[index - 1].value === ')'
        );

        return content.slice(openingBracketIndex + 1, content.length - 1);
    }

    divideVarDecs(content: Tokenized[]): Tokenized[][] {
        const varDecs: Tokenized[][] = [];
        let startIndex = 0;

        while (startIndex < content.length) {
            let keywordIndex = content.findIndex((item, index) => {
                return item.value === 'var' && index >= startIndex;
            });

            if (keywordIndex === -1) {
                break;
            }

            let semicolonIndex = content.findIndex(
                (item, index) => item.value === ';' && index > keywordIndex
            );

            if (semicolonIndex === -1) {
                break;
            }

            const declaration = content.slice(keywordIndex, semicolonIndex + 1);
            varDecs.push(declaration);

            startIndex = semicolonIndex;
        }

        return varDecs;
    }

    divideStatements(content: Tokenized[]): Tokenized[][] {
        const result: Tokenized[][] = [];
        for (let i = 0; i < content.length; i++) {
            if (statements.includes(content[i].value as string)) {
                const type = content[i].value as string;

                switch (type) {
                    case 'let':
                    case 'do':
                    case 'return': {
                        let closingBracketIndex = content.findIndex(
                            (item, index) => item.value === ';' && index > i
                        );

                        if (closingBracketIndex === -1) {
                            break;
                        }

                        result.push(content.slice(i, closingBracketIndex + 1));
                        i = closingBracketIndex;
                        break;
                    }
                    case 'while': {
                        let openBracketCount = 0;
                        let closingBracketIndex = -1;
                        outerLoop: for (let j = i; j < content.length; j++) {
                            if (content[j].value === '{') {
                                openBracketCount++;
                            } else if (content[j].value === '}') {
                                openBracketCount--;
                                if (
                                    openBracketCount === 0 &&
                                    content[j + 1] !== undefined &&
                                    content[j + 1].value !== 'else'
                                ) {
                                    closingBracketIndex = j;
                                    break outerLoop;
                                } else if (openBracketCount === 0) {
                                    closingBracketIndex = j;
                                    break outerLoop;
                                }
                            }
                        }

                        result.push(content.slice(i, closingBracketIndex + 1));
                        i = closingBracketIndex;
                        break;
                    }
                    case 'if': {
                        let openBracketCount = 0;
                        let closingBracketIndex = -1;
                        outerLoop: for (let j = i; j < content.length; j++) {
                            if (content[j].value === '{') {
                                openBracketCount++;
                            } else if (content[j].value === '}') {
                                openBracketCount--;
                                if (
                                    openBracketCount === 0 &&
                                    content[j + 1] !== undefined &&
                                    content[j + 1].value !== 'else'
                                ) {
                                    closingBracketIndex = j;
                                    break outerLoop;
                                } else if (
                                    openBracketCount === 0 &&
                                    content[j + 1] == undefined
                                ) {
                                    closingBracketIndex = j;
                                    break outerLoop;
                                }
                            }
                        }
                        result.push(content.slice(i, closingBracketIndex + 1));
                        i = closingBracketIndex;
                        break;
                    }
                }
            }
        }

        return result;
    }

    divideExpression(content: Tokenized[]): Tokenized[] {
        const openBracket = content.findIndex((item) => item.value === '(');
        let closingBracket = -1;
        let openBracketCount = 0;
        for (let i = openBracket; i < content.length; i++) {
            if (content[i].value === '(') {
                openBracketCount++;
            } else if (content[i].value === ')') {
                openBracketCount--;
                if (openBracketCount === 0) {
                    closingBracket = i;
                    break;
                }
            }
        }
        return content.slice(openBracket + 1, closingBracket);
    }

    divideIfStatements(content: Tokenized[]): ifStatements {
        const result: ifStatements = {
            if: [],
            else: [],
        };

        let openBracketCount = 0;
        let closingBracket = -1;
        const openBracket = content.findIndex((item) => item.value === '{');
        for (let i = 0; i < content.length; i++) {
            if (content[i].value === '{') {
                openBracketCount++;
            }
            if (content[i].value === '}') {
                openBracketCount--;
                if (openBracketCount === 0) {
                    closingBracket = i;
                    break;
                }
            }
        }

        const ifStaments = this.divideStatements(
            content.slice(openBracket + 1, closingBracket)
        );
        result.if = ifStaments;

        let elseIndex = -1;
        let openElseBracketCount = 0;
        for (let i = closingBracket + 1; i < content.length; i++) {
            if (content[i].value === '{') {
                openElseBracketCount++;
            }

            if (content[i].value === '}') {
                openElseBracketCount--;
            }

            if (content[i].value === 'else' && openElseBracketCount === 0) {
                elseIndex = i;
                break;
            }
        }

        if (elseIndex !== -1) {
            let openBracketCount = 0;
            const openBracketElse = content.findIndex((item, index) => {
                return item.value === '{' && index > elseIndex;
            });
            let closingBracketElse = -1;
            for (let i = elseIndex; i < content.length; i++) {
                if (content[i].value === '{') {
                    openBracketCount++;
                }
                if (content[i].value === '}') {
                    openBracketCount--;
                    if (openBracketCount === 0) {
                        closingBracketElse = i;
                        break;
                    }
                }
            }
            const elseStatements = this.divideStatements(
                content.slice(openBracketElse + 1, closingBracketElse)
            );
            result.else = elseStatements;
        }
        return result;
    }

    divideWhileStatements(content: Tokenized[]): Tokenized[][] {
        const openBracket = content.findIndex((item) => item.value === '{');
        let closingBracket = -1;
        let openBracketCount = 0;
        for (let i = openBracket; i < content.length; i++) {
            if (content[i].value === '{') {
                openBracketCount++;
            } else if (content[i].value === '}') {
                openBracketCount--;
                if (openBracketCount === 0) {
                    closingBracket = i;
                    break;
                }
            }
        }

        const whileStatements = this.divideStatements(
            content.slice(openBracket + 1, closingBracket)
        );

        return whileStatements;
    }

    divideTerms(content: Tokenized[]): Tokenized[][] {
        const result: Tokenized[][] = [];
        if (content.some((item) => item.value === '.')) {
            result.push(content);
            return result;
        }
        // else if (
        //     content.some((item) => item.value === '[') &&
        //     content.length === 4
        // ) {
        //     result.push(content);
        //     return result;
        // }

        for (let i = 0; i < content.length; i++) {
            const token = content[i];
            if (
                operands.includes(token.value as string) ||
                unaryOperands.includes(token.value as string)
            ) {
                const token = content[i];
                result.push([token]);
                continue;
            }

            if (token.value === '(') {
                let closingBracket = -1;
                let openBracketCount = 0;

                for (let j = i; j < content.length; j++) {
                    if (content[j].value === '(') {
                        openBracketCount++;
                    } else if (content[j] && content[j].value === ')') {
                        openBracketCount--;
                        if (openBracketCount === 0) {
                            closingBracket = j;
                            break;
                        }
                    }
                }
                result.push(content.slice(i, closingBracket + 1));
                i = closingBracket;
                continue;
            } else if (token.value === '[') {
                let closingBracket = -1;
                let openBracketCount = 0;

                for (let j = i; j < content.length; j++) {
                    if (content[j].value === '[') {
                        openBracketCount++;
                    } else if (content[j].value === ']') {
                        openBracketCount--;
                        if (openBracketCount === 0) {
                            closingBracket = j;
                            break;
                        }
                    }
                }
                result.push(content.slice(i, closingBracket + 1));
                i = closingBracket;
                continue;
            }

            result.push([token]);
        }

        return result;
    }

    divideVarTerms(content: Tokenized[]): Tokenized[][] {
        const result: Tokenized[][] = [];
        if (!content.some((item) => operands.includes(item.value as string))) {
            return [content];
        }
        for (let i = 0; i < content.length; i++) {
            const token = content[i];

            if (operands.includes(token.value as string)) {
                result.push([token]);

                if (content[i + 1].value === '(') {
                    let closingBracket = -1;
                    let openBracketCount = 0;

                    for (let j = i + 1; j < content.length; j++) {
                        if (content[j].value === '(') {
                            openBracketCount++;
                        } else if (content[j].value === ')') {
                            openBracketCount--;
                            if (openBracketCount === 0) {
                                closingBracket = j;
                                break;
                            }
                        }
                    }

                    result.push(content.slice(i + 1, closingBracket + 1));
                    i = closingBracket;
                }

                // const nextOperand = content.findIndex(
                //     (item, index) =>
                //         operands.includes(item.value as string) && index > i
                // );
                // if (nextOperand === -1) {
                //     if (i !== content.length - 1) {
                //         result.push(content.slice(i + 1, content.length));
                //     }
                //     break;
                // } else {
                //     result.push(content.slice(i + 1, nextOperand));
                //     i = nextOperand;
                // }
            } else if (token.value === '(') {
                let closingBracket = -1;
                let openBracketCount = 0;

                for (let j = i; j < content.length; j++) {
                    if (content[j].value === '(') {
                        openBracketCount++;
                    } else if (content[j].value === ')') {
                        openBracketCount--;
                        if (openBracketCount === 0) {
                            closingBracket = j;
                            break;
                        }
                    }
                }
                result.push(content.slice(i, closingBracket + 1));
                i = closingBracket;
            } else if (token.value === '[') {
                let closingBracket = -1;
                let openBracketCount = 0;

                for (let j = i; j < content.length; j++) {
                    if (content[j].value === '[') {
                        openBracketCount++;
                    } else if (content[j].value === ']') {
                        openBracketCount--;
                        if (openBracketCount === 0) {
                            closingBracket = j;
                            break;
                        }
                    }
                }
                result.push(content.slice(i, closingBracket + 1));
                // console.log('content', content);
                // console.log('slice', content.slice(i, closingBracket + 1));
                i = closingBracket;
            } else {
                result.push([token]);
            }
        }

        return result;
    }

    divideExpressionList(content: Tokenized[]): Tokenized[][] {
        const result: Tokenized[][] = [];
        const ifComma = content.some((item) => item.value === ',');
        if (!ifComma && content.length) {
            result.push(content);
        } else {
            for (let i = 0; i < content.length; i++) {
                const commaIndex = content.findIndex(
                    (item, index) => item.value === ',' && index >= i
                );

                if (commaIndex !== -1) {
                    result.push(content.slice(i, commaIndex));
                    result.push([content[commaIndex]]);
                    i = commaIndex;
                } else {
                    if (i !== content.length) {
                        result.push(content.slice(i, content.length));
                        break;
                    }
                }
            }
        }

        return result;
    }

    shuffleTerms(content: Tokenized[][]): Tokenized[][] {
        const operandIndexes = content
            .map((item, index) => {
                if (
                    operands.includes(item[0].value as string) ||
                    unaryOperands.includes(item[0].value as string)
                ) {
                    return index;
                }
            })
            .filter((item) => item !== undefined);
        if (operandIndexes.length !== 0) {
            operandIndexes.forEach((index) => {
                const operand = content[index!];
                const right = content[index! + 1];
                content[index!] = right;
                content[index! + 1] = operand;
            });
        }
        return content;
    }
}
