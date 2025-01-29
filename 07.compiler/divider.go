package main

func NewDivider() *Divider {
	return &Divider{}
}

func (d *Divider) DivideClassVarDecs(content []Tokenized) [][]Tokenized {
    var classVarDecs [][]Tokenized
    startIndex := 0

    for startIndex < len(content) {
        keywordIndex := -1
        for i := startIndex; i < len(content); i++ {
            if contains(classVarDec, content[i].Value) {
                keywordIndex = i
                break
            }
        }

        if keywordIndex == -1 {
            break
        }

        semicolonIndex := -1
        for i := keywordIndex + 1; i < len(content); i++ {
            if content[i].Value == ";" {
                semicolonIndex = i
                break
            }
        }

        if semicolonIndex == -1 {
            break
        }

        declaration := content[keywordIndex : semicolonIndex+1]
        classVarDecs = append(classVarDecs, declaration)

        startIndex = semicolonIndex
    }

    return classVarDecs
}

func (d *Divider) DivideSubroutines(content []Tokenized) [][]Tokenized {
    var subroutines [][]Tokenized
    startIndex := 0

    for startIndex < len(content) {
        keywordIndex := -1
        for i := startIndex; i < len(content); i++ {
            if contains(subroutineDec, content[i].Value) {
                keywordIndex = i
                break
            }
        }

        if keywordIndex == -1 {
            break
        }

        closingBracketIndex := -1
        bracketCount := 0
        for i := keywordIndex; i < len(content); i++ {
            if content[i].Value == "{" {
                bracketCount++
            } else if content[i].Value == "}" {
                bracketCount--
                if bracketCount == 0 {
                    closingBracketIndex = i
                    break
                }
            }
        }

        if closingBracketIndex == -1 {
            break
        }

        subroutine := content[keywordIndex : closingBracketIndex+1]
        subroutines = append(subroutines, subroutine)
        startIndex = closingBracketIndex
    }

    return subroutines
}

func (d *Divider) DivideParameterList(content []Tokenized) [][]Tokenized {
	openingBracketIndex := -1
	for i, token := range content {
		if token.Value == "(" {
			openingBracketIndex = i
			break
		}
	}

	closingBracketIndex := -1
	for i := openingBracketIndex + 1; i < len(content); i++ {
		if content[i].Value == ")" && i+1 < len(content) && content[i+1].Value == "{" {
			closingBracketIndex = i
			break
		}
	}

	if openingBracketIndex == -1 || closingBracketIndex == -1 {
		return nil
	}

	parameters := content[openingBracketIndex+1 : closingBracketIndex]
	var result [][]Tokenized
	start := 0

	for start < len(parameters) {
		commaIndex := -1
		for i := start; i < len(parameters); i++ {
			if parameters[i].Value == "," {
				commaIndex = i
				break
			}
		}

		if commaIndex != -1 {
			result = append(result, parameters[start:commaIndex])
			start = commaIndex + 1
		} else {
			result = append(result, parameters[start:])
			break
		}
	}

	return result
}

func (d *Divider) DivideSubroutineBody(content []Tokenized) []Tokenized {
    openingBracketIndex := -1
    for i := 0; i < len(content); i++ {
        if i > 0 && content[i].Value == "{" && content[i-1].Value == ")" {
            openingBracketIndex = i
            break
        }
    }

    return content[openingBracketIndex+1 : len(content)-1]
}

func (d *Divider) DivideVarDecs(content []Tokenized) [][]Tokenized {
    var varDecs [][]Tokenized
    startIndex := 0

    for startIndex < len(content) {
        keywordIndex := -1
        for i := startIndex; i < len(content); i++ {
            if content[i].Value == "var" {
                keywordIndex = i
                break
            }
        }

        if keywordIndex == -1 {
            break
        }

        semicolonIndex := -1
        for i := keywordIndex + 1; i < len(content); i++ {
            if content[i].Value == ";" {
                semicolonIndex = i
                break
            }
        }

        if semicolonIndex == -1 {
            break
        }

        declaration := content[keywordIndex : semicolonIndex+1]
        varDecs = append(varDecs, declaration)

        startIndex = semicolonIndex
    }

    return varDecs
}

func (d *Divider) DivideStatements(content []Tokenized) [][]Tokenized {
    var result [][]Tokenized
    for i := 0; i < len(content); i++ {
        if contains(statements, content[i].Value) {
            typ := content[i].Value.(string)

            switch typ {
            case "let", "do", "return":
                closingBracketIndex := -1
                for j := i + 1; j < len(content); j++ {
                    if content[j].Value == ";" {
                        closingBracketIndex = j
                        break
                    }
                }

                if closingBracketIndex == -1 {
                    break
                }

                result = append(result, content[i:closingBracketIndex+1])
                i = closingBracketIndex

            case "while":
                openBracketCount := 0
                closingBracketIndex := -1
                for j := i; j < len(content); j++ {
                    if content[j].Value == "{" {
                        openBracketCount++
                    } else if content[j].Value == "}" {
                        openBracketCount--
                        if openBracketCount == 0 {
                            closingBracketIndex = j
                            break
                        }
                    }
                }

                result = append(result, content[i:closingBracketIndex+1])
                i = closingBracketIndex

            case "if":
                openBracketCount := 0
                closingBracketIndex := -1
                for j := i; j < len(content); j++ {
                    if content[j].Value == "{" {
                        openBracketCount++
                    } else if content[j].Value == "}" {
                        openBracketCount--
                        if openBracketCount == 0 {
                            hasElse := j+1 < len(content) && content[j+1].Value == "else"
                            if !hasElse || j+1 == len(content) {
                                closingBracketIndex = j
                                break
                            }
                        }
                    }
                }

                result = append(result, content[i:closingBracketIndex+1])
                i = closingBracketIndex
            }
        }
    }

    return result
}

func (d *Divider) DivideExpression(content []Tokenized) []Tokenized {
	openBracket := -1
	for i, item := range content {
		if item.Value == "(" {
			openBracket = i
			break
		}
	}
 
	closingBracket := -1
	openBracketCount := 0
	for i := openBracket; i < len(content); i++ {
		if content[i].Value == "(" {
			openBracketCount++
		} else if content[i].Value == ")" {
			openBracketCount--
			if openBracketCount == 0 {
				closingBracket = i
				break
			}
		}
	}
 
	return content[openBracket+1 : closingBracket]
}

type ifStatements struct {
    If    [][]Tokenized
    Else  [][]Tokenized
}

func (d *Divider) DivideIfStatements(content []Tokenized) ifStatements {
    result := ifStatements{
        If:   [][]Tokenized{},
        Else: [][]Tokenized{},
    }

    openBracket := -1
    for i, item := range content {
        if item.Value == "{" {
            openBracket = i
            break
        }
    }

    openBracketCount := 0
    closingBracket := -1
    for i := openBracket; i < len(content); i++ {
        if content[i].Value == "{" {
            openBracketCount++
        }
        if content[i].Value == "}" {
            openBracketCount--
            if openBracketCount == 0 {
                closingBracket = i
                break
            }
        }
    }

    ifStatements := d.DivideStatements(content[openBracket+1 : closingBracket])
    result.If = ifStatements

    elseIndex := -1
    openElseBracketCount := 0
    for i := closingBracket + 1; i < len(content); i++ {
        if content[i].Value == "{" {
            openElseBracketCount++
        }

        if content[i].Value == "}" {
            openElseBracketCount--
        }

        if content[i].Value == "else" && openElseBracketCount == 0 {
            elseIndex = i
            break
        }
    }

    if elseIndex != -1 {
        openBracketCount := 0
        openBracketElse := -1
        for i := elseIndex; i < len(content); i++ {
            if content[i].Value == "{" {
                openBracketElse = i
                break
            }
        }

        closingBracketElse := -1
        for i := elseIndex; i < len(content); i++ {
            if content[i].Value == "{" {
                openBracketCount++
            }
            if content[i].Value == "}" {
                openBracketCount--
                if openBracketCount == 0 {
                    closingBracketElse = i
                    break
                }
            }
        }

        elseStatements := d.DivideStatements(content[openBracketElse+1 : closingBracketElse])
        result.Else = elseStatements
    }

    return result
}

func (d *Divider) DivideWhileStatements(content []Tokenized) [][]Tokenized {
    openBracket := -1
    for i, item := range content {
        if item.Value == "{" {
            openBracket = i
            break
        }
    }

    closingBracket := -1
    openBracketCount := 0
    for i := openBracket; i < len(content); i++ {
        if content[i].Value == "{" {
            openBracketCount++
        } else if content[i].Value == "}" {
            openBracketCount--
            if openBracketCount == 0 {
                closingBracket = i
                break
            }
        }
    }

    whileStatements := d.DivideStatements(content[openBracket+1 : closingBracket])
    return whileStatements
}

func (d *Divider) DivideTerms(content []Tokenized) [][]Tokenized {
    var result [][]Tokenized
    
    if containsDot(content) {
        result = append(result, content)
        return result
    }

    for i := 0; i < len(content); i++ {
        token := content[i]
        
        if contains(operands, token.Value) || contains(unaryOperands, token.Value) {
            result = append(result, []Tokenized{token})
            continue
        }

        if token.Value == "(" {
            closingBracket := findClosingBracket(content, i, "(", ")")
            result = append(result, content[i:closingBracket+1])
            i = closingBracket
            continue
        } else if token.Value == "[" {
            closingBracket := findClosingBracket(content, i, "[", "]")
            result = append(result, content[i:closingBracket+1])
            i = closingBracket
            continue
        }

        result = append(result, []Tokenized{token})
    }

    return result
}

func (d *Divider) DivideVarTerms(content []Tokenized) [][]Tokenized {
    var result [][]Tokenized
    
    if !containsOperands(content) {
        return [][]Tokenized{content}
    }

    for i := 0; i < len(content); i++ {
        token := content[i]

        if contains(operands, token.Value) {
            result = append(result, []Tokenized{token})

            if i+1 < len(content) && content[i+1].Value == "(" {
                closingBracket := findClosingBracket(content, i+1, "(", ")")
                result = append(result, content[i+1:closingBracket+1])
                i = closingBracket
            }
        } else if token.Value == "(" {
            closingBracket := findClosingBracket(content, i, "(", ")")
            result = append(result, content[i:closingBracket+1])
            i = closingBracket
        } else if token.Value == "[" {
            closingBracket := findClosingBracket(content, i, "[", "]")
            result = append(result, content[i:closingBracket+1])
            i = closingBracket
        } else {
            result = append(result, []Tokenized{token})
        }
    }

    return result
}

func (d *Divider) DivideExpressionList(content []Tokenized) [][]Tokenized {
    var result [][]Tokenized
    
    if !containsComma(content) && len(content) > 0 {
        result = append(result, content)
        return result
    }

    for i := 0; i < len(content); i++ {
        commaIndex := -1
        for j := i; j < len(content); j++ {
            if content[j].Value == "," {
                commaIndex = j
                break
            }
        }

        if commaIndex != -1 {
            result = append(result, content[i:commaIndex])
            result = append(result, []Tokenized{content[commaIndex]})
            i = commaIndex
        } else {
            if i != len(content) {
                result = append(result, content[i:])
                break
            }
        }
    }

    return result
}

func (d *Divider) ShuffleTerms(content [][]Tokenized) [][]Tokenized {
    var operandIndexes []int
    
    for i, item := range content {
        if contains(operands, item[0].Value) || contains(unaryOperands, item[0].Value) {
            operandIndexes = append(operandIndexes, i)
        }
    }

    if len(operandIndexes) != 0 {
        for _, index := range operandIndexes {
            operand := content[index]
            right := content[index+1]
            content[index] = right
            content[index+1] = operand
        }
    }

    return content
}