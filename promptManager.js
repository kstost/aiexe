/* eslint-disable no-unused-vars, no-unreachable, no-constant-condition */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text, isModelLlamas } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv, execPlain, getPowerShellPath, moduleValidator, generateModuleInstallCode } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination, installModules } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print, strout } from './oraManager.js'
import promptTemplate from './translationPromptTemplate.js';
import singleton from './singleton.js';
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



export function resetHistory(history) { //dep
    while (history.length) history.splice(0, 1);
}
export function addMessages(messages_, msg) { //dep
    try {
        if (messages_.at(-1)?.role === msg.role) throw new Error();
        if (messages_.length === 0 && msg.role === 'assistant') throw new Error();
        messages_.push(msg);
    } catch (errorInfo) { printError(errorInfo); }
}
export function addHistory(history, msg) { //dep
    try {
        if (history.at(-1)?.role === msg.role) throw new Error();
        if (history.length === 0 && msg.role === 'assistant') throw new Error();
        history.push(msg);
    } catch (errorInfo) { printError(errorInfo); }
}
export async function summarize(messages_, summary, limit, remain, apimode = false) { //dep
    function cut() {
        const aofidj = JSON.parse(JSON.stringify(messages_));
        return aofidj.splice(0, aofidj.length - (remain * 4));
    }
    try {
        if (messages_.length >= limit) {
            if (!apimode) await oraStart(`Summarizing the conversation so far`);
            if (!apimode) if (disableOra) await oraStop();
            const aoifj = [];
            aoifj.push({
                role: 'system',
                content: `Your role is to summarize the conversation provided by the user.`
            });
            aoifj.push({
                role: 'user', content: [
                    `${summary ? `\n${threeticks}plaintext\n${summary}\n${threeticks}\n\nand then\n` : ''}`,
                    `${threeticks}json`,
                    `${(JSON.stringify(cut()))}`,
                    `${threeticks}`,
                    ``,
                    `Please summarize the conversation so far in detail.`,
                    `The purpose of the detail summary is to give LLMs context for the conversation so far.`,
                    ``,
                    `INSTRUCTION`,
                    `- If there are important informations in the conversation, be sure to include them in the summary.`,
                    `- If there are specific values, never omit them and be sure to include them in the summary.`,
                    `- Provide the summary with enough content for LLM to continue with the next task.`,
                    `- Response only the summarized content as plain text.`,
                ].join('\n').trim()
            });
            const sum = await aiChat(aoifj);
            if (!apimode) await oraSucceed(`Summarizing successed like below`);
            if (!apimode) await strout(chalk.gray(sum + '\n'));
            summary = sum;
            while (messages_.length > remain * 4) messages_.splice(0, 1);
        }
    } catch (e) {
        printError(e);
        if (!apimode) await oraStop();
    }
    if (!apimode) await oraStop();
    return summary;
}
export async function errorPromptHandle(request, history, askforce, promptSession) {
    if (request) {
        if (askforce === 'run_code_causes_error') {
            history.at(-1).content += `\n\nDon't say anything`;
            addHistory(history, { role: "assistant", content: '' });
            defineNewMission(promptSession, history, request, true); // dont remove
        }
        if (askforce === 'nothing_responsed') defineNewMission(promptSession, history, request);
        if (!isElectron()) await strout('The request has been changed.\nRequesting again with the updated request.');
    } else {
        if (!isElectron()) await strout('There are no changes.\nRequesting again with the original request.');
    }
    return { request, history, askforce, promptSession };
}
export async function resultAssigning(python_code, result, messages_, history, apimode = false) {
    let askforce;
    if (result?.code === 0) {
        // 코드 수행 성공.
        if (!apimode) await strout(chalk.greenBright.bold(`✔ The code ran successfully`))
        if (false) addMessages(messages_, history[0]);
        let clonedHistory = JSON.parse(JSON.stringify(history));
        clonedHistory = clonedHistory.filter(d => d.role === 'user');
        let picked;
        let count = 1;
        while (true) {
            let cnadi = clonedHistory[clonedHistory.length - count];
            if (!cnadi) break;
            if (cnadi.content.indexOf(`The code you provided caused the error`) === -1) {
                picked = cnadi;
                break;
            }
            count++;
        }
        addMessages(messages_, picked);
        addMessages(messages_, {
            role: "assistant",
            content: '```\n' + python_code + '\n```'
        });
        let stdout = (result?.stdout || '').trim();
        let stderr = (result?.stderr || '').trim();
        resetHistory(history);
        addHistory(history, {
            role: "user",
            stdout: `${threeticks}stdout\n${stdout}\n${threeticks}${stderr ? `\n\n${threeticks}stderr\n${stderr}\n${threeticks}` : ''}`,
            content: `
        ${await isModelLlamas() ? `이전에 제공한 코드를 실행하여 다음과 같은 결과를 얻었습니다.` : `I executed the code you provided earlier and obtained the following results:`}
        ${'\n\n' + `{{STDOUT}}` + '\n\n'}
        ${await isModelLlamas() ?
                    `이 결과가 정확하고 예상한 대로인지 확인해 주시겠습니까? 또한, 이러한 결과가 코드의 맥락과 우리가 해결하려는 문제에 대해 무엇을 의미하는지 설명해주세요.\n지침\n- 한국어 이외의 다른 언어는 포함하지 마세요.\n- 오직 대한민국의 공식 언어인 한국어로만 모든것을 설명하세요.` :
                    `Could you please confirm if these results are correct and as expected? Additionally, I would greatly appreciate it if you could explain what these results signify in the context of the code and the problem we are trying to solve.\n\nINSTRUCTION\n- If user's request is written in korean, then response in korean.`
                }
        `
        });
        askforce = 'ask_opinion';
    } else {
        if (!apimode) await strout(chalk.redBright.bold(`✔ The code failed to run because of an error`))
        addHistory(history, { role: 'assistant', content: "```\n" + python_code + "\n```" });
        addHistory(history, { role: 'user', content: resultTemplate(result) });
        askforce = 'run_code_causes_error';
    }
    return {
        askforce,
        messages: messages_,
        history
    }
}
export function defineNewMission(promptSession, history, mis, keep = false, allownewline = false) {
    if (isElectron()) allownewline = true;
    if (isElectron()) if (!promptSession) promptSession = {};
    if (!allownewline) promptSession.prompt = mis.split('\n').join('').trim();
    else promptSession.prompt = mis;
    if (!keep) resetHistory(history);
    addHistory(history, { role: "user", content: promptSession.prompt });
}
export async function assignNewPrompt(request, history, promptSession, python_code, apimode = false) {
    if (request) {
        addHistory(history, { role: "assistant", content: '```\n' + python_code + '\n```' });
        defineNewMission(promptSession, history, request, true);
        if (!apimode) await strout('The request has been changed.\nRequesting again with the updated request.');
    } else {
        if (!apimode) await strout('There are no changes.\nRequesting again with the original request.');
    }
    return { askforce: '', history, promptSession };
}
