/* global process */
/* eslint-disable no-unused-vars */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices } from './commons.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print } from './oraManager.js'
import promptTemplate from './translationPromptTemplate.js';
import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import axios from 'axios';
import shelljs from 'shelljs';
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

export async function createVENV() {
    const pythonPath = await checkPythonForTermination();
    if (!pythonPath) return;
    const venvCandidate = await venvCandidatePath();
    oraStart('Creating virtual environment for Python');
    if (disableOra) oraStop();
    let res;
    if (isWindows()) res = await execAdv(`& '${pythonPath}' -m venv \\"${venvCandidate}\\"`); //dt
    else res = await execAdv(`"${pythonPath}" -m venv "${venvCandidate}"`)
    if (res.code === 0) {
        await setVarVal('PYTHON_VENV_PATH', venvCandidate);
        oraSucceed(chalk.greenBright('Creating virtual environment for Python successed'));
    } else {
        oraFail(chalk.redBright('Creating VENV fail'));
        console.error(chalk.yellowBright(res.stdout))
        throw new Error('Creating VENV fail');
    }
}

export async function doctorCheck(display = false) {
    const USE_LLM = await getVarVal('USE_LLM');
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    const python_interpreter = await checkPythonForTermination();
    let doctorOk = true;
    if (!python_interpreter) {
        if (display) console.error(chalk.yellowBright(" - Python is required to use this app."));
        doctorOk = false;
    }
    if (!USE_LLM) {
        if (display) console.error(chalk.yellowBright(' - The "USE_LLM" environment variable is missing but required to specify the LLM vendor.'));
        doctorOk = false;
    }
    if (USE_LLM === 'gemini') {
        if (!await getVarVal('GOOGLE_API_KEY')) {
            if (display) console.error(chalk.yellowBright(' - The "GOOGLE_API_KEY" environment variable is missing but required.'));
            doctorOk = false;
        }
    }
    if (USE_LLM === 'groq') {
        if (!await getVarVal('GROQ_MODEL')) {
            if (display) console.error(chalk.yellowBright(" - The 'GROQ_MODEL' environment variable is required and must specify the name of the LLM model."));
            doctorOk = false;
        }
        if (!await getVarVal('GROQ_API_KEY')) {
            if (display) console.error(chalk.yellowBright(' - The "GROQ_API_KEY" environment variable is missing but required.'));
            doctorOk = false;
        }
    }
    if (USE_LLM === 'anthropic') {
        if (!await getVarVal('ANTHROPIC_API_KEY')) {
            if (display) console.error(chalk.yellowBright(' - The "ANTHROPIC_API_KEY" environment variable is missing but required.'));
            doctorOk = false;
        }
        if (!await getVarVal('ANTHROPIC_MODEL')) {
            if (display) console.error(chalk.yellowBright(' - The "ANTHROPIC_MODEL" environment variable is missing but required.'));
            doctorOk = false;
        }
    }
    if (USE_LLM === 'openai') {
        if (!await getVarVal('OPENAI_MODEL')) {
            if (display) console.error(chalk.yellowBright(" - The 'OPENAI_MODEL' environment variable is required and must specify the name of the LLM model."));
            doctorOk = false;
        }
        if (!await getVarVal('OPENAI_API_KEY')) {
            if (display) console.error(chalk.yellowBright(" - The 'OPENAI_API_KEY' environment variable is required and must contain the API Key for using OpenAI's LLM."));
            doctorOk = false;
        }
    }
    if (USE_LLM === 'ollama') {
        if (!await getVarVal('OLLAMA_MODEL')) {
            if (display) console.error(chalk.yellowBright(" - The environment variable 'OLLAMA_MODEL' is required and should contain the name of the LLM model."));
            doctorOk = false;
        }
    }
    if (!venv_path) {
        if (display) console.error(chalk.yellowBright(" - The 'PYTHON_VENV_PATH' environment variable is required and should contain the path to the Python virtual environment."));
        doctorOk = false;
    } else {
        try {
            fs.readdirSync(`${venv_path}`);
        } catch (errorInfo) {
            printError(errorInfo);
            if (display) console.error(chalk.yellowBright(` - ${venv_path} Python's venv folder is needed.`));
            if (display) console.error(chalk.yellowBright(` - ${python_interpreter} -m venv "${venv_path}"`));
            doctorOk = false;
        }
    }
    return doctorOk;
}
export async function disableAllVariable() {
    const variables = ['GOOGLE_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'USE_LLM', 'ANTHROPIC_API_KEY', 'PYTHON_VENV_PATH', 'OLLAMA_PROXY_SERVER', 'OLLAMA_MODEL', 'OPENAI_MODEL', 'GROQ_MODEL', 'ANTHROPIC_MODEL'];
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
            if (line.trim().startsWith(`export ${variableName}=`)) {
                return `# ${lineback}`;
            }
            return lineback;
        });
        content = lines.join('\n');
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



export async function setVarVal(key, value) {
    if (await isKeyInConfig(key)) return;
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
    const regChecker = {
        USE_LLM: typeone,
        GOOGLE_API_KEY: typeone,
        OPENAI_API_KEY: typeone,
        GROQ_API_KEY: typeone,
        ANTHROPIC_API_KEY: typeone,
        ANTHROPIC_MODEL: typeone,
        OLLAMA_PROXY_SERVER: typeone,
        OLLAMA_MODEL: typeone,
        OPENAI_MODEL: typeone,
        GROQ_MODEL: typeone,
        PYTHON_VENV_PATH: typeone,
    };
    if (!regChecker[key]) return;
    if (!regChecker[key](value)) return;
    const rcPath = await getRCPath();
    const cmd = `export ${key}="${value}"`;
    if (rcPath) await fsPromises.appendFile(rcPath, `\n${cmd}\n`);

}