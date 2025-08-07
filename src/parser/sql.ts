import {ParserResult} from "./parser";

export function sql(response: ParserResult ) {
    let parsed  = Object.values( response.parsed );
    const commands:string[] = [];

    commands.push( `/*
      @PSM - Prisma SAFE MIGRATE
      @author zootakuxy
      @automation cli psm
      @mode ${response.options.mode}
      @date ${ new Date().toISOString() }
    */`);

    commands.push( ...response.core );
    commands.push( ...response.shadow.create );

    //Create Table
    parsed.filter( value => !!value.table.create.length ).forEach( value => {
        commands.push( ...value.table.create );
    })

    //Restore
    parsed.filter( value => !!value.backup.restore.length ).forEach( value => {
        commands.push( ...value.backup.restore );
    });
    parsed.filter( value => !!value.backup.restore_serial.length ).forEach( value => {
        commands.push( ...value.backup.restore_serial );
    });

    //Create indexes
    parsed.filter( value => !!value.indexes.create.length ).forEach( value => {
        commands.push( ...value.indexes.create );
    })

    //Create constraints
    parsed.filter( value => !!value.primary.create.length ).forEach( value => {
        commands.push( ...value.primary.create );
    })
    parsed.filter( value => !!value.unique.create.length ).forEach( value => {
        commands.push( ...value.unique.create );
    })
    parsed.filter( value => !!value.foreign.create.length ).forEach( value => {
        commands.push( ...value.foreign.create );
    });

    //Drops
    parsed.filter( value => !!value.foreign.drop.length ).forEach( value => {
        commands.push( ...value.foreign.drop );
    })
    parsed.filter( value => !!value.unique.drop.length ).forEach( value => {
        commands.push( ...value.unique.drop );
    })
    parsed.filter( value => !!value.primary.drop.length ).forEach( value => {
        commands.push( ...value.primary.drop );
    })
    parsed.filter( value => !!value.indexes.drop.length ).forEach( value => {
        commands.push( ...value.indexes.drop );
    })
    parsed.filter( value => !!value.table.drop.length ).forEach( value => {
        commands.push( ...value.table.drop );
    })

    //Clean backup
    parsed.filter( value => !!value.table.allocate.length ).forEach( value => {
        commands.push( ...value.table.allocate );
    });
    parsed.filter( value => !!value.backup.clean.length ).forEach( value => {
        commands.push( ...value.backup.clean );
    });
    commands.push( ...response.shadow.drop );

    return commands.join("\n");
}