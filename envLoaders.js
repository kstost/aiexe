/* global process */
/* eslint-disable no-unused-vars, no-constant-condition */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows } from './commons.js'
import { createVENV, doctorCheck, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
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

export async function installProcess() {
    let setted = false;
    if (!await isKeyInConfig('PYTHON_VENV_PATH')) await createVENV();
    if (!await isKeyInConfig('USE_LLM')) {
        print(chalk.bold('Which LLM vendor do you prefer?'))
        setContinousNetworkTryCount(0);
        let mode = ['OpenAI', 'Anthropic', 'Ollama', 'Gemini', 'Groq'];
        let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
        await setVarVal('USE_LLM', mode[index].toLowerCase());
        setted = true;
    }
    let use_llm = await getVarVal('USE_LLM');
    if (use_llm === 'openai') {
        if (!await isKeyInConfig('OPENAI_API_KEY')) {
            let answer = await ask_prompt_text(`What is your OpenAI API key for accessing OpenAI services?`);
            await setVarVal('OPENAI_API_KEY', answer);
            setted = true;
        }
        if (!await isKeyInConfig('OPENAI_MODEL')) {
            print(chalk.bold('Which OpenAI model do you want to use for your queries?'))
            setContinousNetworkTryCount(0);
            let mode = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
            let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
            await setVarVal('OPENAI_MODEL', mode[index]);
            setted = true;
        }
    }
    else if (use_llm === 'groq') {
        if (!await isKeyInConfig('GROQ_API_KEY')) {
            let answer = await ask_prompt_text(`What is your Groq API key for accessing Groq services?`);
            await setVarVal('GROQ_API_KEY', answer);
            setted = true;
        }
        if (!await isKeyInConfig('GROQ_MODEL')) {
            print(chalk.bold('Which Groq model do you want to use for your queries?'))
            setContinousNetworkTryCount(0);
            let mode = ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];
            let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
            await setVarVal('GROQ_MODEL', mode[index]);
            setted = true;
        }
    }
    else if (use_llm === 'anthropic') {
        if (!await isKeyInConfig('ANTHROPIC_API_KEY')) {
            let answer = await ask_prompt_text(`What is your Anthropic API key for accessing Anthropic services?`);
            await setVarVal('ANTHROPIC_API_KEY', answer);
            setted = true;
        }
        if (!await isKeyInConfig('ANTHROPIC_MODEL')) {
            print(chalk.bold('Which Anthropic model do you want to use for your queries?'))
            setContinousNetworkTryCount(0);
            let mode = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
            let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
            await setVarVal('ANTHROPIC_MODEL', mode[index]);
            setted = true;
        }
    }
    else if (use_llm === 'gemini') {
        if (!await isKeyInConfig('GOOGLE_API_KEY')) {
            let answer = await ask_prompt_text(`What is your Gemini API key for accessing Gemini services?`);
            await setVarVal('GOOGLE_API_KEY', answer);
            setted = true;
        }
    }
    else if (use_llm === 'ollama') {
        let ollamaPath = (await which('ollama')).trim();
        if (!ollamaPath) {
            print('* Ollama is not installed in your system. Ollama is required to use this app');
            await disableVariable('USE_LLM');

            return await installProcess();
        }
        else if (isBadStr(ollamaPath)) {
            print(`* Ollama found located at "${ollamaPath}"`);
            print("However, the path should not contain ', \".");
            await disableVariable('USE_LLM');

            return await installProcess();
        }
        if (ollamaPath && !await isKeyInConfig('OLLAMA_MODEL')) {
            try {
                let list = await turnOnOllamaAndGetModelList();
                if (!list) {
                    print('* Ollama server is not ready');
                    print(`Ollama command located at ${chalk.bold(ollamaPath)}`)
                    await disableVariable('USE_LLM');

                    return await installProcess();
                }
                if (list) {
                    try {
                        if (list.data.models.length) {
                            print(chalk.bold('Which Ollama model do you want to use for your queries?'))
                            let mode = list.data.models.map(a => a.name);
                            setContinousNetworkTryCount(0);
                            let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
                            await setVarVal('OLLAMA_MODEL', mode[index]);
                            setted = true;
                        } else {
                            throw 1;
                        }
                    } catch (errorInfo) {
                        printError(errorInfo);
                        print('* You have no model installed in Ollama');
                        await disableVariable('USE_LLM');

                        return await installProcess();
                    }
                }
            } catch (errorInfo) {
                printError(errorInfo);
            }
        }
    }
    if (setted) {
        print(chalk.gray.bold('─'.repeat(measureColumns(0))));
        print(chalk.greenBright('Configuration has done'));
        print(`With the ${chalk.white.bold(`aiexe -c`)} command, you can select an AI vendor.`);
        print(`With the ${chalk.white.bold(`aiexe -m`)} command, you can select models corresponding to the chosen AI vendor.`);
        print(`The ${chalk.white.bold(`aiexe -r`)} command allows you to reset all settings and the Python virtual environment so you can start from scratch.`);
        print(chalk.green('Enjoy AIEXE'));
        print(chalk.gray('$') + ' ' + chalk.yellowBright('aiexe "print hello world"'));
        print(chalk.gray.bold('─'.repeat(measureColumns(0))));
    }

    return setted;
}
export async function realworld_which_python() {
    const list = ['python', 'python3'];
    for (let i = 0; i < list.length; i++) {
        const name = list[i];
        const ppath = await which(name);
        if (!ppath) continue;
        if (isBadStr(ppath)) throw ppath;
        const str = `${Math.random()}`;
        let rfg;
        if (isWindows()) rfg = await execAdv(`& '${ppath}' -c \\"print('${str}')\\"`);
        else rfg = await execAdv(`"${ppath}" -c "print('${str}')"`);
        let { stdout } = rfg;
        if (stdout.trim() === str) return ppath;
    }
}
export async function which(cmd) {
    if (cmd.indexOf(' ') > -1) process.exit(1);
    if (isWindows()) {
        const { stdout } = await execAdv(`(Get-Command ${cmd}).Source`)
        return stdout.trim();
    } else {
        return await new Promise(resolve => {
            shelljs.exec(`which ${cmd}`, { silent: true }, function (code, stdout, stderr) {
                if (code === 0) {
                    resolve(stdout.trim())
                } else {
                    resolve('')
                }
            });
        });
    }
};

export async function getPythonVenvPath() {
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    if (venv_path && await is_dir(venv_path)) {
        return venv_path;
    } else {
        return null;
    }
}
export async function getActivatePath() {
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    if (isWindows()) {
        return `${venv_path}\\Scripts\\Activate.ps1`;
    } else {
        return `${venv_path}/bin/activate`;
    }
}
export async function getPythonPipPath(app = 'python', venv = true) {
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    async function pythonPath() {
        try { return await realworld_which_python(); } catch (errorInfo) { printError(errorInfo); }
    }
    if (!venv) return await pythonPath();
    let foundPath = ''
    try {
        const python = ['python', 'python3'].includes(app);
        const pip = ['pip', 'pip3'].includes(app);
        if (isWindows()) {
            if (python) foundPath = ([
                `${venv_path}\\Scripts\\python.exe`,
                `${venv_path}\\Scripts\\python3.exe`,
            ]).find(fs.existsSync) || await pythonPath();
            else if (pip) foundPath = ([
                `${venv_path}\\Scripts\\pip.exe`,
                `${venv_path}\\Scripts\\pip3.exe`,
            ]).find(fs.existsSync);
        } else {
            if (python) foundPath = ([
                `${venv_path}/bin/python`,
                `${venv_path}/bin/python3`,
            ]).find(fs.existsSync) || await pythonPath();
            else if (pip) foundPath = ([
                `${venv_path}/bin/pip`,
                `${venv_path}/bin/pip3`,
            ]).find(fs.existsSync);
        }
    } catch (errorInfo) { printError(errorInfo); }
    return foundPath || '';
}
export async function venvCandidatePath() {
    let count = 0;
    let _path;
    while (true) {
        try {
            _path = `${os.homedir()}/.aiexe_venv${count ? `_${count}` : ''}`;
            if (await is_dir(_path)) { count++; continue; }
            await fsPromises.mkdir(_path)
            break;
        } catch (errorInfo) {
            printError(errorInfo);
            count++;
        }
    }
    return _path;
}
let _python_interpreter;
export async function checkPythonForTermination() {
    if (_python_interpreter) return _python_interpreter;
    let python_interpreter;
    try {
        python_interpreter = await getPythonPipPath('python', false);
    } catch (errorInfo) {
        printError(errorInfo);
    }
    if (!python_interpreter) {
        console.error('This app requires python interpreter.')
        process.exit(1)
        return;
    } else if (isBadStr(python_interpreter)) {
        print(`* Python interpreter found located at "${python_interpreter}"`);
        print("However, the path should not contain ', \".");
        process.exit(1)
        return;
    }
    if (true) _python_interpreter = python_interpreter;
    return _python_interpreter;
}