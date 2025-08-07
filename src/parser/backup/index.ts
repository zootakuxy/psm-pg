import {ModelOptions} from "@prisma-psm/core";
import {PostgresParserOptions} from "../def";
import {restoreBackupSQL, restoreSerialSQL} from "./engine";
import {fieldParser} from "../table/field";

export function backupParser( model:ModelOptions, parser:PostgresParserOptions ){
    const fieldSQL = model.fields.map(fieldParser);

    return {
        restore_backup: () => restoreBackupSQL({
            source: model.name,
            model: model,
            parser: parser,
        }),
        restore_serial: () => {
            const sequences:string[] = [];

            fieldSQL.filter(f => f.serial).map(f =>  restoreSerialSQL({
                source: model.name,
                parser: parser,
                model: model,
                from: f.name,
                to: f.name,
            })).forEach( value => {
                sequences.push( ...value );
            });
            return sequences;
        },
    }
}