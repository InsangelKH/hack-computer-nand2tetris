import { findLast, types } from './jack-grammar';
import { Table, Tokenized } from './types';

export class SymbolTable {
    classTable: Table[];
    subroutineTable: Table[];
    methods: Table[];

    constructor() {
        this.classTable = [];
        this.subroutineTable = [];
        this.methods = [];
    }

    createClassTable(content: Array<Tokenized[]>): void {
        let index = 0;

        for (let i = 0; i < content.length; i++) {
            const line = content[i];
            const commaIndex = line.findIndex((token) => token.value === ',');

            if (commaIndex !== -1) {
                const vars = line
                    .slice(2, line.length - 1)
                    .filter((token) => token.value !== ',');

                for (let j = 0; j < vars.length; j++) {
                    this.classTable.push({
                        name: vars[j].value as string,
                        type: line[1].value as string,
                        kind: line[0].value as string,
                        index: index,
                    });
                    index++;
                }
            } else {
                this.classTable.push({
                    name: line[2].value as string,
                    type: line[1].value as string,
                    kind: line[0].value as string,
                    index: index,
                });
                index++;
            }
        }
    }

    resetSubroutineTable(): void {
        this.subroutineTable = [];
    }

    createSubroutineTable(
        content: Array<Tokenized[]>,
        type: string,
        classType: string
    ): void {
        if (type === 'method') {
            this.subroutineTable.push({
                name: 'this',
                type: classType,
                kind: 'argument',
                index: 0,
            });
        }

        for (let i = 0; i < content.length; i++) {
            const line = content[i];
            const commaIndex = line.findIndex((token) => token.value === ',');

            const type = line.find((token) =>
                types.includes(token.value as string)
            );
            const kind = line[0].value === 'var' ? 'var' : 'argument';
            if (commaIndex !== -1) {
                const vars = line
                    .slice(2, line.length - 1)
                    .filter((token) => token.value !== ',');

                for (let j = 0; j < vars.length; j++) {
                    const kindTable = findLast(
                        this.subroutineTable,
                        kind,
                        (table: Table, value: string) => table.kind === value
                    );
                    this.subroutineTable.push({
                        name: vars[j].value as string,
                        type: type?.value as string,
                        kind: kind,
                        index: kindTable ? kindTable.index + 1 : 0,
                    });
                }
            } else {
                const kindTable = findLast(
                    this.subroutineTable,
                    kind,
                    (table: Table, value: string) => table.kind === value
                );
                const name =
                    line.length > 2
                        ? (line[2].value as string)
                        : (line[1].value as string);
                const type =
                    line.length > 2
                        ? (line[1].value as string)
                        : (line[0].value as string);
                this.subroutineTable.push({
                    name: name,
                    type: type,
                    kind: kind,
                    index: kindTable ? kindTable.index + 1 : 0,
                });
            }
        }
    }

    createMethods(content: Array<Tokenized[]>): void {
        content.forEach((item, index) => {
            this.methods.push({
                name: item[2].value as string,
                type: item[1].value as string,
                kind: item[0].value as string,
                index: index,
            });
        });
    }
}
