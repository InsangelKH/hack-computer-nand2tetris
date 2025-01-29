package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Assembler struct {
    file          string
    fileName      string
    parsedContent []string
    code          []string
    nextAddress   int
    symbolTable   map[string]int
}

func NewAssembler(file string) *Assembler {
    symbolTable := map[string]int{
        "SP":     0,
        "LCL":    1,
        "ARG":    2,
        "THIS":   3,
        "THAT":   4,
        "R0":     0,
        "R1":     1,
        "R2":     2,
        "R3":     3,
        "R4":     4,
        "R5":     5,
        "R6":     6,
        "R7":     7,
        "R8":     8,
        "R9":     9,
        "R10":    10,
        "R11":    11,
        "R12":    12,
        "R13":    13,
        "R14":    14,
        "R15":    15,
        "SCREEN": 16384,
        "KBD":    24576,
    }

    return &Assembler{
        fileName:      file,
        parsedContent: make([]string, 0),
        code:         make([]string, 0),
        nextAddress:   16,
        symbolTable:   symbolTable,
    }
}

func (a *Assembler) readFile() error {
    file, err := os.Open(a.fileName)
    if err != nil {
        return fmt.Errorf("readFile: %v", err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    var content strings.Builder
    for scanner.Scan() {
        content.WriteString(scanner.Text() + "\n")
    }

    if err := scanner.Err(); err != nil {
        return fmt.Errorf("readFile scanner: %v", err)
    }

    a.file = content.String()
    return nil
}

func (a *Assembler) parse() error {
    if err := a.readFile(); err != nil {
        return err
    }

    if a.file == "" {
        return fmt.Errorf("parse: File wasn't read properly")
    }

    lines := strings.Split(a.file, "\n")
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if line != "" && !strings.HasPrefix(line, "//") {
            a.parsedContent = append(a.parsedContent, line)
        }
    }
    return nil
}

func (a *Assembler) writeFile() error {
    if err := a.translate(); err != nil {
        return err
    }

    fileName := strings.TrimSuffix(a.fileName, filepath.Ext(a.fileName))
    content := strings.Join(a.code, "\n")

    return os.WriteFile(fileName+".hack", []byte(content), 0644)
}

func (a *Assembler) instructionType(line string) string {
    if strings.HasPrefix(line, "@") {
        return "A"
    } else if strings.HasPrefix(line, "(") {
        return "L"
    }
    return "C"
}

func (a *Assembler) decodeAInstruction(line string) string {
    address := line[1:]
    var code int

    if n, err := strconv.Atoi(address); err != nil {
        if val, exists := a.symbolTable[address]; exists {
            code = val
        } else {
            a.symbolTable[address] = a.nextAddress
            code = a.nextAddress
            a.nextAddress++
        }
    } else {
        code = n
    }

    binary := fmt.Sprintf("%015b", code)
    return "0" + binary
}

func (a *Assembler) assignLabelAddress() {
    lCounter := 0
    for i, line := range a.parsedContent {
        if strings.HasPrefix(line, "(") {
            label := line[1 : len(line)-1]
            address := i - lCounter
            a.symbolTable[label] = address
            lCounter++
        }
    }
}

func (a *Assembler) dest(dest string) string {
    destMap := map[string]string{
        "":    "000",
        "M":   "001",
        "D":   "010",
        "MD":  "011",
        "A":   "100",
        "AM":  "101",
        "AD":  "110",
        "AMD": "111",
    }

    if val, exists := destMap[dest]; exists {
        return val
    }
    return "000"
}

func (a *Assembler) comp(comp string) string {
    compMap := map[string]string{
        "0":   "0101010",
        "1":   "0111111",
        "-1":  "0111010",
        "D":   "0001100",
        "A":   "0110000",
        "!D":  "0001101",
        "!A":  "0110001",
        "-D":  "0001111",
        "-A":  "0110011",
        "D+1": "0011111",
        "A+1": "0110111",
        "D-1": "0001110",
        "A-1": "0110010",
        "D+A": "0000010",
        "D-A": "0010011",
        "A-D": "0000111",
        "D&A": "0000000",
        "D|A": "0010101",
        "M":   "1110000",
        "!M":  "1110001",
        "-M":  "1110011",
        "M+1": "1110111",
        "M-1": "1110010",
        "D+M": "1000010",
        "D-M": "1010011",
        "M-D": "1000111",
        "D&M": "1000000",
        "D|M": "1010101",
    }

    if val, exists := compMap[comp]; exists {
        return val
    }
    return "0000000"
}

func (a *Assembler) jump(jump string) string {
    jumpMap := map[string]string{
        "":    "000",
        "JGT": "001",
        "JEQ": "010",
        "JGE": "011",
        "JLT": "100",
        "JNE": "101",
        "JLE": "110",
        "JMP": "111",
    }

    if val, exists := jumpMap[jump]; exists {
        return val
    }
    return "000"
}

func (a *Assembler) translate() error {
    if err := a.parse(); err != nil {
        return err
    }

    if len(a.parsedContent) == 0 {
        return fmt.Errorf("no content to translate")
    }

    a.assignLabelAddress()

    for _, line := range a.parsedContent {
        switch a.instructionType(line) {
        case "A":
            address := a.decodeAInstruction(line)
            if address != "" {
                a.code = append(a.code, address)
            }
        case "C":
            if line == "" {
                continue
            }

            var dest, comp, jump string
            if strings.Contains(line, ";") && strings.Contains(line, "=") {
                parts := strings.Split(line, "=")
                dest = parts[0]
                restParts := strings.Split(parts[1], ";")
                comp = restParts[0]
                jump = restParts[1]
            } else if strings.Contains(line, "=") {
                parts := strings.Split(line, "=")
                dest = parts[0]
                comp = parts[1]
            } else if strings.Contains(line, ";") {
                parts := strings.Split(line, ";")
                comp = parts[0]
                jump = parts[1]
            }

            code := "111"
            if comp != "" {
                code += a.comp(comp)
            } else {
                code += "0000000"
            }
            code += a.dest(dest)
            code += a.jump(jump)
            a.code = append(a.code, code)
        }
    }
    return nil
}

func main() {
    assembler := NewAssembler("Rect.asm")
    if err := assembler.writeFile(); err != nil {
        fmt.Printf("Error: %v\n", err)
        os.Exit(1)
    }
    fmt.Println("File written successfully")
}