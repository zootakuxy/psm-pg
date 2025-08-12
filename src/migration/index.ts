import {MigrationOptions, PSMMigrationResult} from "@prisma-psm/core";
import { Client, Query } from 'pg'


export function migrate(opts:MigrationOptions ):Promise<PSMMigrationResult>{
    return new Promise( (resolve, reject) => {
        const response:PSMMigrationResult = {
            messages: []
        }
        const client = new Client( opts.url);
        client.connect( err => {
            if( err ) {
                response.messages?.push( `Connection failed: ${err.message}` );
                response.error = err;
            }

            const query = new Query( opts.sql );
            query.on( "error", err => {
                response.error = err;
                response.messages?.push( `${opts.label} migration failed: ${err.message}` );
                console.error( `${opts.label} migration failed`, err)
                client.end( err1 => { });
                resolve( response );
            });

            query.on( "end", result => {
                response.success = true;
                client.end( err1 => { });
                resolve( response );
            });

            query.on( "row", (row, result) => {

            });

            client.on( "notice", notice => {
                console.log( `PSM NOTICE: ${notice.message}`);
            });

            client.query( query);
        });
    })
}