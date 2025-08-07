import {PostgresParserOptions} from "./def";
import {oid} from "../utils/escape";
import {ModelOptions} from "@prisma-psm/core";

export type IndexesOptions = {
    model:ModelOptions,
    name:string
    fields?:string[],
    algorithm?:string
}

function resolver(parser:PostgresParserOptions, opts:IndexesOptions){
    const name = oid( opts.name );
    let fieldsId:string = "";
    let algorithm:string = "";

    if(!!opts.fields?.length) fieldsId = opts.fields.map(oid).join(`, `);
    if(!!opts.algorithm) algorithm = ` using ${opts.algorithm}`;

    return {
        create_index:()=> `create index ${name} on ${oid(parser.shadow)}.${oid(opts.model.temp)}${algorithm} (${fieldsId});`,
        drop_index:()=> `drop index if exists ${name};`,
    }
}

export function indexesParser( model:ModelOptions, parser:PostgresParserOptions ) {
    const indexes = model.indexes.filter( field => {
        return field.type === "normal";
    }).map( index => {
        let localField = index.fields?.map( next => {
            const field = model.fields.find( value1 => value1.name === next.name );
            if( !field ) return next.name;
            return field.dbName||field.name;
        });
        let name = index.dbName || index.name;
        let schema  = model.schema || "public";
        if( !name ) name = `idx_${schema}_${model.name}_${localField.join( "_")}_by_prisma`;
        return resolver(parser, {
            algorithm: index.algorithm,
            fields: localField,
            name: name,
            model: model,
        });
    })

    return {
        create_index_key: ()=> {
            if( !indexes) return [];
            return indexes.map( value => value.create_index());
        },
        drop_index_key: ()=> {
            if( !indexes) return [];
            return indexes.map( value => value.drop_index());
        },

    };
}