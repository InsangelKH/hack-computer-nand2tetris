export type VMFileContent = string;

export interface IVMTranslator {
    file: VMFileContent;
    fileName: string;
    parsedContent: string[];
    code: string[];
    returnCounter: number;
    directory: boolean;
    translate(): Promise<void>;
    writeFile(): Promise<void>;
    loadBootstrapCode(): void;
}
