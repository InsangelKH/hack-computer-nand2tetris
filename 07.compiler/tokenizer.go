package main

import (
	"fmt"
	"regexp"
	"strconv"
)

var (
	identifierRegex    = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
	intConstantRegex   = regexp.MustCompile(`^\d+$`)
	stringConstantRegex = regexp.MustCompile(`^"[^"]*"$`)
)

type TokenType string

const (
	KEYWORD       TokenType = "KEYWORD"
	SYMBOL        TokenType = "SYMBOL"
	IDENTIFIER    TokenType = "IDENTIFIER"
	INT_CONST     TokenType = "INT_CONST"
	STRING_CONST  TokenType = "STRING_CONST"
)

type Tokenized struct {
	Type  TokenType
	Value interface{}
}

type Tokenizer struct{}

func NewTokenizer() *Tokenizer {
	return &Tokenizer{}
}

func (t *Tokenizer) TokenType(token string) (TokenType, error) {
	if contains(keyword, token) {
		return KEYWORD, nil
	} else if contains(symbol, token) {
		return SYMBOL, nil
	} else if intConstantRegex.MatchString(token) {
		return INT_CONST, nil
	} else if stringConstantRegex.MatchString(token) {
		return STRING_CONST, nil
	} else if identifierRegex.MatchString(token) {
		return IDENTIFIER, nil
	} else if token == `"` {
		return STRING_CONST, nil
	}

	return "", fmt.Errorf("invalid token: %s", token)
}

func (t *Tokenizer) Keyword(token string) string {
	return token
}

func (t *Tokenizer) Symbol(token string) string {
	return token
}

func (t *Tokenizer) Identifier(token string) string {
	return token
}

func (t *Tokenizer) IntVal(token string) (int, error) {
	return strconv.Atoi(token)
}

func (t *Tokenizer) StringVal(token string) string {
	if len(token) < 2 {
		return ""
	}
	return token[1 : len(token)-1]
}

func (t *Tokenizer) Tokenize(token string) (Tokenized, error) {
	tokenType, err := t.TokenType(token)
	if err != nil {
		return Tokenized{}, err
	}

	switch tokenType {
	case KEYWORD:
		return Tokenized{Type: tokenType, Value: t.Keyword(token)}, nil
	case SYMBOL:
		return Tokenized{Type: tokenType, Value: t.Symbol(token)}, nil
	case INT_CONST:
		intVal, err := t.IntVal(token)
		if err != nil {
			return Tokenized{}, err
		}
		return Tokenized{Type: tokenType, Value: intVal}, nil
	case STRING_CONST:
		return Tokenized{Type: tokenType, Value: t.StringVal(token)}, nil
	case IDENTIFIER:
		return Tokenized{Type: tokenType, Value: t.Identifier(token)}, nil
	default:
		return Tokenized{}, fmt.Errorf("invalid token type")
	}
}