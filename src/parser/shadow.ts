//filename: src/libs/migrate/shadow.ts
import {PostgresParserOptions} from "./def";
import {oid} from "../utils/escape";
import {notice} from "./notice";

export function create_shadow( opts: PostgresParserOptions ): string[] {
    return [
        notice(`CREATE SHADOW SCHEMA ${ opts.shadow}`),
        `create schema ${oid( opts.shadow )};`,
        notice(`CREATE SHADOW SCHEMA ${ opts.shadow} OK!`),
    ];
}

export function drop_shadow( opts: PostgresParserOptions ): string[] {
    return [
        notice(`DROP SHADOW SCHEMA ${ opts.shadow}`),
        `drop schema ${oid( opts.shadow )} cascade;`,
        notice(`DROP SHADOW SCHEMA ${ opts.shadow} OK!`),
    ];
}
