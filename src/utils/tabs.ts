export function noTab( batch:string[], tab:string){
    return batch.map( value => {
        return value.split("\n")
            .filter( value => !!value )
            .map( value => {
                if( value.startsWith(tab) ) return value.substring(tab.length)
                return value;
            })
            .join("\n")
    })
}



