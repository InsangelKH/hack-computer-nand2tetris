package main

import (
	"fmt"
	"strings"
)

func NewCodeWriter() *CodeWriter {
	return &CodeWriter{
		labelIfCount:   0,
		labelWhileCount: 0,
	}
}

func (cw *CodeWriter) WriteFunction(declaration []Tokenized, classTable []Table, parameters [][]Tokenized, className string) string {
	functionType := declaration[0].Value
	paramsLength := 0

	for _, param := range parameters {
		commaIndex := findIndex(param, ",")
		if commaIndex != -1 {
			vars := filterTokens(param[2:len(param)-1], ",")
			paramsLength += len(vars)
		} else {
			paramsLength++
		}
	}

	if functionType == "constructor" {
		functionDec := fmt.Sprintf("function %s.%s %d", declaration[1].Value, declaration[2].Value, paramsLength)
		pushConstant := fmt.Sprintf("push constant %d", len(classTable))
		callMemory := "call Memory.alloc 1"
		popPointer := "pop pointer 0"

		return fmt.Sprintf("%s\n%s\n%s\n%s", functionDec, pushConstant, callMemory, popPointer)
	} else if functionType == "method" {
		functionDec := fmt.Sprintf("function %s.%s %d", className, declaration[2].Value, paramsLength)
		argument := "push argument 0"
		popPointer := "pop pointer 0"

		return fmt.Sprintf("%s\n%s\n%s", functionDec, argument, popPointer)
	} else {
		functionDec := fmt.Sprintf("function %s.%s %d", className, declaration[2].Value, paramsLength)
		return functionDec
	}
}

func (cw *CodeWriter) WriteCall(name string, args int) string {
	return fmt.Sprintf("call %s %d", name, args)
}

func (cw *CodeWriter) WritePush(pushType, value string) string {
	return fmt.Sprintf("push %s %s", pushType, value)
}

func (cw *CodeWriter) WritePop(popType, value string) string {
	return fmt.Sprintf("pop %s %s", popType, value)
}

func (cw *CodeWriter) WriteIfLabels() map[string]string {
	labels := map[string]string{
		"if":      fmt.Sprintf("if-goto IF_TRUE%d", cw.labelIfCount),
		"goto":    fmt.Sprintf("goto IF_FALSE%d", cw.labelIfCount),
		"labelIf": fmt.Sprintf("label IF_TRUE%d", cw.labelIfCount),
		"labelElse": fmt.Sprintf("label IF_FALSE%d", cw.labelIfCount),
		"gotoEnd": fmt.Sprintf("goto IF_END%d", cw.labelIfCount),
		"labelEnd": fmt.Sprintf("label IF_END%d", cw.labelIfCount),
	}
	cw.labelIfCount++
	return labels
}

func (cw *CodeWriter) WriteWhileLabels() map[string]string {
	labels := map[string]string{
		"labelStart": fmt.Sprintf("label WHILE_EXP%d", cw.labelWhileCount),
		"if":         fmt.Sprintf("if-goto WHILE_END%d", cw.labelWhileCount),
		"goto":       fmt.Sprintf("goto WHILE_EXP%d", cw.labelWhileCount),
		"labelEnd":   fmt.Sprintf("label WHILE_END%d", cw.labelWhileCount),
	}
	cw.labelWhileCount++
	return labels
}

func (cw *CodeWriter) TransformKind(kind string) string {
	switch kind {
	case "field":
		return "this"
	case "var":
		return "local"
	default:
		return kind
	}
}

func (cw *CodeWriter) WriteString(value string) string {
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("push constant %d\n", len(value)))
	builder.WriteString("call String.new 1\n")

	for _, char := range value {
		builder.WriteString(fmt.Sprintf("push constant %d\n", char))
		builder.WriteString("call String.appendChar 2\n")
	}

	return builder.String()
}
