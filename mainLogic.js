#!/usr/bin/env node
/* global process */
/* eslint-disable no-unused-vars, no-unreachable, no-constant-condition */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text, isModelLlamas } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv, execPlain, getPowerShellPath, moduleValidator, generateModuleInstallCode, neededPackageOfCode, procPlainText } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination, installModules } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print } from './oraManager.js'
import { resetHistory, addMessages, addHistory, summarize, resultAssigning, defineNewMission, assignNewPrompt, } from './promptManager.js'
import promptTemplate from './translationPromptTemplate.js';
import singleton from './singleton.js';
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
export function codeDisplay(mission, python_code, code_saved_path) {
    if (!code_saved_path) code_saved_path = '';
    return (highlight(
        [`# GENERATED CODE for:`,
            `# ${mission}`,
            ``,
            `${python_code.trim()}`,
            ``,
            `# This code is proposed for mission execution`,
            `# This code will be run in ${process.cwd()}`,
            `# This code file is actually located at ${code_saved_path.split('/').join(isWindows() ? '\\' : '/')} and you can review the code by opening this file.`,
            `# Additional code included at the top of this file ensures smooth operation. For a more detailed review, it is recommended to open the actual file.`,
            `# Please review the code carefully as it may cause unintended system behavior`,
        ].join('\n').trim()
        , {
            language: 'python',
            theme: colors
        }))
}
export async function mainApp(promptSession, apimode = false, history = [], messages_ = [], askforce = '', summary, first = false) {
    if (!apimode) {
        await checkPythonForTermination();
        await installProcess(false);
    }
    if (!promptSession.prompt) return;
    if (!apimode || first) {
        defineNewMission(promptSession, history, promptSession.prompt);
    }
    while (true) {
        // if (true || isElectron()) {
        //     // print('askforce', askforce);
        // }
        let python_code;
        let correct_code;
        let result2;
        let code_saved_path;
        try {
            summary = await summarize(messages_, summary, limitline, annn, apimode);
            // print(111111, JSON.stringify(history, undefined, 3), askforce);
            result2 = await code_generator(summary, messages_, history, askforce, promptSession);
            // print(222222, JSON.stringify(history, undefined, 3), askforce);
            python_code = result2.python_code;
            correct_code = result2.correct_code;
            if (correct_code) {
                code_saved_path = await shell_exec(python_code, true)
            }
            if (result2.abort) {
                if (isElectron()) return { abortion: result2.abortReason };
                break;
            }
        } catch (e) {
            // print(11111111111111111111111111, e)
            printError(e);
            if (isElectron()) return { error: e };
            break;
        }
        const resForOpi = askforce === 'ask_opinion';
        if (resForOpi) { askforce = ''; }
        if (!correct_code) {
            askforce = procPlainText(messages_, history, result2, resForOpi, apimode).askforce;
        }

        const mode = ['Execute Code', 'Re-Generate Code', 'Modify Prompt', 'Quit'];
        if (apimode) {
            if (correct_code) python_code = [`# GENERATED CODE`,
                `# This code is proposed for mission execution`,
                // `# This code will be run in ${process.cwd()}`,
                // `# This code file is actually located at ${code_saved_path.split('/').join(isWindows() ? '\\' : '/')} and you can review the code by opening this file.`,
                `# Additional code included at the top of this file ensures smooth operation. For a more detailed review, it is recommended to open the actual file.`,
                `# Please review the code carefully as it may cause unintended system behavior`,
                `# You can modify this code before execute`,
                ``,
                `${python_code}`,
            ].join('\n');
            return {
                promptSession,
                mode,
                code_saved_path,
                resForOpi,
                askforce,
                messages_,
                history,
                summary,
                python_code,
                correct_code,
                raw: result2?.raw,
                abort: result2?.abort
            }
        }

        if (correct_code) {
            if (!apimode) {
                print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                print(codeDisplay(promptSession.prompt, python_code, code_saved_path))
                print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                print('Please select an option:')
            }
            setContinousNetworkTryCount(0);
            const index = await promptChoices(mode, `Enter your choice`, { cancel: false });
            if (index === 0) {
                if (!apimode) print(chalk.hex('#222222').bold('─'.repeat(measureColumns(0))));
                const neededPackages = await neededPackageOfCode(python_code);
                if (neededPackages) {
                    if (!apimode) print(chalk.bold(`Missing Module Installataion`));
                    if (!apimode) print(`The following module installation commands installs any missing modules required for this Python code.`);
                    if (!apimode) print(`Please ensure that the module names in the installation commands are correct before running the command.`);
                    await installModules('', neededPackages)
                }
                const result = await shell_exec(python_code, false);
                if (!apimode) print(chalk.hex('#222222').bold('─'.repeat(measureColumns(0))));
                const assigned = await resultAssigning(python_code, result, messages_, history, apimode);
                askforce = assigned.askforce;
            }
            else if (index === 1) {
                askforce = 're-generate';
            }
            else if (index === 2) {
                if (!apimode) print(`Previous prompt: ${chalk.bold(promptSession.prompt)}`);
                const request = (await ask_prompt_text(`Modify Prompt`)).trim();
                const assign = await assignNewPrompt(request, history, promptSession, python_code, apimode);
                askforce = assign.askforce;
            }
            else if (index === 3) { break; }
        }
        continue;
    }
    if (!apimode) print(boxen(chalk.gray.bold(` Bye for now `), { padding: 0, margin: 0, borderStyle: 'single', borderColor: 'gray' }));
    if (!apimode) print(chalk.gray(`Subscribe my YouTube Channel(https://www.youtube.com/@codeteller)`));
}