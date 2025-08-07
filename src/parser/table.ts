import {ModelOptions} from "@prisma-psm/core";
import {PostgresParserOptions} from "./def";
import {oid} from "../utils/escape";
import {fieldParser} from "./table/field";
import {notice} from "./notice";

export function tableParser( model:ModelOptions, parser:PostgresParserOptions ){
    const fieldSQL = model.fields.map(fieldParser);
    return {
        drop_table: ()=> ([
            notice(`DROP TABLE ${model.schema}.${model.name} OF MODEL ${model.model}`),
            `drop table if exists ${ oid(model.schema)}.${ oid( model.name )} cascade;`,
            notice(`DROP TABLE ${model.schema}.${model.name} OF MODEL ${model.model} OK`),
        ]),
        allocate_table: ()=> [
            notice(`ALLOCATE TABLE ${model.temp} OF MODEL ${model.model}`),
            `alter table ${oid(parser.shadow)}.${oid(model.temp)} set schema ${oid(model.schema)};`,
            `alter table ${oid(model.schema)}.${oid(model.temp)} rename to ${oid(model.name)} ;`,
            notice(`ALLOCATE TABLE ${model.temp} OF MODEL ${model.model} OK`),
        ],
        create_table: ()=> {
            let fields:string = [ ...fieldSQL.filter( value => value.kind === "scalar" ).map( value => `  ${value.declaration}`)].join(",\n");
            return[
                notice(`CREATE TABLE ${model.temp} OF MODEL ${model.model}`),
                `create table ${oid(parser.shadow)}.${oid(model.temp)} (\n${ fields } \n);`,
                notice(`CREATE TABLE ${model.temp} OF MODEL ${model.model} OK`),
            ]
        }
    }
}