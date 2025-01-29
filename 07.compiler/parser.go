package main

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func NewParser() *Parser {
	return &Parser{
		Content: []ParsedContent{},
	}
}

func (p *Parser) ReadFilesFromDirectory(directoryPath string) ([]ParsedContent, error) {
	files, err := os.ReadDir(directoryPath)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".jack" {
			parsedContent := ParsedContent{
				Filename: file.Name(),
				Content:  []string{},
			}

			filePath := filepath.Join(directoryPath, file.Name())
			fileBytes, err := os.ReadFile(filePath)
			if err != nil {
				return nil, err
			}
			fileContent := string(fileBytes)

			fileContent = p.preprocessContent(fileContent)

			lines := strings.Split(fileContent, "\n")
			for _, line := range lines {
				trimmedLine := strings.TrimSpace(line)
				if len(trimmedLine) > 0 {
					parsedContent.Content = append(parsedContent.Content, trimmedLine)
				}
			}

			p.Content = append(p.Content, parsedContent)
		}
	}

	return p.Content, nil
}

func (p *Parser) preprocessContent(fileContent string) string {
	fileContent = regexp.MustCompile(`/\*[\s\S]*?\*/`).ReplaceAllString(fileContent, "")
	
	fileContent = regexp.MustCompile(`//.*`).ReplaceAllString(fileContent, "")

	replacements := map[*regexp.Regexp]string{
		regexp.MustCompile(`([,;().])`)       : " $1 ",
		regexp.MustCompile(`\[(\d+)\]`)       : "[ $1 ]",
		regexp.MustCompile(`(\w)(\[)`)        : "$1 $2",
		regexp.MustCompile(`"([^"]*)"`)       : `" $1 "`,
		regexp.MustCompile(`(~)(\w)`)         : "$1 $2", 
		regexp.MustCompile(`(\w)(~)`)         : "$1 $2", 
		regexp.MustCompile(`(\w)([-+])`)      : "$1 $2",
		regexp.MustCompile(`([-+])(\w)`)      : "$1 $2",
		regexp.MustCompile(`(\])(\w)`)        : "$1 $2",
		regexp.MustCompile(`(\])(\[)`)        : "$1 $2",
		regexp.MustCompile(`(\])`)            : "$1 ",
		regexp.MustCompile(`(\[)([a-zA-Z])`)  : "$1 $2",
		regexp.MustCompile(`([a-zA-Z])(\])`)  : "$1 $2",
		regexp.MustCompile(`(\d)([^\d\s])`)   : "$1 $2",
		regexp.MustCompile(`(\[)(\w+)(])`)    : "$1  $2  $3",
		regexp.MustCompile(`([^\d\s])(\d)`)   : "$1 $2",
	}

	for regex, replacement := range replacements {
		fileContent = regex.ReplaceAllString(fileContent, replacement)
	}

	return fileContent
}