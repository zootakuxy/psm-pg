//filename: src/libs/migrate/index.ts

import {create_shadow, drop_shadow} from "./shadow";
import {createMigration, prepareCore} from "./sys";
import {reverseDependencies} from "./dependencies";
import {modelParser} from "./modelParser";
import {createFunctionRestoreSerial} from "./backup/engine";
import {ParseModelResult, PostgresParserOptions} from "./def";


export interface ParserResult {
    options:PostgresParserOptions
    models: string[],
    core: string[]
    shadow: { create:string[],  drop:string[] },
    parsed: {
        [p:string]:ParseModelResult
    }
}

export function parser( opts:PostgresParserOptions){
    const schemas = new Set();
    let response:ParserResult = {
        options: opts,
        parsed:{},
        models:[],
        core:[
            ...prepareCore(opts),
            ...createMigration(opts),
            ...createFunctionRestoreSerial(opts)
        ],
        shadow:{
            create: [...create_shadow( opts )],
            drop: [...drop_shadow( opts )],
        }
    }

    opts.models.forEach( (model, index) => {
        model.temp = `temp_${index}_${model.name}`;

        schemas.add( model.schema )

        if( model.psm?.view ) return;
        model.indexes = opts.indexes.filter( value => value.model === model.name );
        const modelDDL = modelParser( model, opts );
        const parsed:ParseModelResult = {
            model: model,
            backup:{ create:[], restore:[], restore_serial:[], clean:[] },
            table:{ create:[], drop:[], allocate:[]},
            primary:{ create:[], drop:[] },
            foreign:{ create:[], drop:[] },
            unique:{ create:[], drop:[] },
            indexes:{ create:[], drop:[] },
            dependencies:[],
            dependents:[]
        }

        let backup = true;
        if( model.psm?.backup?.skip ) backup = false;

        if( backup ){
            parsed.backup.restore.push( ...modelDDL.restore_backup() );
            parsed.backup.restore_serial.push( ...modelDDL.restore_serial());
        }

        parsed.table.create.push( ...modelDDL.create_table());
        parsed.primary.create.push( ...modelDDL.create_primary_keys())
        parsed.foreign.create.push( ...modelDDL.create_foreign_key() );
        parsed.unique.create.push( ...modelDDL.create_unique_key());
        parsed.indexes.create.push( ...modelDDL.create_index_key());

        if( opts.mode === "migrate" ){
            parsed.table.drop.push( ...modelDDL.drop_table());
            parsed.table.allocate.push( ...modelDDL.allocate_table());
            parsed.primary.drop.push(...modelDDL.drop_primary_keys());
            parsed.foreign.drop.push( ...modelDDL.drop_foreign_key());
            parsed.unique.drop.push( ...modelDDL.drop_unique_key());
            parsed.indexes.drop.push( ...modelDDL.drop_index_key());
        }

        parsed.dependencies.push( ...modelDDL.depends());
        response.parsed[model.name] = parsed;
        response.models.push( model.name)
    });
    reverseDependencies( Object.values( response.parsed ))
    return response;
}
