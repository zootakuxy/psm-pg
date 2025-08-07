import {FieldOption} from "@prisma-psm/core";
import {oid} from "../../utils/escape";
import {parseDefault,parseType} from "./engine";

export function fieldParser(opts:FieldOption){
    const name:string = oid( opts.name );
    const datatype = parseType( opts );
    let defaults:string = "", nonnull:string = "";
    if( opts.isRequired ) nonnull = " not null";
    if( opts.hasDefaultValue  ){
        defaults = parseDefault( opts, datatype.type );
    }
    if( opts.hasDefaultValue && !!defaults.length ) {
        defaults = ` default ${defaults}`;
    }
    return {
        declaration: `${name} ${datatype.type}${nonnull}${defaults}`,
        serial: datatype.serial,
        name: opts.name,
        kind: opts.kind,
    };
}