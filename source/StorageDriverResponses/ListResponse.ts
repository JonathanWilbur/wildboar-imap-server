export
interface ListResponse {
    listItems : ListItem[]
}

export
interface ListItem {
    nameAttributes: string[],
    hierarchyDelimiter : string,
    name : string
}