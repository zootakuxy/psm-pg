import {sql} from "./parser/sql";
import {PSMDriver, ModelOptions} from "@prisma-psm/core";
import {parser} from "./parser/parser";
import {migrationTest} from "./migration/test";




function prepare( model:ModelOptions ){
    if( !model.schema ) model.schema = "public";
}
const driver :PSMDriver = {
    migrator: opts => ({
        migrate: () => migrationTest({ sql: opts.migrate, url: opts.url }),
        test: () => migrationTest({ sql: opts.check, url: opts.url }),
    }),
    generator: opts => ({
        migrate: () => sql(parser({ ...opts, mode: "migrate"})),
        check: () => sql(parser({ ...opts, mode: "check"})),
    }),
    prepare
}
export = driver
