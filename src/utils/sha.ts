import * as crypto from 'crypto';
export function migrationHash(migration:string, data:string) {
    const base = crypto.createHash('md5').update(migration).digest('hex');
    const content = crypto.createHash('sha256').update(data).digest('hex');
    return `${base}:${content}`;
}