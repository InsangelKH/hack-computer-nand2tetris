import { CompilationEngine } from './compilation-engine';
import { Parser } from './parser';
import { Tokenizer } from './tokenizer';
import { ParsedContent, Tokenized, TokenizedFile } from './types';

export class Analyzer {
    parsedContent: Array<ParsedContent>;
    directoryPath: string;
    parser: Parser;
    tokenizer: Tokenizer;
    tokenizedFiles: TokenizedFile[];
    compilationEngine: CompilationEngine;

    constructor(diretoryPath: string) {
        this.parsedContent = [];
        this.directoryPath = diretoryPath;
        this.parser = new Parser();
        this.tokenizer = new Tokenizer();
        this.tokenizedFiles = [];
        this.compilationEngine = new CompilationEngine(this.tokenizedFiles);
    }

    public async initialize(): Promise<Array<ParsedContent>> {
        this.parsedContent = await this.parser.readFilesFromDirectory(
            this.directoryPath
        );
        return this.parsedContent;
    }

    public async prepareContent(): Promise<void> {
        await this.initialize();
        for (const content of this.parsedContent) {
            const tokenizedLines: Array<Tokenized> = [];
            for (const line of content.content) {
                const tokens = line.match(/"[^"]*"|\S+/g) || [];

                for (const token of tokens) {
                    const tokenized = this.tokenizer.tokenize(token);
                    if (typeof tokenized === 'string') {
                        return;
                    }

                    tokenizedLines.push(tokenized);
                }
            }
            this.tokenizedFiles.push({
                filename: content.filename,
                content: tokenizedLines,
            });
        }
    }

    public async compile(): Promise<void> {
        await this.prepareContent();
        this.compilationEngine.updateFiles(this.tokenizedFiles);
        this.compilationEngine.compile();
    }
}

const analyzer = new Analyzer(__dirname);

analyzer.compile();
