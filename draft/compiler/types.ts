export interface IParser {
    content: Array<ParsedContent>;
    readFilesFromDirectory(
        directoryPath: string
    ): Promise<Array<ParsedContent>>;
}

export interface ParsedContent {
    filename: string;
    content: Array<string>;
}

export interface ITokenizer {
    tokenize(token: string): { type: string; value: string | number } | string;
}

export interface Tokenized {
    type: string;
    value: string | number;
}

export interface TokenizedFile {
    filename: string;
    content: Array<Tokenized>;
}

export interface ICompilationEngine {
    updateFiles(tokenizedFiles: TokenizedFile[]): void;
    compile(tokenizedLines: Array<Tokenized>): void;
}

export interface IDivider {
    divideClassVarDecs(content: Tokenized[]): Tokenized[][];
    divideSubroutines(content: Tokenized[]): Tokenized[][];
    divideParameterList(content: Tokenized[]): Tokenized[][];
    divideSubroutineBody(content: Tokenized[]): Tokenized[];
    divideVarDecs(content: Tokenized[]): Tokenized[][];
    divideStatements(content: Tokenized[]): Tokenized[][];
    divideExpression(content: Tokenized[]): Tokenized[];
    divideIfStatements(content: Tokenized[]): ifStatements;
    divideWhileStatements(content: Tokenized[]): Tokenized[][];
}

export interface ifStatements {
    if: Tokenized[][];
    else: Tokenized[][];
}

export interface Table {
    name: string;
    type: string;
    kind: string;
    index: number;
}
