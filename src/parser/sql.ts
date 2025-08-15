import {ParserResult} from "./parser";

export interface SQLOptions {
    mode: "check"|"migrate"|"core"
}
export function sql( opts: SQLOptions, response: ParserResult ) {
    let parsed  = Object.values( response.parsed );
    const commands:string[] = [];

    commands.push( `/*
      @PSM - Prisma SAFE MIGRATE
      @author zootakuxy
      @automation cli psm
      @mode ${ opts.mode }
      @date ${ new Date().toISOString() }
    */`);

    if( [ "core" ].includes(opts.mode)) commands.push( ...response.core.structure );
    if( [ "core" ].includes(opts.mode)) commands.push( ...response.core.functions );
    if( [ "migrate" ].includes( opts.mode)) commands.push( ...response.core.migration );
    if( [ "migrate", "check" ].includes( opts.mode)) commands.push( ...response.shadow.create );

    //Create Table
    parsed.filter( value => !!value.table.create.length ).forEach( value => {
        if( [ "migrate", "check" ].includes(opts.mode)) commands.push( ...value.table.create );
    })

    //Restore
    parsed.filter( value => !!value.backup?.restore?.data?.length ).forEach( value => {
        if( [ "migrate", "check" ].includes(opts.mode)) commands.push( ...value.backup?.restore?.data );
        if( [ "migrate" ].includes(opts.mode)) commands.push( ...value.backup.restore.registry );
    });
    parsed.filter( value => !!value.backup.restore_serial.length ).forEach( value => {
        if( [ "migrate", "check" ].includes(opts.mode)) commands.push( ...value.backup.restore_serial );
    });

    //Create indexes
    parsed.filter( value => !!value.indexes.create.length ).forEach( value => {
        if( ["migrate", "check" ].includes(opts.mode)) commands.push( ...value.indexes.create );
    })

    //Create constraints
    parsed.filter( value => !!value.primary.create.length ).forEach( value => {
        if( ["migrate", "check" ].includes(opts.mode)) commands.push( ...value.primary.create );
    })
    parsed.filter( value => !!value.unique.create.length ).forEach( value => {
        if( ["migrate", "check" ].includes(opts.mode)) commands.push( ...value.unique.create );
    })
    parsed.filter( value => !!value.foreign.create.length ).forEach( value => {
        if( ["migrate", "check" ].includes(opts.mode)) commands.push( ...value.foreign.create );
    });

    //Drops
    parsed.filter( value => !!value.foreign.drop.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.foreign.drop );
    });

    parsed.filter( value => !!value.unique.drop.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.unique.drop );
    })
    parsed.filter( value => !!value.primary.drop.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.primary.drop );
    })
    parsed.filter( value => !!value.indexes.drop.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.indexes.drop );
    })
    parsed.filter( value => !!value.table.drop.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.table.drop );
    })

    //Clean backup
    parsed.filter( value => !!value.table.allocate.length ).forEach( value => {
        if( opts.mode === "migrate" )  commands.push( ...value.table.allocate );
    });
    parsed.filter( value => !!value.backup.clean.length ).forEach( value => {
        if( opts.mode === "migrate" ) commands.push( ...value.backup.clean );
    });
    if( ["migrate", "check" ].includes( opts.mode )) commands.push( ...response.shadow.drop );

    return commands.join("\n");
}