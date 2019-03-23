export
interface LsubResponse {
    lsubItems : LsubItem[]
}

export
interface LsubItem {
    nameAttributes: string[],
    hierarchyDelimiter : string,
    name : string
}