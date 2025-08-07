import {PostgresParserOptions} from "./def";
import {oid, val} from "../utils/escape";
import {noTab} from "../utils/tabs";


export function prepareCore( opts:PostgresParserOptions ){
    const sys = oid( opts.sys );
    const tab = "         ";
    return noTab([
        `create schema if not exists ${sys};`,
        `create table if not exists ${sys}.migration(
            sid character varying not null primary key,
            date timestamptz not null default clock_timestamp()
         );`,
        `create table if not exists ${sys}.revision(
            hash character varying not null primary key,
            migration_sid character varying not null references ${sys}.migration,
            date timestamptz not null default clock_timestamp(),
            operation character varying not null,
            relation character varying not null,
            revision character varying
         );`,
    ], tab)
}
export function createMigration( opts:PostgresParserOptions ){
    if( opts.mode === "check" ) return [];
    const sys = oid( opts.sys );
    const migration = val( opts.migration );
    const tab = "         ";
    return noTab( [
        `insert into ${sys}.migration ( sid ) values ( ${migration} );`,
    ], tab)
}

export interface OperationOptions {
    hash:string,
    operation?: string
    relation?: string
    revision?: string
}
export function createRevision(opts:PostgresParserOptions, operation:OperationOptions ){
    if( opts.mode === "check" ) return [];
    const sys = oid( opts.sys );
    const tab = "         ";
    operation = { ...operation, migration_sid: opts.migration } as any;
    const keys = Object.keys( operation );
    const columns = keys.map( value => oid( value )).join(", ");
    const values = keys.map( value => {
        if( !operation[value] ) return `null`
        return val( operation[value] )
    }).join(", ");

    return noTab([
        `insert into ${sys}.revision ( ${ columns} ) values ( ${values} );`,
    ], tab)
}