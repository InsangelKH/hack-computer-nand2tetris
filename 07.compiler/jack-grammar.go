package main

import "regexp"

var keyword = []string{
    "class",
    "constructor",
    "function",
    "method",
    "field",
    "static",
    "var",
    "int",
    "char",
    "boolean",
    "void",
    "true",
    "false",
    "null",
    "this",
    "let",
    "do",
    "if",
    "else",
    "while",
    "return",
}

var symbol = []string{
    "{", "}", "(", ")", "[", "]", ".", ",", ";",
    "+", "-", "*", "/", "&", "|", "<", ">", "=", "~",
}

var integerConstant = regexp.MustCompile(`\d+`)

var stringConstant = regexp.MustCompile(`".*"`)

var identifier = regexp.MustCompile(`[a-zA-Z_]\w*`)

var classVarDec = []string{"static", "field"}

var types = []string{"int", "char", "boolean"}

var subroutineDec = []string{
    "constructor",
    "function",
    "method",
}

var statements = []string{"let", "if", "while", "do", "return"}

var terms = []interface{}{
    identifier,
    integerConstant,
    stringConstant,
    "true",
    "false",
    "null",
    "this",
    "(",
    "-",
    "~",
}

var operands = []string{
    "+", "-", "*", "/", "&", "|", "<", ">", "=",
}

var unaryOperands = []string{"-", "~"}

var operatingSystem = []string{
    "Keyboard", "Screen", "Memory", "Output", "Sys",
}