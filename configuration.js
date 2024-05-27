/* global process */
/* eslint-disable no-unused-vars */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, errNotifier } from './commons.js'
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

export async function createVENV(silent = false, pythoncheck = null) {
    const pythonPath = await checkPythonForTermination(pythoncheck);
    if (!pythonPath) return;
    const venv_path = await getPythonVenvPath();
    if (venv_path) return true;
    const venvCandidate = await venvCandidatePath();
    if (!silent) await oraStart('Creating virtual environment for Python');
    if (!silent) if (disableOra) await oraStop();
    let res;
    if (isWindows()) res = await execAdv(`& '${pythonPath}' -m venv \\"${venvCandidate}\\"`); //dt
    else res = await execAdv(`"${pythonPath}" -m venv "${venvCandidate}"`)
    if (res.code === 0) {
        await setVarVal('PYTHON_VENV_PATH', venvCandidate);
        if (!silent) await oraSucceed(chalk.greenBright('Creating virtual environment for Python successed'));
        return true;
    } else {
        if (!silent) await oraFail(chalk.redBright('Creating VENV fail'));
        if (!silent) console.error(chalk.yellowBright(res.stdout))
        throw new Error('Creating VENV fail');
    }
}
export async function multipleChoicePrompt(key, prompt, options, force = false) {
    await errNotifier('Multiple option selection input request error occurred');
    if (!key) {
        await strout(chalk.bold(prompt));
        return options[await promptChoices(options, `Enter your choice`, { cancel: false })];
    }
    if (!force) if (await isKeyInConfig(key)) return;
    await strout(chalk.bold(prompt));
    setContinousNetworkTryCount(0);
    let index = await promptChoices(options, `Enter your choice`, { cancel: false });
    await setVarVal(key, options[index].toLowerCase(), force);
}
export async function openEndedPrompt(key, prompt, force = false) {
    await errNotifier('Select subjective option, input request error occurred');
    if (!force) if (await isKeyInConfig(key)) return;
    let answer = await ask_prompt_text(prompt);
    await setVarVal(key, answer, force);
}






















export async function disableAllVariable() {
    const variables = ['USE_REVIEW', 'UPDATE_CHECK', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'USE_LLM', 'ANTHROPIC_API_KEY', 'PYTHON_VENV_PATH', 'OLLAMA_PROXY_SERVER', 'OLLAMA_MODEL', 'OPENAI_MODEL', 'GROQ_MODEL', 'ANTHROPIC_MODEL'];
    for (const variableName of variables) {
        await disableVariable(variableName);
    }
}
export async function disableVariable(variableName) {
    try {
        const filePath = await getRCPath();
        let content = await readRCDaata();
        if (!content) throw null;
        let lines = content.split('\n');
        lines = lines.map(line => {
            const lineback = line;
            while (line.indexOf('  ') > -1) line = line.split('  ').join(' ');
            if (line.trim().startsWith(`export ${variableName}=`)) return ``;
            if (line.trim().startsWith(`# export ${variableName}=`)) return ``;
            return lineback;
        });
        content = lines.join('\n');
        while (content.indexOf('\n\n') > -1) content = content.split('\n\n').join('\n');
        if (filePath) await fsPromises.writeFile(filePath, content);
    } catch (error) {
        printError(error);
    }

}

export async function getRCPath() {
    async function innerWork() {
        if (isWindows()) {
            const pathd = `${os.homedir()}/.aiexe.configuration`;
            try { fs.mkdirSync(pathd); } catch (errorInfo) { printError(errorInfo); }
            if (!fs.existsSync(pathd)) return '';
            const filepath = `${pathd}/configuration`;
            try { fs.readFileSync(filepath); } catch (errorInfo) { printError(errorInfo); fs.appendFileSync(filepath, ''); }
            return filepath;
        } else {
            const shell = process.env.SHELL;
            let filePath;
            const lastName = shell.split('/').at(-1);
            if (lastName === ('zsh')) {
                filePath = path.join(os.homedir(), '.zshrc');
            } else if (lastName === ('bash')) {
                const bashProfilePath = path.join(os.homedir(), '.bash_profile');
                const bashrcPath = path.join(os.homedir(), '.bashrc');
                async function checkFilePath(bashProfilePath, bashrcPath) {
                    let filePath;
                    try {
                        await fsPromises.access(bashProfilePath, fsPromises.constants.F_OK);
                        filePath = bashProfilePath;
                    } catch (errorInfo) {
                        printError(errorInfo);
                        filePath = bashrcPath;
                    }
                    return filePath;
                }
                filePath = await checkFilePath(bashProfilePath, bashrcPath);
            } else {
                return;
            }
            return filePath;
        }
    }
    let rcPath = await innerWork();
    if (!rcPath) rcPath = '';
    if (rcPath && !await is_file(rcPath)) rcPath = '';
    if (!rcPath) {
        const pathd = `${os.homedir()}/.aiexe.configuration`;
        try { fs.mkdirSync(pathd); } catch (errorInfo) { printError(errorInfo); }
        if (!fs.existsSync(pathd)) return '';
        const filepath = `${pathd}/configuration`;
        try { fs.readFileSync(filepath); } catch (errorInfo) { printError(errorInfo); fs.appendFileSync(filepath, ''); }
        return filepath;
    }
    return rcPath;
}
export async function readRCDaata() {
    let currentContents = '';
    try {
        const path = await getRCPath();
        if (path) currentContents = await fsPromises.readFile(path, 'utf8');
    } catch (err) {
        printError(err);
        currentContents = '';
    }
    if (!currentContents) currentContents = '';
    return currentContents;
}


export async function getVarVal(key) {
    try {
        const rcPath = await getRCPath();
        if (!rcPath) return null;
        const contents = await fs.promises.readFile(rcPath, 'utf8');
        const pattern = new RegExp(`^\\s*export\\s+${key}\\s*=\\s*['"]?([^'"\n]+)['"]?`, 'm');
        const match = pattern.exec(contents);
        return match ? match[1].trim() : null;
    } catch (err) {
        printError(err);
        return null;
    }
}

export async function findMissingVars(envConfig) {
    let currentContents = await readRCDaata();
    const list = [];
    currentContents = currentContents.split('\n');
    for (const [key, value] of Object.entries(envConfig)) {
        const pattern = new RegExp(`^\\s*export\\s+${key}\\s*=\\s*['"]?([^'"\n]+)['"]?`, 'm');
        if (!currentContents.some(line => pattern.test(line))) list.push(key);
    }
    return list;
}

export async function isKeyInConfig(keyname) {
    const list = await findMissingVars({ [keyname]: true });
    return list[0] !== keyname;
}



export async function setVarVal(key, value, force = false) {
    if (!force && await isKeyInConfig(key)) return;
    if (force && await isKeyInConfig(key)) await disableVariable(key);
    const typeone = str => {
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (!(ch >= 'A' && ch <= 'Z') && // 대문자 알파벳
                !(ch >= 'a' && ch <= 'z') && // 소문자 알파벳
                !(ch >= '0' && ch <= '9') && // 숫자
                ch !== '-' && ch !== '_' && ch !== '/' && ch !== '.' && ch !== ':' && (isWindows() ? ch !== '\\' : '/')) {
                return false;
            }
        }
        return true;
    };
    const typespace = str => {
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === '"') return false;
        }
        return true;
    };
    const regChecker = {
        UPDATE_CHECK: typeone,
        USE_LLM: typeone,
        USE_REVIEW: typeone,
        GOOGLE_API_KEY: typeone,
        OPENAI_API_KEY: typeone,
        GROQ_API_KEY: typeone,
        ANTHROPIC_API_KEY: typeone,
        ANTHROPIC_MODEL: typeone,
        OLLAMA_PROXY_SERVER: typeone,
        OLLAMA_MODEL: typeone,
        OPENAI_MODEL: typeone,
        GROQ_MODEL: typeone,
        PYTHON_VENV_PATH: typespace,
    };
    if (!regChecker[key]) return;
    if (!regChecker[key](value)) return;
    const rcPath = await getRCPath();
    const cmd = `export ${key}="${value}"`;
    if (rcPath) await fsPromises.appendFile(rcPath, `\n${cmd}\n`);

}