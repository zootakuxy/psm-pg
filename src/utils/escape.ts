import * as pg from "pg";

const RESERVED_WORDS = new Set([
    "all", "analyse", "analyze", "and", "any", "array", "as", "asc", "asymmetric",
    "authorization", "binary", "both", "case", "cast", "check", "collate", "column",
    "constraint", "create", "current_catalog", "current_date", "current_role",
    "current_time", "current_timestamp", "current_user", "default", "deferrable",
    "desc", "distinct", "do", "else", "end", "except", "false", "fetch", "for",
    "foreign", "from", "grant", "group", "having", "in", "initially", "intersect",
    "into", "leading", "limit", "localtime", "localtimestamp", "not", "null", "offset",
    "on", "only", "or", "order", "placing", "primary", "references", "returning",
    "select", "session_user", "some", "symmetric", "table", "then", "to", "trailing",
    "true", "union", "unique", "user", "using", "variadic", "verbose", "when", "where",
    "window", "with"
]);

const IDENTIFIER_REGEX = /^[a-z_][a-z0-9_$]*$/i; // Regra para identificadores PostgreSQL

export function oid(string: string): string {
    if (!string){
        throw new Error("Invalid Object identifier name!");
    }

    const isValidIdentifier = IDENTIFIER_REGEX.test(string);
    const isReservedWord = RESERVED_WORDS.has(string.toLowerCase());

    if (isValidIdentifier && !isReservedWord) {
        return string;
    }

    return pg.escapeIdentifier(string);
}
export function val(string: string) {
    if (string === null || string === undefined) return 'null';
    return pg.escapeLiteral(string);
}