import * as fs from 'node:fs';
import { parseCSV } from './lowlevel.ts';

const raw = fs.readFileSync(process.argv[2], 'utf-8');
const parsed = parseCSV(raw);

const end = raw.substring(raw.length - 512);
for (let i = 0; i < end.length; ++i) {
  console.info(end.charCodeAt(i).toString(16), end.charAt(i));
}

console.info(JSON.stringify(parsed, null, 2));
