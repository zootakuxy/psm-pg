import {MigrationOptions, PSMMigrated, PSMMigratedOptions, PSMMigrationResult} from "@prisma-psm/core";
import { Client, Query } from 'pg'
import {oid} from "../utils/escape";


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
export function migrated(opts:PSMMigratedOptions ):Promise<PSMMigrated>{
    return new Promise( (resolve, reject) => {
        const response:PSMMigrated = {
            messages: [],
        }
        const client = new Client( opts.url);
        client.connect( err => {
            if( err ) {
                response.messages?.push( `Connection failed: ${err.message}` );
                response.error = err;
            }

            const sys = oid( opts.sys || "sys" )

            const query = new Query( `
                select * from ${sys}.migration;
            `);

            query.on( "error", err => {
                response.error = err;
                response.messages?.push( `Load migrated failed: ${err.message}` );
                console.error( `Load migrated failed`, err)
                client.end( err1 => { });
                resolve( response );
            });

            query.on( "end", result => {
                response.success = true;
                response.migrated = result.rows;
                client.end( err1 => { });
                resolve( response );
            });

            client.on( "notice", notice => {
                console.log( `PSM NOTICE: ${notice.message}`);
            });

            client.query( query);
        });
    })
}