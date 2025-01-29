package main

func NewSymbolTable() *SymbolTable {
	return &SymbolTable{
		ClassTable:      []Table{},
		SubroutineTable: []Table{},
		Methods:         []Table{},
	}
}

func (st *SymbolTable) CreateClassTable(content [][]Tokenized) {
	index := 0

	for _, line := range content {
		commaIndex := findIndex(line, ",")

		if commaIndex != -1 {
			vars := filterTokens(line[2:len(line)-1], ",")

			for _, token := range vars {
				st.ClassTable = append(st.ClassTable, Table{
					Name:  token.Value.(string),
					Type:  line[1].Value.(string),
					Kind:  line[0].Value.(string),
					Index: index,
				})
				index++
			}
		} else {
			st.ClassTable = append(st.ClassTable, Table{
				Name:  line[2].Value.(string),
				Type:  line[1].Value.(string),
				Kind:  line[0].Value.(string),
				Index: index,
			})
			index++
		}
	}
}

func (st *SymbolTable) ResetSubroutineTable() {
	st.SubroutineTable = []Table{}
}

func (st *SymbolTable) CreateSubroutineTable(content [][]Tokenized, t string, classType string) {	
	if t == "method" {
		st.SubroutineTable = append(st.SubroutineTable, Table{
			Name:  "this",
			Type:  classType,
			Kind:  "argument",
			Index: 0,
		})
	}

	for _, line := range content {
		commaIndex := findIndex(line, ",")
		typeToken := findToken(line, types)
		kind := "argument"
		if line[0].Value == "var" {
			kind = "var"
		}
	
		if commaIndex != -1  {
			var vars []Tokenized
			
			vars = filterTokens(line[2:len(line)-1], ",")
			

			for _, token := range vars {
				kindTable := findLast(st.SubroutineTable, kind)
				st.SubroutineTable = append(st.SubroutineTable, Table{
					Name:  token.Value.(string),
					Type:  typeToken.Value.(string),
					Kind:  kind,
					Index: kindTable.Index + 1,
				})
			}
		} else {
			kindTable := findLast(st.SubroutineTable, kind)
			
			var name interface{}
			
			if len(line) <= 2 {
				name = line[1].Value
			} else {
				name = line[2].Value
			}

			st.SubroutineTable = append(st.SubroutineTable, Table{
				Name:  name.(string),
				Type:  typeToken.Value.(string),
				Kind:  kind,
				Index: kindTable.Index + 1,
			})
		}
	}
}

func (st *SymbolTable) CreateMethods(content [][]Tokenized) {
	for index, item := range content {
		st.Methods = append(st.Methods, Table{
			Name:  item[2].Value.(string),
			Type:  item[1].Value.(string),
			Kind:  item[0].Value.(string),
			Index: index,
		})
	}
}