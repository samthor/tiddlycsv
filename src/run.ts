import * as fs from 'node:fs';
import { parseCSV } from './lowlevel.ts';

const raw = fs.readFileSync(process.argv[2], 'utf-8');
const parsed = parseCSV(raw);

console.info(JSON.stringify(parsed, null, 2));
console.info('rows', parsed.length);
