/* eslint-disable no-unused-vars */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv, getPowerShellPath, generateModuleInstallCode, shelljs_exec } from './codeExecution.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print, strout } from './oraManager.js'
import promptTemplate from './translationPromptTemplate.js';
import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import axios from 'axios';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import ora from 'ora';
import boxen from 'boxen';
import readlineSync from 'readline-sync';
import figlet from 'figlet';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { promises as fsPromises } from 'fs';
import os from 'os';



export async function isCorrectCode(python_code, list, justStripFench, moduleInstall = true) {
    const rtcode = { python_code: '', err: '', };
    if ((typeof python_code) !== 'string') return justStripFench ? '' : rtcode;
    if (python_code.trim() === '') return justStripFench ? '' : rtcode;
    if (list.filter(a => a === '').length === 0) list.push('');
    function genTicks(n) { return '`'.repeat(n); }
    let splited = python_code.split(threeticks);
    if (splited.length === 3) {
        splited[0] = '';
        splited[2] = '';
        python_code = splited.join(threeticks);
    }
    let endPadding = 0;
    let startPadding = 0;
    const loopcount = 10;
    for (let i = loopcount; i > 0; i--) {
        let ticks = genTicks(i);
        let endsWithTicks = python_code.trim().endsWith(ticks);
        if (endsWithTicks) {
            endPadding = ticks.length;
            break;
        }
    }
    if (!startPadding) {
        list = [...list.map(a => a.toLowerCase()), ...list.map(a => a.toUpperCase())];
        for (let f = 0; f < list.length; f++) {
            let word = list[f];
            for (let i = loopcount; i > 0; i--) {
                let ticks = genTicks(i);
                let startsWithTicksWithPython = python_code.trim().toLowerCase().startsWith(ticks + word);
                if (startsWithTicksWithPython) {
                    startPadding = (ticks + word).length;
                    break;
                }
            }
            if (startPadding) break;
        }
    }
    python_code = python_code.trim().substring(startPadding, python_code.trim().length - endPadding)
    function removeMinIndentation(text) {
        const lines = text.split('\n');
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim().length === 0) continue;
            const leadingSpaces = line.match(/^ */)[0].length;
            if (leadingSpaces < minIndent) {
                minIndent = leadingSpaces;
            }
        }
        return lines.map(line => line.slice(minIndent)).join('\n');
    }
    if (python_code.trim()) {
        python_code = removeMinIndentation(python_code);
        python_code = python_code.trim();
        if (justStripFench) {
            return python_code;
        } else {
            const venv_path = await getPythonVenvPath();
            if (venv_path) {
                await fsPromises.writeFile(`${venv_path}` + '/._tmpcode.py', python_code);
                let json = false;
                try {
                    JSON.parse(python_code);
                    json = true;
                } catch (e) {
                    printError(e);

                }
                const err = json ? 'not python code but just value' : await code_validator(`${venv_path}` + '/._tmpcode.py');
                if (err) {
                    rtcode.err = err;
                    rtcode.syntaxtest = { code: python_code, error: err };
                } else {
                    moduleInstall = !true;
                    if (moduleInstall) {
                        let importcode = await generateModuleInstallCode(`${venv_path}` + '/._tmpcode.py');
                        rtcode.python_code = importcode.count ? [
                            `# ${'-'.repeat(10)} Missing Module Installataion ${'-'.repeat(10)}`,
                            `# The following module installation code installs any missing modules required for this Python code.`,
                            `# Please ensure that the module names in the installation commands are correct before running the code.`,
                            importcode.code,
                            `# ${'-'.repeat(10)}------------------------------${'-'.repeat(10)}`,
                            python_code
                        ].join('\n') : python_code;
                    } else {
                        rtcode.python_code = python_code;
                    }
                }
            }
        }
    }
    return justStripFench ? '' : rtcode;
}
export async function code_validator(filepath) { // OK
    const python_interpreter = await getPythonPipPath();
    const pythonCmd = `'${python_interpreter}' -m py_compile '${filepath}'`;
    const runcmd = await makeVEnvCmd(pythonCmd);
    return new Promise(resolve => {
        shelljs_exec(runcmd, { silent: true }, function (code, stdout, stderr) {
            resolve(stderr.trim())
        });
    });
}

export async function makeVEnvCmd(pythonCmd, spawn = false) {
    const activateCmd = await getActivatePath();
    pythonCmd = pythonCmd.split(`"`).join(`\\"`);
    if (spawn) {
        if (isWindows()) {
            let nulluse = isElectron();// && false;
            const powershell = await getPowerShellPath();
            // return [`${powershell}`, [`${powershell}`, `-NoProfile`, `-ExecutionPolicy`, `Bypass`, `-Command`, `"& '${activateCmd}'; & ${pythonCmd}${nulluse ? ` < nul` : ''}"`]];
            return [
                `${powershell}`,
                [
                    `${powershell}`,
                    `-NoProfile`,
                    `-ExecutionPolicy`,
                    `Bypass`,
                    `-Command`,
                    `"& '${activateCmd}'; & ${pythonCmd}"${false ? `; $null = [System.Console]::In.Close()` : ''}`
                ]
            ];
            // return [`${powershell}`, [`${powershell}`, `-NoProfile`, `-ExecutionPolicy`, `Bypass`, `-Command`, `"& '${activateCmd}'; & ${pythonCmd}${nulluse ? ` < nul` : ''}"`]];
        } else {
            let nulluse = isElectron();// && false;
            const bash_path = !isWindows() ? await which(`bash`) : null;
            return [`${bash_path}`, ['-c', `"${bash_path}" -c "source '${activateCmd}' && ${pythonCmd}${nulluse ? ` < /dev/null` : ''}"`]]
        }
    } else {
        if (isWindows()) {
            const powershell = await getPowerShellPath();
            return `"${powershell}" -NoProfile -ExecutionPolicy Bypass -Command "& {$env:PYTHONIOENCODING='utf-8'; & '${activateCmd}'}; & ${pythonCmd}" < nul`;
        } else {
            const bash_path = !isWindows() ? await which(`bash`) : null;
            return `"${bash_path}" -c "source '${activateCmd}' && ${pythonCmd} < /dev/null"`;
        }
    }
}