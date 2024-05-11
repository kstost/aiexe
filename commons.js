/* global process */
/* eslint-disable no-unused-vars, no-control-regex */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { createVENV, doctorCheck, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
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


export function printError(e) {
    if (!traceError) return;
    print(e);
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
        return false;
    }
}
export async function is_file(path) {
    try {
        const stat = await fsPromises.stat(path);
        return stat.isFile();
    } catch (error) {
        return false;
    }
}
export async function isItem(itemPath) {
    try {
        await fsPromises.access(itemPath, fsPromises.constants.F_OK);
        return true;
    } catch {
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