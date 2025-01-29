package main

type TokenizedFile struct {
	Filename string
	Content  []Tokenized
}

type Analyzer struct {
	parsedContent     []ParsedContent
	directoryPath     string
	parser            *Parser
	tokenizer         *Tokenizer
	tokenizedFiles    []TokenizedFile
	compilationEngine *CompilationEngine
}

type Table struct {
	Name  string
	Type  string
	Kind  string
	Index int
}

type CodeWriter struct {
	labelIfCount   int
	labelWhileCount int
}

type CompilationEngine struct {
	tokenizedFiles   []TokenizedFile
	divider          *Divider
	symbolTable      *SymbolTable
	codeWriter       *CodeWriter
	className        string
}

type IfStatements struct {
	If   [][]Tokenized
	Else [][]Tokenized
}

type Divider struct{}

type ParsedContent struct {
	Filename string
	Content  []string
}

type Parser struct {
	Content []ParsedContent
}

type SymbolTable struct {
	ClassTable      []Table
	SubroutineTable []Table
	Methods         []Table
}