import {
    keyword,
    symbol,
    identifier,
    integerConstant,
    stringConstant,
} from './jack-grammar';
import { ITokenizer, Tokenized } from './types';

export class Tokenizer implements ITokenizer {
    private tokenType(token: string): string {
        if (keyword.includes(token)) {
            return 'KEYWORD';
        } else if (symbol.includes(token)) {
            return 'SYMBOL';
        } else if (integerConstant.test(token)) {
            return 'INT_CONST';
        } else if (stringConstant.test(token)) {
            return 'STRING_CONST';
        } else if (identifier.test(token)) {
            return 'IDENTIFIER';
        } else if (token === '"') {
            return 'STRING_CONST';
        } else {
            throw new Error(`Invalid token: ${token}`);
        }
    }

    private keyword(token: string): string {
        return token;
    }

    private symbol(token: string): string {
        return token;
    }

    private identifier(token: string): string {
        return token;
    }

    private intVal(token: string): number {
        return parseInt(token, 10);
    }

    private stringVal(token: string): string {
        return token.slice(1, token.length - 1);
    }

    public tokenize(token: string): Tokenized | string {
        const type = this.tokenType(token);
        switch (type) {
            case 'KEYWORD':
                return { type, value: this.keyword(token) };
            case 'SYMBOL':
                return { type, value: this.symbol(token) };
            case 'INT_CONST':
                return { type, value: this.intVal(token) };
            case 'STRING_CONST':
                return { type, value: this.stringVal(token) };
            case 'IDENTIFIER':
                return { type, value: this.identifier(token) };
            default:
                return 'Invalid token';
        }
    }
}
