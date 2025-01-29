export type AsmFileContent = string;

export interface IAssembler {
    file: AsmFileContent;
    fileName: string;
    parsedContent: string[];
    code: string[];
    nextAddress: number;
    symbolTable: Record<string, number>;
    translate(): Promise<void>;
    writeFile(): Promise<void>;
}
