import {val} from "../utils/escape";

export function notice(message:string) {
    return `do $$ begin raise notice '%', ${val( message )}; end $$;`
}