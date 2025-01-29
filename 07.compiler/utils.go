package main

import "regexp"

func findIndex(tokens []Tokenized, value string) int {
	for i, token := range tokens {
		if token.Value == value {
			return i
		}
	}
	return -1
}

func filterTokens(tokens []Tokenized, exclude string) []Tokenized {
	var result []Tokenized
	for _, token := range tokens {
		if token.Value != exclude {
			result = append(result, token)
		}
	}
	return result
}

func customFindIndex[T any](arr []T, predicate func(T) bool) int {
	for i, v := range arr {
		if predicate(v) {
			return i
		}
	}
	return -1 
}

func containsDot(content []Tokenized) bool {
    for _, item := range content {
        if item.Value == "." {
            return true
        }
    }
    return false
}

func findClosingBracket(content []Tokenized, start int, openBracket, closeBracket string) int {
    openBracketCount := 0
    for j := start; j < len(content); j++ {
        if content[j].Value == openBracket {
            openBracketCount++
        } else if content[j].Value == closeBracket {
            openBracketCount--
            if openBracketCount == 0 {
                return j
            }
        }
    }
    return -1
}

func containsOperands(content []Tokenized) bool {
    for _, item := range content {
        if contains(operands, item.Value) {
            return true
        }
    }
    return false
}

func containsComma(content []Tokenized) bool {
    for _, item := range content {
        if item.Value == "," {
            return true
        }
    }
    return false
}

func includesTerm(value string) bool {
    for _, term := range terms {
        switch t := term.(type) {
        case string:
            if t == value {
                return true
            }
        case *regexp.Regexp:
            if t.MatchString(value) {
                return true
            }
        }
    }
    return false
}

func findToken(tokens []Tokenized, validTypes []string) Tokenized {
	for _, token := range tokens {
		if contains(validTypes, token.Value) {
			return token
		}
	}
	return Tokenized{}
}

func findLast(tables []Table, kind string) Table {
	for i := len(tables) - 1; i >= 0; i-- {
		if tables[i].Kind == kind {
			return tables[i]
		}
	}
	return Table{Index: -1}
}

func contains(slice []string, value any) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}