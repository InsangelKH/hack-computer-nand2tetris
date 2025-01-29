package main

import (
	"regexp"
)

func NewAnalyzer(directoryPath string) *Analyzer {
	var tokenizedFiles []TokenizedFile

	parser := NewParser()
	tokenizer := NewTokenizer()
	compilationEngine := NewCompilationEngine(tokenizedFiles)

	return &Analyzer{
		parsedContent:     []ParsedContent{},
		directoryPath:     directoryPath,
		parser:            parser,
		tokenizer:         tokenizer,
		tokenizedFiles:    tokenizedFiles,
		compilationEngine: compilationEngine,
	}
}

func (a *Analyzer) Initialize() ([]ParsedContent, error) {
	var err error
	a.parsedContent, err = a.parser.ReadFilesFromDirectory(a.directoryPath)
	return a.parsedContent, err
}

func (a *Analyzer) PrepareContent() error {
	_, err := a.Initialize()
	if err != nil {
		return err
	}

	for _, content := range a.parsedContent {
		tokenizedLines := []Tokenized{}
		
		re := regexp.MustCompile(`"[^"]*"|\S+`)

		for _, line := range content.Content {
			tokens := re.FindAllString(line, -1)
			
			for _, token := range tokens {
				tokenized, err := a.tokenizer.Tokenize(token)
				if err != nil {
					return err
				}

				tokenizedLines = append(tokenizedLines, tokenized)
			}
		}

		a.tokenizedFiles = append(a.tokenizedFiles, TokenizedFile{
			Filename: content.Filename,
			Content:  tokenizedLines,
		})
	}

	return nil
}

func (a *Analyzer) Compile() error {
	err := a.PrepareContent()
	if err != nil {
		return err
	}

	a.compilationEngine.UpdateFiles(a.tokenizedFiles)
	return a.compilationEngine.Compile()
}