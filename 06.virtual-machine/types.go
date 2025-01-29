package main

type VMTranslator struct {
    file           string
    fileName       string
    parsedContent  []string
    code           []string
    returnCounter  int
    isDirectory    bool
}