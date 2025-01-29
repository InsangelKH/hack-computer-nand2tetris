import { IParser, ParsedContent } from './types';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export class Parser implements IParser {
    content: Array<ParsedContent>;

    constructor() {
        this.content = [];
    }

    public async readFilesFromDirectory(
        directoryPath: string
    ): Promise<Array<ParsedContent>> {
        const files = await fsPromises.readdir(directoryPath);
        await Promise.all(
            files.map(async (file) => {
                if (path.extname(file) === '.jack') {
                    const parsedContent: ParsedContent = {
                        filename: file,
                        content: [],
                    };

                    const filePath = path.join(directoryPath, file);
                    let fileContent = await fsPromises.readFile(
                        filePath,
                        'utf-8'
                    );
                    // console.log(fileContent);
                    fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, '');
                    fileContent = fileContent.replace(/\/\/.*/g, '');
                    fileContent = fileContent.replace(/([,;().])/g, ' $1 ');
                    fileContent = fileContent.replace(/\[(\d+)\]/g, '[ $1 ]');
                    fileContent = fileContent.replace(/(\w)(\[)/g, '$1 $2');
                    fileContent = fileContent.replace(/"([^"]*)"/g, '" $1 "');
                    fileContent = fileContent.replace(/(~)(?=\w)/g, '$1 ');
                    fileContent = fileContent.replace(/(?<=\w)(~)/g, ' $1');
                    fileContent = fileContent.replace(/(\w)([-+])/g, '$1 $2');
                    fileContent = fileContent.replace(/([-+])(\w)/g, '$1 $2');
                    fileContent = fileContent.replace(/(\])(\w)/g, '$1 $2');
                    fileContent = fileContent.replace(/(\])(\[)/g, '$1 $2');
                    fileContent = fileContent.replace(/(\])(?=\])/g, '$1 ');
                    fileContent = fileContent.replace(
                        /(\[)([a-zA-Z])/g,
                        '$1 $2'
                    );
                    fileContent = fileContent.replace(
                        /([a-zA-Z])(\])/g,
                        '$1 $2'
                    );
                    fileContent = fileContent.replace(
                        /(\d)([^\d\s])/g,
                        '$1 $2'
                    );
                    fileContent = fileContent.replace(
                        /(\[)(\w+)(])/g,
                        '$1  $2  $3'
                    );
                    fileContent = fileContent.replace(
                        /([^\d\s])(\d)/g,
                        '$1 $2'
                    );

                    const lines = fileContent.split('\n');
                    lines.forEach((line) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.length > 0) {
                            parsedContent.content.push(trimmedLine);
                        }
                    });

                    this.content.push(parsedContent);
                }
            })
        );
        return this.content;
    }
}
