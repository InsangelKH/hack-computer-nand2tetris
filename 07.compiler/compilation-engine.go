package main

import (
	"fmt"
	"log"
	"os"
	"slices"
	"strconv"
	"strings"
)

func NewCompilationEngine(tokenizedFiles []TokenizedFile) *CompilationEngine {
	return &CompilationEngine{
		tokenizedFiles:   tokenizedFiles,
		divider:          NewDivider(),
		symbolTable:      NewSymbolTable(),
		codeWriter:       NewCodeWriter(),
		className:        "",
	}
}

func (ce *CompilationEngine) UpdateFiles(tokenizedFiles []TokenizedFile) {
	ce.tokenizedFiles = tokenizedFiles
}

func (ce *CompilationEngine) Compile() error {
	for _, file := range ce.tokenizedFiles {
		ce.className = strings.TrimSuffix(file.Filename, ".jack")
		vmCode := ce.CompileClass(file.Content)
		
		vmFilename := fmt.Sprintf("%s.vm", ce.className)
		err := os.WriteFile(vmFilename, []byte(vmCode), 0644)
		if err != nil {
			return err
		}
		ce.className = ""
	}
	return nil
}

func (ce *CompilationEngine) CompileClass(content []Tokenized) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("compileClass error:", r)
		}
	}()

	var vmCode string
	curlyBracketIndex := findIndex(content, "{")
	if curlyBracketIndex == -1 {
		fmt.Println("No opening curly bracket found")
		return ""
	}

	classBody := content[curlyBracketIndex+1 : len(content)-1]

	classVarDecs := ce.divider.DivideClassVarDecs(classBody)
	ce.symbolTable.CreateClassTable(classVarDecs)

	subroutines := ce.divider.DivideSubroutines(classBody)
	ce.symbolTable.CreateMethods(subroutines)

	for _, subroutine := range subroutines {
		vmCode += ce.CompileSubroutine(subroutine)
	}

	return vmCode
}

func (ce *CompilationEngine) CompileSubroutine(subroutine []Tokenized) string {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("compileSubroutine error: %v", r)
		}
	}()
 
	ce.symbolTable.ResetSubroutineTable()
 
	subroutineBody := ce.divider.DivideSubroutineBody(subroutine)
	varDec := ce.divider.DivideVarDecs(subroutineBody)
	functionCode := ce.codeWriter.WriteFunction(
		subroutine[:3],
		ce.symbolTable.ClassTable,
		varDec,
		ce.className,
	)
 
	subroutineType := subroutine[0].Value.(string)
	parameters := ce.divider.DivideParameterList(subroutine)
	body := ce.CompileSubroutineBody(
		subroutineBody,
		parameters,
		subroutineType,
	)
 
	vmCode := fmt.Sprintf(
		"// function %s.%s.%s\n%s\n\n%s", 
		subroutine[0].Value, 
		subroutine[1].Value, 
		subroutine[2].Value, 
		functionCode, 
		body,
	)
 
	return vmCode
}

func (ce *CompilationEngine) CompileSubroutineBody(
	content []Tokenized,
	parameters [][]Tokenized,
	subroutineType string,
) string {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("compileSubroutineBody error: %v", r)
		}
	}()
 
	varDec := ce.divider.DivideVarDecs(content)
	
	combinedVars := append(parameters, varDec...)
	
	ce.symbolTable.CreateSubroutineTable(
		combinedVars,
		subroutineType,
		ce.className,
	)
 
	statements := ce.divider.DivideStatements(content)
	
	var vmCode string
	if len(statements) > 0 {
		vmCode = ce.CompileStatements(statements, subroutineType)
	}
 
	return vmCode
}

func (ce *CompilationEngine) CompileStatements(
	statements [][]Tokenized,
	subroutineType string,
 ) string {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("compileStatements error: %v", r)
		}
	}()
 
	var vmCode strings.Builder
 
	for _, statement := range statements {
		typ := statement[0].Value
		switch typ {
		case "let":
			codeLet := ce.CompileLet(statement)
			vmCode.WriteString(fmt.Sprintf("// let %s\n%s\n\n", statement[1].Value, codeLet))
 
		case "if":
			codeIf := ce.CompileIf(statement, subroutineType)
			vmCode.WriteString("// if\n" + codeIf + "\n\n")
 
		case "while":
			codeWhile := ce.CompileWhile(statement, subroutineType)
			vmCode.WriteString("// while\n" + codeWhile + "\n\n")
 
		case "do":
			codeDo := ce.CompileDo(statement, subroutineType)
			vmCode.WriteString("// do\n" + codeDo + "\n\n")
 
		case "return":
			codeReturn := ce.CompileReturn(statement)
			vmCode.WriteString("// return\n" + codeReturn + "\n\n")
		}
	}
 
	return vmCode.String()
}

func (ce *CompilationEngine) CompileLet(content []Tokenized) string {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("compileLet error: %v", r)
		}
	}()
 
	var vmCode strings.Builder
 
	declarationEnd := -1
	for i, item := range content {
		if item.Value == "=" {
			declarationEnd = i
			break
		}
	}
	declaration := content[:declarationEnd]
 
	isArray := slices.ContainsFunc(declaration, func(token Tokenized) bool {
		return token.Value == "["
	})
 
	commonTable := append(ce.symbolTable.ClassTable, ce.symbolTable.SubroutineTable...)
 
	name := content[1].Value.(string)
	popOptions := struct {
		kind  string
		index int
	}{
		kind:  "",
		index: 0,
	}
 
	for _, item := range commonTable {
		if item.Name == name {
			popOptions.kind = item.Kind
			popOptions.index = item.Index
			break
		}
	}
 
	for i := 0; i < len(content); i++ {
		token := content[i]
		switch token.Type {
		case "SYMBOL":
			if token.Value == "=" {
				semiColonIndex := -1
				for j := i; j < len(content); j++ {
					if content[j].Value == ";" {
						semiColonIndex = j
						break
					}
				}
				expression := ce.CompileExpression(content[i+1:semiColonIndex], "let")
				vmCode.WriteString(expression + "\n")
				i = semiColonIndex - 1
			} else if token.Value == "[" {
				closingBracketIndex := findClosingBracket(content, i, "[", "]")
				
				namePush := ce.codeWriter.WritePush(
					ce.codeWriter.TransformKind(popOptions.kind),
					strconv.Itoa(popOptions.index),
				)
				expression := ce.CompileExpression(content[i+1:closingBracketIndex], "let")
				
				vmCode.WriteString(fmt.Sprintf("%s\n%s\nadd\n", expression, namePush))
				i = closingBracketIndex
			}
		}
	}
 
	if isArray {
		vmCode.WriteString(ce.codeWriter.WritePop("temp", "0") + "\n")
	}
 
	if popOptions.kind != "" {
		kind := ce.codeWriter.TransformKind(popOptions.kind)
		code := ce.codeWriter.WritePop(kind, strconv.Itoa(popOptions.index))
		vmCode.WriteString(code + "\n")
	}
 
	if isArray {
		vmCode.WriteString(ce.codeWriter.WritePush("temp", "0") + "\n")
		vmCode.WriteString(ce.codeWriter.WritePop("that", "0") + "\n")
	}
 
	return vmCode.String()
}

func (ce *CompilationEngine) CompileIf(content []Tokenized, subroutineType string) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("CompileIf error:", r)
		}
	}()

	var vmCode string

	expression := ce.divider.DivideExpression(content)
	labels := ce.codeWriter.WriteIfLabels()

	if len(expression) > 0 {
		exp := ce.CompileExpression(expression, "if")
		vmCode += exp + "\n"
	}

	divideIfStatements := ce.divider.DivideIfStatements(content)
	ifStatements := divideIfStatements.If
	elseStatements := divideIfStatements.Else

	compiledIfStatements := ce.CompileStatements(ifStatements, subroutineType)
	vmCode += labels["if"] + "\n" + labels["goto"] + "\n"
	vmCode += labels["labelIf"] + "\n" + compiledIfStatements

	elseCheck := false
	for _, token := range content {
		if token.Value == "else" {
			elseCheck = true
			break
		}
	}

	if elseCheck {
		vmCode += labels["gotoEnd"] + "\n"
		vmCode += labels["labelElse"] + "\n"
		compiledElseStatements := ce.CompileStatements(elseStatements, subroutineType)
		vmCode += compiledElseStatements
		vmCode += labels["labelEnd"] + "\n"
	} else {
		vmCode += labels["labelEnd"] + "\n"
	}

	return vmCode
}

func (ce *CompilationEngine) CompileWhile(content []Tokenized, subroutineType string) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("CompileWhile error:", r)
		}
	}()

	var vmCode string

	labels := ce.codeWriter.WriteWhileLabels()
	vmCode += labels["labelStart"] + "\n"

	expression := ce.divider.DivideExpression(content)
	if len(expression) > 0 {
		exp := ce.CompileExpression(expression, "while")
		vmCode += exp + "\nnot\n"
	}

	vmCode += labels["if"] + "\n"

	statements := ce.divider.DivideWhileStatements(content)
	if len(statements) > 0 {
		compiledStatements := ce.CompileStatements(statements, subroutineType)
		vmCode += compiledStatements
	}

	vmCode += labels["goto"] + "\n" + labels["labelEnd"] + "\n"

	return vmCode
}

func (ce *CompilationEngine) CompileDo(content []Tokenized, subroutineType string) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("CompileDo error:", r)
		}
	}()

	var vmCode string
	var caller, name string
	length := 0

	expressionList := ce.divider.DivideExpression(content)
	commonTable := append(ce.symbolTable.ClassTable, ce.symbolTable.SubroutineTable...)

	var method *Table
	for i := range commonTable {
		if commonTable[i].Name == content[1].Value {
			method = &commonTable[i]
			break
		}
	}

	if method != nil && method.Kind == "field" {
		vmCode += ce.codeWriter.WritePush("this", "0") + "\n"
		caller = content[1].Value.(string)
		name = content[3].Value.(string)
		length++
	} else {
		if contains(operatingSystem, content[1].Value) {
			caller = content[1].Value.(string)
			name = content[3].Value.(string)
		} else {
			vmCode += ce.codeWriter.WritePush("pointer", "0") + "\n"
			caller = ce.className
			name = content[1].Value.(string)
			length++
		}
	}

	if len(expressionList) > 0 {
		compliseExpressionList := ce.CompileExpressionList(expressionList)
		
		expressionCode := compliseExpressionList.Code
		args := compliseExpressionList.Args

		vmCode += expressionCode
		length += args
	}

	vmCode += ce.codeWriter.WriteCall(fmt.Sprintf("%s.%s", caller, name), length) + "\n"
	vmCode += ce.codeWriter.WritePop("temp", "0") + "\n"
	return vmCode
}

func (ce *CompilationEngine) CompileReturn(content []Tokenized) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("CompileReturn error:", r)
		}
	}()

	var vmCode string
	expressions := content[1 : len(content)-1]
	if len(expressions) > 0 {
		expression := ce.CompileExpression(expressions, "return")
		vmCode += expression + "\nreturn\n"
	} else {
		vmCode += "push constant 0\nreturn\n"
	}

	return vmCode
}

func (ce *CompilationEngine) CompileExpression(content []Tokenized, from string) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("compileExpression error:", r)
		}
	}()

	var vmCode string
	var terms [][]Tokenized

	if from == "let" {
		terms = ce.divider.DivideVarTerms(content)
	} else {
		terms = ce.divider.DivideTerms(content)
	}

	terms = ce.divider.ShuffleTerms(terms)

	for i := 0; i < len(terms); i++ {
		term := terms[i]

		if len(term) > 0 && len(terms) == 2 {
			if unaryOperands := []string{"-", "~"}; contains(unaryOperands, terms[1][0].Value) {
				vmCode += ce.CompileTerm(terms[0]) + "\n"
				switch terms[1][0].Value {
				case "-":
					vmCode += "neg\n"
				case "~":
					vmCode += "not\n"
				}
				break
			}
		} else if len(term) > 0 && contains([]string{"<", ">", "&", "|", "=", "+", "-", "*", "/"}, term[0].Value) {
			value := term[0].Value
			switch value {
			case "<":
				vmCode += "lt\n"
			case ">":
				vmCode += "gt\n"
			case "&":
				vmCode += "and\n"
			case "|":
				vmCode += "or\n"
			case "=":
				vmCode += "eq\n"
			case "+":
				vmCode += "add\n"
			case "-":
				vmCode += "sub\n"
			case "*":
				vmCode += "call Math.multiply 2\n"
			case "/":
				vmCode += "call Math.divide 2\n"
			}
		} else if len(term) > 0 && term[0].Value == "(" {
			vmCode += ce.CompileTerm(term) + "\n"
		} else {
			vmCode += ce.CompileTerm(term) + "\n"
		}
	}

	return vmCode
}

func (ce *CompilationEngine) CompileTerm(content []Tokenized) string {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("compileTerm error:", r)
		}
	}()

	var vmCode string
	for i := 0; i < len(content); i++ {
		token := content[i]
		switch token.Value {
		case "IDENTIFIER":
			if i+1 < len(content) && content[i+1].Value == "(" {
				closingIndex := -1
				bracketCount := 0
				for j := i + 1; j < len(content); j++ {
					if content[j].Value == "(" {
						bracketCount++
					} else if content[j].Value == ")" {
						bracketCount--
						if bracketCount == 0 {
							closingIndex = j
							break
						}
					}
				}

				exprList := ce.CompileExpressionList(content[i+2 : closingIndex])
				vmCode += exprList.Code
				vmCode += ce.codeWriter.WriteCall(content[i-2].Value.(string) + "." + token.Value.(string), exprList.Args)
				i = closingIndex
			} else {
				commonTable := append(ce.symbolTable.ClassTable, ce.symbolTable.SubroutineTable...)

				tableIndex := customFindIndex(commonTable, func(entry Table) bool {
					return entry.Name == token.Value
				})

				if tableIndex != -1 {
					table := commonTable[tableIndex]
					kind := ce.codeWriter.TransformKind(table.Kind)
					vmCode += ce.codeWriter.WritePush(kind, strconv.Itoa(table.Index)) + "\n"
				}
			}
		case "STRING_CONST":
			vmCode += ce.codeWriter.WriteString(token.Value.(string))
		case "INT_CONST":
			vmCode += ce.codeWriter.WritePush("constant", token.Value.(string))
		case "SYMBOL":
			if token.Value == "[" {
				closingIndex := -1
				bracketCount := 1
				for j := i + 1; j < len(content); j++ {
					if content[j].Value == "[" {
						bracketCount++
					} else if content[j].Value == "]" {
						bracketCount--
						if bracketCount == 0 {
							closingIndex = j
							break
						}
					}
				}

				expr := ce.CompileExpression(content[i+1:closingIndex], "term")
				vmCode += expr + "\nadd\npop pointer 1\npush that 0"
				i = closingIndex
			}
		}
	}

	return vmCode
}

func (ce *CompilationEngine) CompileExpressionList(content []Tokenized) (result struct{ Code string; Args int }) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("compileExpressionList error:", r)
			result = struct{ Code string; Args int }{"", 0}
		}
	}()

	var vmCode string
	var counter int
	list := ce.divider.DivideExpressionList(content)

	for _, expr := range list {
		if len(expr) > 0 && expr[0].Value != "," {
			compiled := ce.CompileExpression(expr, "expressionList")
			vmCode += compiled
			counter++
		}
	}

	result = struct{ Code string; Args int }{vmCode, counter}
	return
}