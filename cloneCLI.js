import fs from 'fs';
const data = fs.readFileSync('index.js', 'utf-8');
const lines = data.split('\n');
let inBlock = true;
let outputLines = [];
for (let line of lines) {
    let add = true;
    if (line.trim() === '//::ELECTRONCODE:://') {
        inBlock = !inBlock;
        add = false;
    }
    if (!inBlock) add = false;
    if (add) outputLines.push(line);
}
fs.writeFileSync('_temp.js', outputLines.join('\n'));