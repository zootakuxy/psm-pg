import {ModelOptions} from "@prisma-psm/core";
import {PostgresParserOptions} from "./def";
import {tableParser} from "./table";
import {indexesParser} from "./indexes";
import {constraintsParser} from "./constraint";
import {backupParser} from "./backup";

export function modelParser( model:ModelOptions, parser:PostgresParserOptions ){
    const depends = model.fields.filter( field => {
        return field.kind === "object"
            && !!field.relationName
            && field.relationFromFields?.length
            && field.relationToFields?.length
            ;
    }).map( next => {
        return next.type;
    })
    return {


        depends: ()=> {
            if( !depends) return [];
            return depends;
        },
        ... backupParser(model, parser),
        ... tableParser( model, parser),
        ... indexesParser( model, parser),
        ... constraintsParser( model, parser )
    }
}