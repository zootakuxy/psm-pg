import {FieldOption} from "@prisma-psm/core";
import {val} from "../../utils/escape";

interface DefaultsOptions {
    name:string,
    args:string[]
}


const PRISMA_DEFAULTS = {
    now:( opts:DefaultsOptions) =>{
        return `now()`
    },

    uuid:( opts:DefaultsOptions ) => {
        return `gen_random_uuid()`
    },
    autoincrement:( opts:DefaultsOptions ) => {
        return ``
    },
    dbgenerated: ( opts:DefaultsOptions ) => {
        return ` ${ opts.args}`
    }
}

const PRISMA_TYPE_MAP = {
    String: "varchar",
    DateTime: "timestamptz",
    Json: "json",
    Float: "double precision",
    SmallInt: "int2",
    Int: "int4",
    BigInt: "int8",
    Boolean: "boolean",
    Bytes: "bytea",
    Decimal: "numeric",
    Uuid: "uuid",
    Timestamptz: "timestamptz",
    JsonB: "jsonb",
    VarChar: "varchar",
    Integer: "int4",
    Oid: "oid",
}


export function parseType ( opts:FieldOption ){
    let type:string = "";
    let autoincrement:boolean = opts?.default?.name === "autoincrement";
    let native = opts.nativeType?.[0];
    if( !!native ) native = PRISMA_TYPE_MAP[native]||native;

    let primatype = opts.type;
    let datatype = native || PRISMA_TYPE_MAP[primatype] || primatype;
    let serial = false;


    if( datatype === "int2" && autoincrement ){
        type = "serial2";
        serial = true;
    }
    else if( datatype === "int4" && autoincrement ){
        type = "serial";
        serial = true;
    }
    else if( datatype === "int8" && autoincrement ){
        type = "serial8";
        serial = true;
    }
    else if( datatype === "oid" && autoincrement ){
        type = "serial";
        serial = true;
    }
    else if( !!opts.nativeType ) {
        let args = "";
        if( opts.nativeType?.[1].length > 0 ) args = `(${ opts.nativeType?.[1].join(", ") })`
        type = `${native}${ args }`
    } else if( !!PRISMA_TYPE_MAP[opts.type]) {
        type = PRISMA_TYPE_MAP[opts.type];
    } else type = opts.type;

    if( !type ) type = "text";
    if( opts.isList ) return {
        type: `${type}[]`,
        serial
    }
    return {
        type: type,
        serial: serial
    };
}


export function parseDefault ( opts:FieldOption, typed:string ){
    let defaults = "";
    if( opts.hasDefaultValue && !!opts.default && Array.isArray( opts.default)) {
        defaults = opts.default.map( value => val( value ) ).join(", ");
        defaults = ` array[ ${defaults} ]`;
    } else if( opts.hasDefaultValue && !!opts.default && typeof opts.default === "object" && !Array.isArray( opts.default)) {
        defaults = PRISMA_DEFAULTS[ opts.default.name ]( opts.default );
    } else if( opts.hasDefaultValue && !!opts.default ) {
        defaults = val( opts.default+"" );
    }
    if( !defaults?.length ) return "";
    return `${defaults}::${typed}`;
}

