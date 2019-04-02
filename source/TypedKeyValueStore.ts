export
interface TypedKeyValueStore {
    getBoolean(key : string) : boolean | undefined;
    getInteger(key : string) : number | undefined;
    getString(key : string) : string | undefined;
}