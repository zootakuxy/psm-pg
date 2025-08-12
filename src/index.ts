import {sql} from "./parser/sql";
import {PSMDriver, ModelOptions} from "@prisma-psm/core";
import {parser} from "./parser/parser";
import {migrate} from "./migration";




function prepare( model:ModelOptions ){
    if( !model.schema ) model.schema = "public";
}
const driver :PSMDriver = {
    migrator: opts => ({
        migrate: () => migrate({ sql: opts.migrate, url: opts.url, label: "NEXT" }),
        test: () => migrate({ sql: opts.check, url: opts.url, label: "TEST" }),
    }),
    generator: opts => ({
        migrate: () => sql(parser({ ...opts, mode: "migrate"})),
        check: () => sql(parser({ ...opts, mode: "check"})),
    }),
    prepare
}
export = driver
