/* eslint-disable no-unused-vars */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron, errNotifier, disNotifier, outNotifier, letNotifier } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
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
import stripAnsi from 'strip-ansi';



let oraMessageManager = null;
export async function oraSucceed(msg) {
    // if (isElectron()) return;
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.succeed(msg);
    if (oraMessageManager?.odf?.succeed) await outNotifier(stripAnsi(msg))
    oraMessageManager = null;
}
export async function oraFail(msg) {
    // if (isElectron()) return;
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.fail(msg);
    if (oraMessageManager?.odf?.fail) await errNotifier(stripAnsi(msg))
    oraMessageManager = null;
}
export async function oraStop() {
    if (!oraMessageManager) return;
    oraMessageManager?.odf?.stop();
    if (oraMessageManager?.odf?.fail) await disNotifier()
    oraMessageManager = null;
}
export async function oraStart(msg) {
    // if (isElectron()) return;
    await oraStop();
    if (!msg) return;
    let odf = ora(msg);
    await outNotifier(stripAnsi(msg), true)
    oraMessageManager = { msg, odf };
    odf.start();
}
export async function oraBackupAndStopCurrent() {
    const msg = oraMessageManager?.msg;
    await oraStop();
    return msg;
}
export async function print() {

}
export async function strout() {
    // if (isElectron()) return;
    const msg = await oraBackupAndStopCurrent();
    // await outNotifier(msg, true)
    console.log(...arguments);
    await oraStart(msg)
}
