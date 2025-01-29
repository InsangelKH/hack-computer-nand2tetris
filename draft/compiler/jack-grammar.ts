export const keyword: Array<string> = [
    'class',
    'constructor',
    'function',
    'method',
    'field',
    'static',
    'var',
    'int',
    'char',
    'boolean',
    'void',
    'true',
    'false',
    'null',
    'this',
    'let',
    'do',
    'if',
    'else',
    'while',
    'return',
];

export const symbol: Array<string> = [
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    '.',
    ',',
    ';',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '<',
    '>',
    '=',
    '~',
];

export const integerConstant: RegExp = /\d+/;

export const stringConstant: RegExp = /".*"/;

export const identifier: RegExp = /[a-zA-Z_]\w*/;

export const classVarDec: Array<string> = ['static', 'field'];

export const types: Array<string> = ['int', 'char', 'boolean'];

export const subroutineDec: Array<string> = [
    'constructor',
    'function',
    'method',
];

export const statements: Array<string> = ['let', 'if', 'while', 'do', 'return'];

export const terms: Array<string | RegExp> = [
    identifier,
    integerConstant,
    stringConstant,
    'true',
    'false',
    'null',
    'this',
    '(',
    '-',
    '~',
];

export const operands: Array<string> = [
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '<',
    '>',
    '=',
];

export const unaryOperands: Array<string> = ['-', '~'];

export const operatingSystem: Array<string> = [
    'Keyboard',
    'Screen',
    'Memory',
    'Output',
    'Sys',
];

export function includesTerm(value: string): boolean {
    for (const term of terms) {
        if (typeof term === 'string') {
            if (term === value) {
                return true;
            }
        } else if (term instanceof RegExp) {
            if (term.test(value)) {
                return true;
            }
        }
    }
    return false;
}

export function findLast(
    array: Array<any>,
    findValue: any,
    condition: any
): any {
    for (let i = array.length - 1; i >= 0; i--) {
        if (condition(array[i], findValue)) {
            return array[i];
        }
    }
    return null;
}
