import {FieldOption, ModelOptions} from "@prisma-psm/core";
import {oid, val} from "../../utils/escape";
import { noTab } from "../../utils/tabs";
import { PostgresParserOptions } from "../def";
import {notice} from "../notice";
import {createRevision} from "../sys";
import {migrationHash} from "../../utils/sha";

export function createFunctionRestoreSerial( opts: PostgresParserOptions) {
    const sys = oid( opts.sys);
    const tab = "         "
    return noTab([
        `create or replace function ${sys}.restore_serial(
            schema character varying,
            source character varying,
            shadow character varying,
            temp character varying,
            "from" character varying,
            "to" character varying,
            "seq" character varying
        ) returns table( sequence character varying, counts int8 )
        language plpgsql as $$
        declare
        begin
            if exists(
              select *
                from pg_tables t
                where t.schemaname = schema
                and t.tablename = source
            ) then
                execute format( $statment$
                select max( %I ) from %I.%I
                $statment$, "from", schema, source )
                into counts;
            
                counts := coalesce( counts, 0 )+1;
                -- example district_id_seq
                sequence := coalesce( seq, format( '%I.%I', shadow, format( '%s_%s_seq', temp, "to" ) ) );
                perform setval( sequence::regclass, counts, false );
            end if;
            return next;
        end;
        $$;`
    ], tab );
}


export interface RestoreOptions{
    source:string
    model:ModelOptions,
    parser:PostgresParserOptions
}

export function restoreBackupSQL(opts:RestoreOptions ): {
    data:string[]
    registry:string[]
}{
    const schema =  oid(opts.model.schema);
    const source =  oid(opts.source);
    const shadow =  oid(opts.parser.shadow);
    const table =   oid(opts.model.name);
    const temp =    oid(opts.model.temp);

    if( opts.model.psm?.backup?.skip ) return null as any;

    let filter = ( field:FieldOption)=>{
        return !field.isGenerated
            && field.kind === "scalar"
            ;
    }

    const columns = opts.model.fields.filter( filter  )
        .map( value => ` ${oid(value.name)}` )
        .join(", ")
    ;

    const DEFAULT_QUERY = `select * from ${schema}.${source}`;
    const DEFAULT_RESOLVER = opts.model.fields.filter( filter )
        .map( value => {
            return  ` ${oid(value.dbName||value.name)}`;
        })
        .join(", ")
    ;

    const revision_resolver = opts.model.fields.filter( filter )
        .map( field => {

            let expression = field.psm?.restore?.expression;
            if( !expression ) expression = ` ${oid(field.dbName||field.name)}`;
            return expression;
        })
        .join(", ")
    ;

    let revision_query = DEFAULT_QUERY;
    const expression = opts.model.psm?.backup?.rev?.expression;
    if( opts.model.psm?.backup?.rev?.from === "query"
        && !!expression
    ) revision_query = expression

    else if( opts.model.psm?.backup?.rev?.from === "query:linked"
        && !!expression
        && !!opts.model.psm?.query?.[expression]
    ) revision_query = opts.model.psm?.query?.[expression]

    else if( opts.model.psm?.backup?.rev?.from === "model" && !!expression ){
        let model = opts.parser.models.find( value => value.model === expression );
        if( !!model ) revision_query = `select * from ${oid(model.schema||"public")}.${oid(model.dbName||model.name)}`
    }

    const sys = oid( opts.parser.sys );
    let revision= "null";
    const relation = `${schema}.${table}`;
    if( opts.model.psm?.backup?.rev?.version )  revision = val( opts.model.psm?.backup?.rev.version );

    let always_query = DEFAULT_QUERY;
    let always_resolver = DEFAULT_RESOLVER;
    if( opts.model.psm?.backup?.rev?.apply === "ALWAYS" && !!revision_query && !!revision_resolver) {
        always_query = revision_query;
        always_resolver = revision_resolver;
        revision = `always-${opts.parser.migration}`;
    }

    const next =  `
      do $$
        declare
          _revision character varying := ${revision}::character varying;
          _relation character varying := ${val(relation)}::character varying;
        begin
          if _revision is not null and not exists(
            select 1
              from ${sys}.revision r
              where r.revision = _revision
                and operation = 'restore:data'
                and relation = _relation
          ) then 
            with __restore as (
              ${revision_query}
            ) insert into ${shadow}.${temp} (${ columns })
              select 
                  ${revision_resolver}
                from __restore r;
          elsif _revision is null then 
            with __restore as (
              ${always_query}
            ) insert into ${shadow}.${temp} (${ columns })
              select 
                  ${always_resolver}
                from __restore r;
          else 
            raise exception 'cannot restore revision';
          end if;
        end;
      $$;
    `.split("\n")
        .filter( value => !!value )
        .map( value => {
            if( value.startsWith("      ") ) return value.substring("      ".length)
            return value;
        })
        .join("\n");

    return {
        data: [
            notice( `RESTORE BACKUP FOR MODEL ${opts.model.model}` ),
            next,
            notice( `RESTORE BACKUP FOR MODEL ${opts.model.model} OK` ),
        ],
        registry: [
            notice( `REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model}` ),
            createRevision( opts.parser, {
                revision: opts.model.psm?.backup?.rev?.version,
                relation: relation,
                hash: migrationHash( opts.parser.migration, `restore:data-${relation}`),
                operation: `restore:data-${relation}`
            }).join("\n"),
            notice( `REGISTRY RESTORE OF BACKUP FOR MODEL ${opts.model.model} OK` ),
        ],
    }
}

export interface RestoreSerialOptions extends RestoreOptions {
    from:string
    to:string
    seq?:string
}
export function restoreSerialSQL( opts:RestoreSerialOptions) {
    let seq = "null";
    if( !!opts.seq ) seq = val( opts.seq );
    const args = [
        ` schema := ${val(opts.model.schema)}::character varying`,
        ` source := ${val(opts.source)}::character varying`,
        ` shadow := ${val(opts.parser.shadow)}::character varying`,
        ` temp := ${val(opts.model.temp)}::character varying`,
        ` "from" := ${val(opts.from)}::character varying`,
        ` "to" := ${val(opts.to)}::character varying`,
        ` "seq" := ${seq}::character varying`,
    ];
    return [
        notice( `RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model}`),
        `select * from ${oid(opts.parser.sys)}.restore_serial(\n  ${args.join(",\n  ")}\n);`,
        notice( `RESTORE SEQUENCE OF FIELD ${opts.to} FROM MODEL ${opts.model.model} OK`),
    ];

}

