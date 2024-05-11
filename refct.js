import fs from 'fs';
let list = fs.readdirSync('./');
list = list.filter(a => a.endsWith('.js'));
list = list.filter(a => a !== 'index.js');
list = list.filter(a => a !== 'refct.js');
list.forEach(file => {
    let code = fs.readFileSync(file).toString();
    code = (code.split('\n').filter(line => !(line.startsWith(' ') || line.startsWith('\t')))).filter(line => {
        return !(
            line.startsWith('let ') ||
            line.startsWith('const ') ||
            line.startsWith('}') ||
            line.startsWith('import ') ||
            line.startsWith('export default ') ||
            line.trim() === ''
        );
    }).join('\n');
    let names = [];
    code.split('\n').forEach(line => {
        if (line.startsWith('export async function ')) {
            let name = (line.substring('export async function '.length, line.length).split('(')[0]);
            names.push(name);
        }
        else if (line.startsWith('export function ')) {
            let name = (line.substring('export function '.length, line.length).split('(')[0]);
            names.push(name);
        }
        else if (line.startsWith('export const ')) {
            let name = (line.substring('export const '.length, line.length).split(' ')[0]);
            names.push(name);
        }
        else if (line.startsWith('export let ')) {
            let name = (line.substring('export let '.length, line.length).split(' ')[0]);
            names.push(name);
        }
    });
    if (names.length) {
        console.log(`import {${names.join(', ')}} from './${file}'`);
    }
});