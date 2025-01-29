# Nand2Tetris Project

This repository contains my implementation of the projects from the book _The Elements of Computing Systems: Building a Modern Computer from First Principles_ (Nand2Tetris). The projects cover the entire stack of computer science, from logic gates to a high-level programming language and an operating system.

## Project Overview

### **Chapter 1-4: Logic and Computer Architecture (HDL)**

1. **Logic Gates**: Implementation of fundamental logic gates (AND, OR, NOT) using NAND.
2. **Arithmetic**: Creation of binary adders (Half Adder, Full Adder) and an Arithmetic Logic Unit (ALU).
3. **Sequential Circuits**: Design of memory elements, including D-Flip-Flops and RAM.
4. **CPU and Instruction Set**: Construction of a basic CPU with jump instructions and ALU support.

### **Chapter 5-7: Software Stack (Golang)**

5. **Assembler**: Development of an assembler to translate Hack assembly into binary machine code.
6. **Virtual Machine (VM Translator)**: Implementation of a stack-based virtual machine similar to the Java Virtual Machine.
7. **Compiler**: Creation of a parser and translator for a high-level language, generating VM instructions.

### **Chapter 8: Operating System (Jack)**

8. **Operating System**: Implementation of core OS functions, including memory management, I/O, and multitasking, using the Jack language.

---

## Development History

Initially, I began this project using **TypeScript** for Chapters 5-7, implementing the assembler, virtual machine, and compiler quite some time ago. However I decided to rewrite these components in **Golang** to refresh my memory and skills in that realm. The TypeScript versions of these projects are available in [draft folder](./draft/) .

---

## Technologies Used

-   **HDL** (Hardware Description Language) for Chapters 1-4.
-   **Golang** for Chapters 5-7.
-   **Jack** for Chapter 8.

---

## Repository Structure

| Chapter | Description                                  | Folder                                      |
| ------- | -------------------------------------------- | ------------------------------------------- |
| 1       | HDL implementations of simple logic gates    | [boolean-gates](./01.simple-boolean-gates/) |
| 2       | HDL implementations of arithmetic gates      | [arithmetic-gates](./02.arithmetic-gates/)  |
| 3       | HDL implementations of memory                | [memory](./03.memory/)                      |
| 4       | HDL implementations of computer              | [architecture](./04.architecture/)          |
| 5       | Golang implementation of the assembler       | [assembler](./05.assembler/)                |
| 6       | Golang implementation of the virtual machine | [virtual-machine](./06.virtual-machine/)    |
| 7       | Golang implementation of the compiler        | [compiler](./07.compiler/)                  |
| 8       | Jack implementation of OS functions          | [OS](./08.OS/)                              |
| 0       | My early implementation in Typescript        | [draft](./draft/)                           |

---

## How to Use

1. Clone the repository:
    ```sh
    git clone https://github.com/your-repo/nand2tetris-project.git
    cd hack-computer-nand2tetris
    ```

---

2. For HDL projects (Chapters 1-4), use the **Hardware Simulator** provided in the Nand2Tetris course.

---

3. For the assembler, VM, and compiler (Chapters 5-7), ensure you have Go installed and run:

    - Make shure to put files inside the folder provided in the Nand2Tetris course.

    ```sh
    go run *.go
    ```

---

4. For OS functions (Chapter 8), use the **Jack Compiler** from the Nand2Tetris toolset.

---

## References

-   [Nand2Tetris Website](https://www.nand2tetris.org/)
-   _The Elements of Computing Systems_ by Noam Nisan and Shimon Schocken
