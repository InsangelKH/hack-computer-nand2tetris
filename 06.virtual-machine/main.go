package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func NewVMTranslator(file string, isDirectory bool) *VMTranslator {
    return &VMTranslator{
        fileName:      file,
        isDirectory:   isDirectory,
        parsedContent: make([]string, 0),
        code:         make([]string, 0),
        returnCounter: 0,
    }
}

func (vm *VMTranslator) readFile(filePath string) error {
    file, err := os.Open(filePath)
    if err != nil {
        return fmt.Errorf("readFile: %v", err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    fileContent := ""
    
    for scanner.Scan() {
        line := scanner.Text()
        if strings.Contains(line, "static") {
            fileName := filepath.Base(filePath)
            fileExt := filepath.Ext(fileName)
            baseName := strings.TrimSuffix(fileName, fileExt)
            line = line + " " + baseName
        }
        fileContent += line + "\n"
    }

    vm.file = fileContent
    return scanner.Err()
}

func (vm *VMTranslator) parse() error {
    if !vm.isDirectory {
        if err := vm.readFile(vm.fileName); err != nil {
            return err
        }
    }

    if vm.file == "" {
        return fmt.Errorf("parse: File wasn't read properly")
    }

    lines := strings.Split(vm.file, "\n")
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if commentIdx := strings.Index(line, "//"); commentIdx != -1 {
            line = strings.TrimSpace(line[:commentIdx])
        }
        if line != "" {
            vm.parsedContent = append(vm.parsedContent, line)
        }
    }
    return nil
}

func (vm *VMTranslator) writeFile() error {
    if err := vm.translate(); err != nil {
        return err
    }

    fileName := strings.TrimSuffix(vm.fileName, filepath.Ext(vm.fileName))
    content := strings.Join(vm.code, "\n")

    return os.WriteFile(fileName+".asm", []byte(content), 0644)
}

func (vm *VMTranslator) parseDirectory(directory string) error {
    files, err := os.ReadDir(directory)
    if err != nil {
        return err
    }

    for _, file := range files {
        if filepath.Ext(file.Name()) == ".vm" {
            if err := vm.readFile(filepath.Join(directory, file.Name())); err != nil {
                return err
            }
            if err := vm.parse(); err != nil {
                return err
            }
        }
    }
    return nil
}

func (vm *VMTranslator) commandType(line string) string {
    if strings.HasPrefix(line, "push") {
        return "C_PUSH"
    } else if strings.HasPrefix(line, "pop") {
        return "C_POP"
    } else if strings.HasPrefix(line, "label") {
        return "C_LABEL"
    } else if strings.HasPrefix(line, "goto") {
        return "C_GOTO"
    } else if strings.HasPrefix(line, "if-goto") {
        return "C_IF"
    } else if strings.HasPrefix(line, "function") {
        return "C_FUNCTION"
    } else if strings.HasPrefix(line, "call") {
        return "C_CALL"
    } else if strings.HasPrefix(line, "return") {
        return "C_RETURN"
    }
    return "C_ARITHMETIC"
}

func (vm *VMTranslator) writePush(line string) string {
    args := strings.Fields(line)
    segment := args[1]
    index := args[2]
    var fileName string
    if len(args) > 3 {
        fileName = args[3]
    }
    
    var code string
    
    switch segment {
    case "constant":
        code = fmt.Sprintf(`// %s
			@%s
			D=A
			@SP
			M=M+1
			A=M-1
			M=D`, line, index)
    case "local":
        code = fmt.Sprintf(`// %s
			@LCL
			D=M
			@%s
			A=D+A
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, index)
    case "argument":
        code = fmt.Sprintf(`// %s
			@ARG
			D=M
			@%s
			A=D+A
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, index)
    case "this":
        code = fmt.Sprintf(`// %s
			@THIS
			D=M
			@%s
			A=D+A
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, index)
    case "that":
        code = fmt.Sprintf(`// %s
			@THAT
			D=M
			@%s
			A=D+A
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, index)
    case "temp":
        tempIndex := strconv.Itoa(5 + parseInt(index))
        code = fmt.Sprintf(`// %s
			@%s
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, tempIndex)
    case "pointer":
        pointer := "THIS"
        if parseInt(index) != 0 {
            pointer = "THAT"
        }
        code = fmt.Sprintf(`// %s
			@%s
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, line, pointer)
    case "static":
        staticPointer := fmt.Sprintf("%s.%s", fileName, index)
        code = fmt.Sprintf(`// %s %s
			@%s
			D=M
			@SP
			M=M+1
			A=M-1
			M=D`, strings.Split(line, " ")[0], strings.Split(line, " ")[1], staticPointer)
    }
    
    return code
}

func (vm *VMTranslator) writePop(line string) string {
    args := strings.Fields(line)
    segment := args[1]
    index := args[2]
    var fileName string
    if len(args) > 3 {
        fileName = args[3]
    }
    
    var code string
    
    switch segment {
    case "local":
        code = fmt.Sprintf(`// %s
			@LCL
			D=M
			@%s
			D=D+A
			@R13
			M=D
			@SP
			AM=M-1
			D=M
			@R13
			A=M
			M=D`, line, index)
    case "argument":
        code = fmt.Sprintf(`// %s
			@ARG
			D=M
			@%s
			D=D+A
			@R13
			M=D
			@SP
			AM=M-1
			D=M
			@R13
			A=M
			M=D`, line, index)
    case "this":
        code = fmt.Sprintf(`// %s
			@THIS
			D=M
			@%s
			D=D+A
			@R13
			M=D
			@SP
			AM=M-1
			D=M
			@R13
			A=M
			M=D`, line, index)
    case "that":
        code = fmt.Sprintf(`// %s
			@THAT
			D=M
			@%s
			D=D+A
			@R13
			M=D
			@SP
			AM=M-1
			D=M
			@R13
			A=M
			M=D`, line, index)
    case "temp":
        tempIndex := strconv.Itoa(5 + parseInt(index))
        code = fmt.Sprintf(`// %s
			@%s
			D=A
			@R13
			M=D
			@SP
			AM=M-1
			D=M
			@R13
			A=M
			M=D`, line, tempIndex)
    case "pointer":
        pointer := "THIS"
        if parseInt(index) != 0 {
            pointer = "THAT"
        }
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			@%s
			M=D`, line, pointer)
    case "static":
        staticPointer := fmt.Sprintf("%s.%s", fileName, index)
        code = fmt.Sprintf(`// %s %s
			@SP
			AM=M-1
			D=M
			@%s
			M=D`, strings.Split(line, " ")[0], strings.Split(line, " ")[1], staticPointer)
    }
    
    return code
}

func (vm *VMTranslator) writeArithmetic(line string, index int) string {
    var code string
    
    switch line {
    case "add":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			M=M+D`, line)
    case "sub":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			M=M-D`, line)
    case "neg":
        code = fmt.Sprintf(`// %s
			@SP
			A=M-1
			M=-M`, line)
    case "eq":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			D=M-D
			M=-1
			@EQ%d
			D;JEQ
			@SP
			A=M-1
			M=0
			(EQ%d)`, line, index, index)
    case "gt":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			D=M-D
			M=-1
			@GT%d
			D;JGT
			@SP
			A=M-1
			M=0
			(GT%d)`, line, index, index)
    case "lt":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			D=M-D
			M=-1
			@LT%d
			D;JLT
			@SP
			A=M-1
			M=0
			(LT%d)`, line, index, index)
    case "and":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			M=M&D`, line)
    case "or":
        code = fmt.Sprintf(`// %s
			@SP
			AM=M-1
			D=M
			A=A-1
			M=M|D`, line)
    case "not":
        code = fmt.Sprintf(`// %s
			@SP
			A=M-1
			M=!M`, line)
    }
    
    return code
}

func (vm *VMTranslator) writeLabel(line string) string {
    label := strings.Fields(line)[1]
    return fmt.Sprintf(`// %s
		(%s)`, line, label)
}

func (vm *VMTranslator) writeGoto(line string) string {
    label := strings.Fields(line)[1]
    return fmt.Sprintf(`// %s
		@%s
		0;JMP`, line, label)
}

func (vm *VMTranslator) writeIf(line string) string {
    label := strings.Fields(line)[1]
    return fmt.Sprintf(`// %s
		@SP
		AM=M-1
		D=M
		@%s
		D;JNE`, line, label)
}

func (vm *VMTranslator) writeFunction(line string) string {
    args := strings.Fields(line)
    functionName := args[1]
    numLocals := parseInt(args[2])
    
    code := fmt.Sprintf(`// %s
		(%s)`, line, functionName)
    
    for i := 0; i < numLocals; i++ {
        code += `
			@SP
			AM=M+1
			A=A-1
			M=0`
    }
    
    return code
}

func (vm *VMTranslator) writeReturn(line string) string {
    return fmt.Sprintf(`// %s
		@LCL
		D=M
		@R13
		M=D
		@5
		A=D-A
		D=M
		@R14
		M=D
		@SP
		AM=M-1
		D=M
		@ARG
		A=M
		M=D
		@ARG
		D=M+1
		@SP
		M=D
		@R13
		AM=M-1
		D=M
		@THAT
		M=D
		@R13
		AM=M-1
		D=M
		@THIS
		M=D
		@R13
		AM=M-1
		D=M
		@ARG
		M=D
		@R13
		AM=M-1
		D=M
		@LCL
		M=D
		@R14
		A=M
		0;JMP`, line)
}

func (vm *VMTranslator) writeCall(line string) string {
    args := strings.Fields(line)
    functionName := args[1]
    numArgs := parseInt(args[2])
    
    returnAddress := fmt.Sprintf("%s$ret.%d", functionName, vm.returnCounter)
    vm.returnCounter++
    
    return fmt.Sprintf(`// %s
		@%s
		D=A
		@SP
		A=M
		M=D
		@SP
		M=M+1
		@LCL
		D=M
		@SP
		AM=M+1
		A=A-1
		M=D
		@ARG
		D=M
		@SP
		AM=M+1
		A=A-1
		M=D
		@THIS
		D=M
		@SP
		AM=M+1
		A=A-1
		M=D
		@THAT
		D=M
		@SP
		AM=M+1
		A=A-1
		M=D
		@SP
		D=M
		@5
		D=D-A
		@%d
		D=D-A
		@ARG
		M=D
		@SP
		D=M
		@LCL
		M=D
		@%s
		0;JMP
		(%s)`, line, returnAddress, numArgs, functionName, returnAddress)
}

func (vm *VMTranslator) translate() error {
    if vm.isDirectory {
        if err := vm.parseDirectory(filepath.Dir(vm.fileName)); err != nil {
            return err
        }
    } else {
        if err := vm.parse(); err != nil {
            return err
        }
    }

    if len(vm.parsedContent) == 0 {
        return fmt.Errorf("translate: No content to translate")
    }

    for i, line := range vm.parsedContent {
        cmdType := vm.commandType(line)
        var code string

        switch cmdType {
        case "C_PUSH":
            code = vm.writePush(line)
        case "C_POP":
            code = vm.writePop(line)
        case "C_ARITHMETIC":
            code = vm.writeArithmetic(line, i)
        case "C_LABEL":
            code = vm.writeLabel(line)
        case "C_GOTO":
            code = vm.writeGoto(line)
        case "C_IF":
            code = vm.writeIf(line)
        case "C_FUNCTION":
            code = vm.writeFunction(line)
        case "C_CALL":
            code = vm.writeCall(line)
        case "C_RETURN":
            code = vm.writeReturn(line)
        default:
            fmt.Printf("Unknown command: %s\n", line)
            continue
        }
        vm.code = append(vm.code, code)
    }
    return nil
}

func (vm *VMTranslator) loadBootstrapCode() {
    bootstrapCode := `// Bootstrap code
		@256
		D=A
		@SP
		M=D
		@Sys.init$RETURN0
		D=A
		@SP
		A=M
		M=D
		@SP
		M=M+1	// push return-address
		@LCL
		D=M
		@SP
		A=M
		M=D
		@SP
		M=M+1	// push LCL
		@ARG
		D=M
		@SP
		A=M
		M=D
		@SP
		M=M+1	// push ARG
		@THIS
		D=M
		@SP
		A=M
		M=D
		@SP
		M=M+1	// push THIS
		@THAT
		D=M
		@SP
		A=M
		M=D
		@SP
		M=M+1	// push THAT
		@SP
		D=M
		@0
		D=D-A
		@5
		D=D-A
		@ARG
		M=D	// ARG = SP-n-5
		@SP
		D=M
		@LCL
		M=D	// LCL = SP
		@Sys.init
		0;JMP
		(Sys.init$RETURN0)`

    vm.code = append([]string{bootstrapCode}, vm.code...)
}

func parseInt(s string) int {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0
    }
    return n
}


func main() {
    vm := NewVMTranslator("Sys", true)
    vm.loadBootstrapCode()
    if err := vm.writeFile(); err != nil {
        fmt.Printf("Error: %v\n", err)
        os.Exit(1)
    }
}
