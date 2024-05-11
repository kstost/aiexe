/* eslint-disable no-unused-vars */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows } from './commons.js'
import { createVENV, doctorCheck, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
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



let oraMessageManager = null;
export function oraSucceed(msg) {
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.succeed(msg);
    oraMessageManager = null;
}
export function oraFail(msg) {
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.fail(msg);
    oraMessageManager = null;
}
export function oraStop() {
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.stop();
    oraMessageManager = null;
}
export function oraStart(msg) {
    oraStop();
    if (!msg) return;
    let odf = ora(msg);
    oraMessageManager = { msg, odf };
    odf.start();
}
export function oraBackupAndStopCurrent() {
    const msg = oraMessageManager?.msg;
    oraStop();
    return msg;
}
export function print() {
    const msg = oraBackupAndStopCurrent();
    console.log(...arguments);
    oraStart(msg)
}
