//filename: src/libs/migrate/def.ts

import {ModelOptions, PSMParserOptions} from "@prisma-psm/core";

export interface PostgresParserOptions extends PSMParserOptions{
    mode:"check"|"migrate"
}

export interface ParseModelResult {
    model: ModelOptions,
    backup: { create:string[], restore:string[], restore_serial:string[], clean:string[] }
    table: { create:string[], drop:string[], allocate:string[] }
    primary: {  create:string[], drop:string[] }
    foreign: { create:string[], drop:string[] }
    unique: { create:string[], drop:string[] }
    indexes: { create:string[], drop:string[] }
    dependencies:string[]
    dependents:string[]
}



