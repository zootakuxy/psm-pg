import {PostgresParserOptions} from "./def";
import {oid} from "../utils/escape";
import {ModelOptions} from "@prisma-psm/core";
import {notice} from "./notice";

export type ConstraintsOptions = {
    model:ModelOptions,
    name:string
    key: "primary"|"foreign"|"unique"|"check"|"index",
    fields?:string[],
    refModel?:string
    algorithm?:string
    refModelSchema?:string
    refFields?:string[],
    parser:PostgresParserOptions
}
function resolver(parser:PostgresParserOptions, opts:ConstraintsOptions){
    const name = oid( opts.name );
    let refFields:string = "";
    let fieldsId:string = "";
    let refModel:string = "";
    let refModelSchema:string = "";

    if(!!opts.refFields?.length) refFields = opts.refFields.map( oid ).join(`, `);
    if(!!opts.fields?.length) fieldsId = opts.fields.map(oid).join(`, `);
    if(!!opts.refModel) refModel = oid(opts.refModel);
    if(!!opts.refModelSchema) refModelSchema = oid(opts.refModelSchema);


    return {
        create_primary:()=> ([
            notice( `CREATE PRIMARY KEY ${name} OF MODEL ${opts.model.model}`),
            `alter table if exists ${oid(parser.shadow)}.${oid(opts.model.temp)} add constraint ${name} primary key (${fieldsId});`,
            notice( `CREATE PRIMARY KEY ${name} OF MODEL ${opts.model.model} OK!`),
        ]),
        create_foreign:()=> ([
            notice( `CREATE FOREIGN KEY ${name} OF MODEL ${ opts.model.model}`),
            `alter table if exists ${oid(parser.shadow)}.${oid(opts.model.temp)} add constraint ${name} foreign key (${fieldsId}) references ${refModelSchema}.${refModel} ( ${refFields} );`,
            notice( `CREATE FOREIGN KEY ${name} OF MODEL ${ opts.model.model} OK!`),
        ]),
        create_unique:()=> ([
            notice( `CREATE UNIQUE KEY ${name} OF MODEL ${ opts.model.model}`),
            `alter table if exists ${oid(parser.shadow)}.${oid(opts.model.temp)} add constraint ${name} unique (${fieldsId});`,
            notice( `CREATE UNIQUE KEY ${name} OF MODEL ${ opts.model.model} OK!`),
        ]),
        drop:()=> ([
            notice( `DROP CONSTRAINT KEY ${name} OF MODEL ${ opts.model.model}`),
            `alter table if exists ${oid(opts.model.schema)}.${oid(opts.model.name)} drop constraint if exists ${name} cascade;`,
            notice( `DROP CONSTRAINT KEY ${name} OF MODEL ${ opts.model.model} OK!`),
        ]),
    }
}

export function constraintsParser( model:ModelOptions, parser:PostgresParserOptions ) {
    const primary = (()=>{
        const index =  model.indexes.find( value => value.type === "id" );
        if( !index ) return;
        let localField = index.fields?.map( next => {
            const field = model.fields.find( value1 => value1.name === next.name );
            if( !field ) return next.name;
            return field.dbName||field.name;
        });
        let name = index.dbName || index.name;
        if( !name ) name = `pk_${model.name}_${ localField.join( "_" )}_by_prisma`;

        return resolver(parser, {
            key: "primary",
            fields: localField,
            name: name,
            parser: parser,
            model: model,
        });
    })()

    const unique = model.indexes.filter( field => {
        return field.type === "unique";
    }).map( index => {
        let localField = index.fields?.map( next => {
            const field = model.fields.find( value1 => value1.name === next.name );
            if( !field ) return next.name;
            return field.dbName||field.name;
        });
        let name = index.dbName || index.name;
        if( !name ) name = `uk_${model.name}_${ localField.join( "_" )}_by_prisma`;
        return resolver(parser, {
            key: "unique",
            fields: localField,
            name: name,
            parser: parser,
            model: model
        });
    })

    const foreign = model.fields.filter( field => {
        return field.kind === "object"
            && !!field.relationName
            && field.relationFromFields?.length
            && field.relationToFields?.length
            ;
    }).map( next => {
        let localField = next.relationFromFields?.map( name => {
            const field = model.fields.find( value1 => value1.name === name );
            if( !field ) return name;
            return field.dbName||field.name;
        });
        let reference = parser.models.find( value => value.model === next.type );
        if( reference?.psm?.view ) return null;
        let referenceField = next.relationToFields?.map( name => {
            if( !reference ) return name;
            const field = reference.fields.find( value1 => value1.name === name );
            if( !field ) return name;
            return field.dbName||field.name;
        });

        let name = next.relationName;
        let ref = reference?.temp;
        if( !name ) name = `fk_${model.name}_${referenceField?.join("_")}_to_${ref}_by_prisma`;


        let refModelSchema = parser.shadow;

        return resolver( parser, {
            key: "foreign",
            fields: localField,
            name: name,
            refModel: ref,
            refFields: referenceField,
            refModelSchema: refModelSchema,
            parser: parser,
            model: model,
        });
    }).filter( value => !!value );

    const maps = ( list:any, key:string):string[]=>{
        const fk:string[] = [];
        if( !list ) return[];
        list.forEach( value => {
            if( !value ) return;
            fk.push( ...value?.[key]());
        });
        return fk;
    }
    return {
        create_primary_keys: ()=> {
            const  lll = maps( [primary], "create_primary" );
            return lll;
        },
        drop_primary_keys: ()=> {
            return maps( [primary], "drop" );

        },
        create_foreign_key: ()=> {
            return maps( foreign, "create_foreign" );
        },
        drop_foreign_key: ()=> {
            return maps( foreign, "drop" );
        },
        create_unique_key: ()=> {
            return maps( unique, "create_unique" );
        },
        drop_unique_key: ()=> {
            return maps( unique, "drop" );
        },
    };
}