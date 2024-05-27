/* global process */
/* eslint-disable no-unused-vars, no-control-regex */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
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
import inquirer from 'inquirer';
import singleton from './singleton.js';
import stripAnsi from 'strip-ansi';

export async function currentLatestVersionOfGitHub() {
    try {
        let res = await axios.get(`https://raw.githubusercontent.com/kstost/aiexe/main/package.json`);
        return (res.data.version);
    } catch (e) { printError(e); }
    return null;
}
export async function reqRenderer(mode, arg) {
    if (!isElectron()) return;
    if (!singleton?.reqsAPI) return;
    return await singleton?.reqsAPI(mode, arg);
}
export async function outNotifier(message, leave = false) {
    if (leave) await letNotifier();
    if (!isElectron()) return;
    return await reqRenderer('outnotify', message)
}
export async function disNotifier(message) {
    if (!isElectron()) return;
    return await reqRenderer('disnotify', message)
}
export async function letNotifier(message) {
    if (!isElectron()) return;
    return await reqRenderer('letnotify', message)
}
export async function errNotifier(message, leave = false) {
    if (leave) await letNotifier();
    if (!isElectron()) return;
    return await reqRenderer('errnotify', message)
    /*
        ask_prompt_text
        openEndedPrompt
        promptChoices
        multipleChoicePrompt
        inquirer.prompt    
    */
}
export function isElectron() {
    return !!(process?.versions?.electron);
}
export async function promptChoices(choices, message) {
    await errNotifier('Option selection input request error occurred');
    const indexedChoices = choices.map((choice, index) => `${index + 1} - ${choice}`);
    const answers = await inquirer.prompt([
        {
            name: 'choice',
            type: 'list',
            message,
            choices: indexedChoices,
            filter: (value) => {
                const numberPattern = /\d+/;
                const match = value.match(numberPattern);
                return choices[parseInt(match[0], 10) - 1];
            }
        }
    ]);
    return choices.indexOf(answers.choice);
}
export function printError(e) {
    if (!traceError) return;
    console.log(e);
}
export function isBadStr(ppath) {
    if (ppath.indexOf(`"`) > -1) return !false;
    if (ppath.indexOf(`'`) > -1) return !false;
    return !true;
}
export function addslashes(str) { return str.replace(/[\\"]/g, '\\$&').replace(/\u0000/g, '\\0'); }
export function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}_${milliseconds}`;
}
export async function is_dir(path) {
    try {
        const stat = await fsPromises.stat(path);
        return stat.isDirectory();
    } catch (error) {
        printError(error);
        return false;
    }
}
export async function is_file(path) {
    try {
        const stat = await fsPromises.stat(path);
        return stat.isFile();
    } catch (error) {
        printError(error);
        return false;
    }
}
export async function isItem(itemPath) {
    try {
        await fsPromises.access(itemPath, fsPromises.constants.F_OK);
        return true;
    } catch (e) {
        printError(e);
        return false;
    }
}

export function splitStringIntoTokens(inputString) {
    return inputString.split(/(\w+|\S)/g).filter(token => token.trim() !== '');
}

export function measureColumns(min = 2) {
    const terminallWidth = process.stdout.columns;
    return terminallWidth - min;
}

export function isWindows() { return process.platform === 'win32'; }
