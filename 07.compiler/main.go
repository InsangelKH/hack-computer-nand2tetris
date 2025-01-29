package main

import (
	"log"
	"os"
)

func main() {
	currentDir, err := os.Getwd()
    if err != nil {
        log.Fatal(err)
    }
	
	analyzer := NewAnalyzer(currentDir)

	err = analyzer.Compile()
}