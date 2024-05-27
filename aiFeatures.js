/* global process */
/* eslint-disable no-unused-vars, no-unreachable, no-constant-condition, no-constant-binary-expression */
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron, errNotifier } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable, llamaFamily, devmode } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print, strout } from './oraManager.js'
import { resetHistory, addMessages, addHistory, summarize, resultAssigning, defineNewMission, errorPromptHandle, } from './promptManager.js'
import { isTaskAborted } from './mainLogic.js'
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

let continousNetworkTryCount = 0;
export function setContinousNetworkTryCount(v) {
    continousNetworkTryCount = v;
}
export function getContinousNetworkTryCount() {
    return continousNetworkTryCount;
}

export async function aiChat(messages, parameters, taskId = null) {
    const USE_LLM = await getVarVal('USE_LLM');
    if (singleton?.options?.debug === 'messages_payloads' || devmode) {//isElectron()
        const venv_path = await getPythonVenvPath();
        if (venv_path) {
            const logfile = `${venv_path}/messages_payloads.${getCurrentDateTime()}.json`;
            await fsPromises.appendFile(logfile, JSON.stringify(messages, undefined, 3));
        }
    }
    messages.forEach(talk => delete talk.token_size);
    if (USE_LLM === 'openai') return await openaiChat(messages, parameters, taskId);
    if (USE_LLM === 'gemini') return await geminiChat(messages, parameters, taskId);
    if (USE_LLM === 'anthropic') return await anthropicChat(messages, parameters, taskId);
    if (USE_LLM === 'ollama') return await ollamaChat(messages, parameters, taskId);
    if (USE_LLM === 'groq') return await groqChat(messages, parameters, taskId);

}
export async function geminiChat(messages, parameters = { temperature: 0 }, taskId) {
    const debugMode = false;
    while (true) {
        let tempMessageForIndicator = await oraBackupAndStopCurrent();
        let indicator = ora((`Requesting ${chalk.bold('gemini-pro')}`)).start()
        try {
            let python_code;
            let clonedMessage = JSON.parse(JSON.stringify(messages));
            clonedMessage = clonedMessage.map(line => {
                if (line.role === 'system') line.role = 'user';
                if (line.role === 'assistant') line.role = 'model';
                line.parts = [{ text: line.content }];
                delete line.content;
                return line;
            });
            const first = clonedMessage[0];
            clonedMessage.shift()
            clonedMessage = [
                first,
                {
                    "role": "model",
                    "parts": [
                        {
                            "text": "I understand. I will do."
                        }
                    ]
                },
                ...clonedMessage
            ];
            if (debugMode) debugMode.leave('AIREQ', {
                contents: clonedMessage
            });
            let response = await axiosPostWrap(`https://generativelanguage.googleapis.com/v1beta/models/${'gemini-pro'}:generateContent?key=${await getVarVal('GOOGLE_API_KEY')}`, {
                generationConfig: parameters,
                contents: clonedMessage
            }, { headers: { 'content-type': 'application/json' } });
            try {
                if (isTaskAborted(taskId)) return '';
                python_code = response.data.candidates[0].content.parts[0].text;
            } catch (errorInfo) {
                printError(errorInfo);
                if (response.data.candidates[0].finishReason) {
                    python_code = `${threeticks}\nprint("Request couldn't accept reason for ${response.data.candidates[0].finishReason}")\n${threeticks}`
                }
            }
            indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold('gemini-pro')} succeeded`));
            await oraStart(tempMessageForIndicator);
            return python_code;
        } catch (e) {
            printError(e);
            await errNotifier(`Requesting ${('gemini-pro')} failed`);
            indicator.fail(chalk.red(`Requesting ${chalk.bold('gemini-pro')} failed`));
            await oraStart(tempMessageForIndicator);

            if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw e;
                break;
            }

        }
    }
}
export async function anthropicChat(messages, parameters = { temperature: 0 }, taskId) {
    const ANTHROPIC_MODEL = await getVarVal('ANTHROPIC_MODEL');
    while (true) {
        let tempMessageForIndicator = await oraBackupAndStopCurrent();
        let indicator = ora((`Requesting ${chalk.bold(ANTHROPIC_MODEL)}`)).start()
        try {
            let clonedMessage = JSON.parse(JSON.stringify(messages));
            let system = clonedMessage[0].content;
            clonedMessage.shift();
            let response = await axiosPostWrap('https://api.anthropic.com/v1/messages', {
                ...parameters,
                model: ANTHROPIC_MODEL,
                max_tokens: 1024,
                system,
                messages: clonedMessage
            }, {
                headers: {
                    'x-api-key': await getVarVal('ANTHROPIC_API_KEY'), // 환경 변수에서 API 키를 가져옵니다.
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });
            if (isTaskAborted(taskId)) return '';
            let resd = response.data.content[0].text;
            indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(ANTHROPIC_MODEL)} succeeded`));
            await oraStart(tempMessageForIndicator);
            return resd;
        } catch (e) {
            printError(e);
            await errNotifier(`Requesting ${(ANTHROPIC_MODEL)} failed`);
            indicator.fail(chalk.red(`Requesting ${chalk.bold(ANTHROPIC_MODEL)} failed`));
            await oraStart(tempMessageForIndicator);

            if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw e;
                break;
            }
        }
    }
}


async function waitTimeFor(timeterm_ms, taskId = null) {
    let recentReq = new Date();
    let secondpre;
    while (true) {
        if (isTaskAborted(taskId)) return;
        if (new Date() - recentReq > timeterm_ms) break;
        let leftsec = (Math.round((timeterm_ms - (new Date() - recentReq)) / 1000));
        if (leftsec !== secondpre) {
            await oraStart(`${leftsec} seconds left for next request`);
            secondpre = leftsec;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    await oraStop();
}
let firstGroqReg = true;
export async function groqChat(messages, parameters = { temperature: 0 }, taskId) {
    let completion;
    const GROQ_MODEL = await getVarVal('GROQ_MODEL');
    const GROQ_API_KEY = await getVarVal('GROQ_API_KEY');
    let alreadWaited = false;
    function checkAbortion() {
        if (isTaskAborted(taskId)) {
            throw {
                response: {
                    data: {
                        error: {
                            message: '',//aborted by renderer
                            code: -1
                        }
                    }
                }
            }
        }
    }
    while (true) {
        let timeterm = firstGroqReg ? 0 : 3000 * 1;
        firstGroqReg = false;
        let tempMessageForIndicator = await oraBackupAndStopCurrent();
        if (!alreadWaited) await waitTimeFor(timeterm, taskId);
        // if (isTaskAborted(taskId)) return '';
        checkAbortion();
        alreadWaited = false;
        await oraStop();
        let indicator = ora((`Requesting ${chalk.bold(GROQ_MODEL)}`)).start()
        try {
            completion = await axiosPostWrap('https://api.groq.com/openai/v1/chat/completions', { ...parameters, model: GROQ_MODEL, messages, }, {
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
            });
            if (isTaskAborted(taskId)) return '';
            let python_code = completion.data.choices[0].message.content;
            indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(GROQ_MODEL)} succeeded`));
            await oraStart(tempMessageForIndicator);
            return python_code;
        } catch (e) {
            printError(e);
            await errNotifier(`Requesting ${(GROQ_MODEL)} failed`);
            indicator.fail(chalk.red(`Requesting ${chalk.bold(GROQ_MODEL)} failed`));
            await oraStart(tempMessageForIndicator);
            if (e?.response?.data?.error?.code === 'rate_limit_exceeded') {

                function extractTime(str) {
                    let totalMilliseconds = 0;
                    let milliseconds = str.match(/(\d+)ms/);
                    if (milliseconds) {
                        totalMilliseconds += parseInt(milliseconds[1], 10);
                    }
                    let minutes = str.match(/(\d+)m(?!s)/);
                    if (minutes) {
                        totalMilliseconds += parseInt(minutes[1], 10) * 60000;
                    }
                    let seconds = str.match(/(\d+\.?\d*)s/);
                    if (seconds) {
                        totalMilliseconds += parseFloat(seconds[1]) * 1000;
                    }
                    return totalMilliseconds;
                }
                let waitTime = Math.ceil((extractTime(e.response.data.error.message) / 1000) * 1.1)
                if (isElectron()) await errNotifier(e.response.data.error.message);
                if (!isElectron()) await strout(chalk.red(e.response.data.error.message));
                await waitTimeFor(waitTime * 1000, taskId);
                checkAbortion();
                alreadWaited = true;
                continue;
            }
            else if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw e;
                break;
            }
        }
    }
}
export async function openaiChat(messages, parameters = { temperature: 0 }, taskId) {
    let completion;
    const OPENAI_MODEL = await getVarVal('OPENAI_MODEL');
    function checkAbortion() {
        if (isTaskAborted(taskId)) {
            throw {
                response: {
                    data: {
                        error: {
                            message: '',//aborted by renderer
                            code: -1
                        }
                    }
                }
            }
        }
    }
    while (true) {
        checkAbortion();
        let tempMessageForIndicator = await oraBackupAndStopCurrent();
        let indicator = ora((`Requesting ${chalk.bold(OPENAI_MODEL)}`)).start()
        try {
            completion = await axiosPostWrap('https://api.openai.com/v1/chat/completions', { ...parameters, model: OPENAI_MODEL, messages }, {
                headers: { 'Authorization': `Bearer ${await getVarVal('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' }
            });
            if (isTaskAborted(taskId)) return '';
            let python_code = completion.data.choices[0].message.content;
            indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OPENAI_MODEL)} succeeded`));
            await oraStart(tempMessageForIndicator);
            return python_code;
        } catch (e) {
            printError(e);
            await errNotifier(`Requesting ${(OPENAI_MODEL)} failed`);
            indicator.fail(chalk.red(`Requesting ${chalk.bold(OPENAI_MODEL)} failed`));
            await oraStart(tempMessageForIndicator);

            let errorMessage = (e?.response?.data?.error?.message || '').trim();
            if (errorMessage.startsWith('Rate limit reached for') && errorMessage.indexOf('Please try again in ') > -1) {
                function extractTime(message) {
                    const match = message.match(/Please try again in (\d+\.?\d*)(ms|s|m|h)/);
                    if (match) {
                        const time = parseFloat(match[1]);
                        switch (match[2]) {
                            case 's':
                                return time * 1000;
                            case 'm':
                                return time * 60 * 1000;
                            case 'h':
                                return time * 60 * 60 * 1000;
                            default: // 'ms'인 경우
                                return time;
                        }
                    }
                    return null; // 매치되지 않는 경우 null 반환
                }
                let waitTime
                try {
                    waitTime = Math.ceil((extractTime(errorMessage) / 1000) * 1.1)
                    if (waitTime === null) throw null;
                    if (isElectron()) await errNotifier(errorMessage);
                    if (!isElectron()) await strout(chalk.red(errorMessage));
                    await waitTimeFor(waitTime * 1000, taskId);
                    checkAbortion();
                    continue;
                } catch (e) {
                    printError(e);
                    throw e;
                }
            }

            if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw e;
                break;
            }
        }
    }
}
export async function ollamaChat(messages, parameters = { temperature: 0 }, taskId) {
    let airesponse;
    let response;
    let options = parameters;
    const OLLAMA_PROXY_SERVER = await getVarVal('OLLAMA_PROXY_SERVER');
    const OLLAMA_MODEL = await getVarVal('OLLAMA_MODEL');
    if (OLLAMA_PROXY_SERVER) {
        while (true) {
            let tempMessageForIndicator = await oraBackupAndStopCurrent();
            let indicator = ora((`Requesting ${chalk.bold(OLLAMA_MODEL)}`)).start()
            try {
                airesponse = await axiosPostWrap(OLLAMA_PROXY_SERVER, { proxybody: { model: OLLAMA_MODEL, stream: false, options, messages } });
                if (isTaskAborted(taskId)) return '';
                indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OLLAMA_MODEL)} succeeded`));
                await oraStart(tempMessageForIndicator);
                break;
            } catch (e) {
                printError(e);
                await errNotifier(`Requesting ${(OLLAMA_MODEL)} failed`);
                indicator.fail(chalk.red(`Requesting ${chalk.bold(OLLAMA_MODEL)} failed`));
                await oraStart(tempMessageForIndicator);

                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    break;
                }
            }
        }
        response = airesponse.data;
    } else {
        let count = 10;
        while (count >= 0) {
            count--;
            let tempMessageForIndicator = await oraBackupAndStopCurrent();
            let indicator = ora((`Requesting ${chalk.bold(OLLAMA_MODEL)}`)).start()
            try {
                airesponse = await axiosPostWrap('http://127.0.0.1:11434/api/chat', { model: OLLAMA_MODEL, stream: false, options, messages });
                if (isTaskAborted(taskId)) return '';
                indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OLLAMA_MODEL)} succeeded`));
                await oraStart(tempMessageForIndicator);
                break;
            } catch (e) {
                printError(e);
                await errNotifier(`Requesting ${(OLLAMA_MODEL)} failed`);
                indicator.fail(chalk.red(`Requesting ${chalk.bold(OLLAMA_MODEL)} failed`));
                await oraStart(tempMessageForIndicator);
                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else if (e.code === 'ECONNREFUSED') {
                    await turnOnOllamaAndGetModelList();
                } else {
                    break;
                }
            }
        }
        response = airesponse?.data?.message?.content;
    }
    if (!response) response = '';
    return response;
}

export async function turnOnOllamaAndGetModelList() {
    let count = 10;
    while (count >= 0) {
        count--;
        try {
            return await axios.get('http://127.0.0.1:11434/api/tags');
        } catch (e) {
            await singleton.debug({ error: e }, 'ollama_server_test');
            printError(e);
            if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (e.code === 'ECONNREFUSED') {
                let ollamaPath = (await which('ollama')).trim();
                if (!ollamaPath) break;
                if (isBadStr(ollamaPath)) break;
                let ddd;
                if (isWindows()) ddd = await execAdv(`& '${ollamaPath}' list`, true, { timeout: 5000 });
                else ddd = await execAdv(`"${ollamaPath}" list`, true, { timeout: 5000 });
                let { code } = ddd;
                if (code) break;
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                break;
            }
        }
    }
}
export async function combindMessageHistory(summary, messages_, history, askforce, contextWindowRatio = 1) {
    const allowed = await getContextWindowSize();
    const reqToken = (allowed - (allowed * responseTokenRatio)) * contextWindowRatio;

    function makeCandidate(messages_, history) {
        // {{STDOUT}}
        let messageCloned = JSON.parse(JSON.stringify(messages_));
        let historyCloned = JSON.parse(JSON.stringify(history));
        if (false) [messageCloned, historyCloned].forEach(dt => dt.forEach(data => {
            const stdout = data.stdout;
            delete data.stdout;
            data.content = data.content.split(`{{STDOUT}}`).join(stdout);
        }));
        let candidate;
        candidate = [
            askforce === 'ask_opinion' ? {
                role: "system",
                content: [
                    `You are an AI assistant. Your primary role is to assist users in verifying the correctness of code execution results and explaining the meaning and implications of those results.`,
                    `As a code execution and interpretation assistant, you are responsible for:`,
                    `- Reviewing the code execution results provided by the user and confirming whether they align with the expected output based on the code's logic and functionality.`,
                    `- Providing clear and concise explanations of what the code execution results mean in the context of the problem being solved or the task being accomplished.`,
                    ``,
                    `${summary ? `## SUMMARY SO FAR:` : ''}`,
                    `${summary ? summary : ''}`,
                ].join('\n').trim()
            } : {
                role: "system",
                content: [
                    `# Create Python code to handle user requests`,
                    `You are a python programmer who creates python code to solve user's request.  `,
                    `The user will run the python code you will provide, so you should only provide python code that can be executed.  `,
                    ``,
                    `## INSTRUCTION:`,
                    `- Respond only with the Python code.`,
                    `- Avoid using commands that only work in interactive environments like Jupyter Notebooks, especially those starting with \`!\`, in standard Python script files.`,
                    `- Always use the explicit output method via the print function, not expression evaluation, when your Python code displays results.`,
                    `- Include all dependencies such as variables and functions required for proper execution.`,
                    `- Do not provide any explanations about the response.`,
                    `- Ensure the code contains all dependencies such as referenced modules, variables, functions, and classes in one complete script.`,
                    `- The entire response must consist of only one complete form of code.`,
                    `${isWindows() ? `The Python code will run on Microsoft Windows Environment\n` : ''}`,
                    ``,
                    `## Exception`,
                    `- As an exception, if the user requests a simple explanation that doesn't require Python code to resolve, please respond using natural language instead of Python code.`,
                    ``,
                    `${summary ? `## SUMMARY SO FAR:` : ''}`,
                    `${summary ? summary : ''}`,
                ].join('\n').trim()
            },
            ...messageCloned
            , ...historyCloned
        ];
        return candidate;
    }
    let candidate = makeCandidate(messages_, history);
    function reducer(messages, excessTokens) {
        const tokens = splitTokens(messages);
        const trimmedTokens = tokens.slice(0, tokens.length - excessTokens);
        return trimmedTokens.join('');
    }
    function measureData(ddf) {
        let measure = JSON.parse(JSON.stringify(ddf));
        if (measure.stdout !== undefined) {
            if (measure.reduced) measure.stdout += `\n.\n.\n...(omitted below)\n${threeticks}`;
            measure.content = measure.content.split('{{STDOUT}}').join(measure.stdout);
            delete measure.stdout;
        } else {
            if (measure.reduced) measure.content += `\n.\n.\n...(omitted below)`;
        }
        delete measure.reduced;
        return measure;
    }
    function renderedCandidate(d1df) {
        const ddf = JSON.parse(JSON.stringify(d1df));
        for (let i = 1; i < ddf.length; i++) ddf[i] = measureData(ddf[i]);
        return ddf;
    }
    let systemMessageToken = null;
    while (true) {
        let totalToken = await tokenEstimater(renderedCandidate(candidate));
        if (totalToken <= reqToken) break;
        if (systemMessageToken === null) systemMessageToken = await tokenEstimater(measureData(candidate[0]));
        let leftToken = reqToken - systemMessageToken;
        let messagesCount = candidate.length - 1;
        let allowedTokenPerMessage = Math.floor(leftToken / messagesCount);
        let lastloop = false;
        for (let i = 1; i < candidate.length; i++) {
            lastloop = i === candidate.length - 1;
            if (candidate[i].reduced) continue;
            let messageToken = await tokenEstimater(measureData(candidate[i]));
            if (allowedTokenPerMessage >= messageToken) continue;
            if (candidate[i].stdout !== undefined) {
                candidate[i].stdout = reducer(candidate[i].stdout, messageToken - allowedTokenPerMessage);
            } else {
                candidate[i].content = reducer(candidate[i].content, messageToken - allowedTokenPerMessage);
            }
            candidate[i].reduced = true;
            break;
        }
        if (lastloop) break;
        if (candidate.filter(can => can.reduced).length === candidate.length - 1) break;
    }
    //--------------------------------
    candidate = renderedCandidate(candidate);
    await Promise.all(candidate.map(async talk => talk.token_size = await tokenEstimater(talk)));
    // cd ~/hypergw/aiexe && node index.js -b messages_payloads "print from 0 to 100000"
    return candidate;
}
export async function tokenEstimater(messages) {
    const messagesJson = (typeof messages) === 'string' ? messages : (() => {
        let data = [];
        if (messages.constructor === Object) messages = [messages];
        for (let i = 0; i < messages.length; i++) {
            data.push(`role:${messages[i].role}`);
            data.push(`content:${messages[i].content}`);
        }
        return data.join('\n');
    })();
    const tokens = splitTokens(messagesJson);
    return tokens.length;
}
function splitTokens(input) {
    const regex1 = /([\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/;
    const regex2 = /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
    let result = [];
    let tempString = "";
    while (input.indexOf('  ') > -1) input = input.split('  ').join(' ');
    for (let char of input) {
        if (regex1.test(char) || regex2.test(char)) {
            if (tempString.length > 0) {
                result.push(tempString);
                tempString = "";
            }
            result.push(char);
        } else {
            tempString += char;
        }
    }
    if (tempString.length > 0) {
        result.push(tempString);
    }
    let nds = [];
    for (let i = 0; i < result.length; i++) {
        if (result[i] !== ' ' || i === result.length - 1) {
            if (i > 0 && result[i - 1] === ' ') {
                nds.push(' ' + result[i]);
            } else {
                nds.push(result[i]);
            }
        }
    }
    return nds;
}
function isContextWindowExceeded(errmsg) {
    if (!errmsg) return false;
    return errmsg.indexOf('Please reduce the length of the messages or completion') > -1;
}
export async function code_generator(summary, messages_ = [], history = [], askforce, promptSession, contextWindowRatio = 1, taskId) {
    const debugMode = false;
    const USE_LLM = await getVarVal('USE_LLM');
    let python_code = '';
    let abort = false;
    let abortReason = '';
    let moduleInstall = true;
    try {
        while (true) {
            if (isTaskAborted(taskId)) {
                abort = true;
                abortReason = '';//aborted by renderer
                break;
            }
            // if()
            let messages = await combindMessageHistory(summary, messages_, history, askforce, contextWindowRatio);
            await oraStop();
            // re-generate                      | 
            // run_code_causes_error            | 히스토리의 마지막은 user
            // nothing_responsed                | 히스토리의 마지막은 user
            // responsed_code_is_invalid_syntax | 히스토리 비었음
            // responsed_opinion                | 히스토리 비었음
            /*
                run_code_causes_error 에러메시지정리된것
                responsed_code_is_invalid_syntax 코드가아닌그냥말
                responsed_opinion 코드가아닌그냥말
                nothing_responsed 이전 요청내용
            */
            const reGenerateMode = askforce === 're-generate';
            if (askforce === 'responsed_code_is_invalid_syntax') {
                moduleInstall = true;
                let request = isElectron() ? promptSession.prompt : (await ask_prompt_text(`What can I do for you?`)).trim(); // 이 물음에서 진행했을때 `Nothing responsed`의 상황이 만들어진다.
                if (request) {
                    defineNewMission(promptSession, history, request);
                } else {
                    abort = true;
                    abortReason = 'no further req for responsed_code_is_invalid_syntax';
                    break;
                }
                askforce = '';
                continue;
            }
            else if (askforce === 'responsed_opinion') {
                moduleInstall = true;
                let request = isElectron() ? promptSession.prompt : (await ask_prompt_text(`What can I do for you?`)).trim();
                if (request) {
                    defineNewMission(promptSession, history, request);
                } else {
                    abort = true;
                    abortReason = 'no further req for responsed_opinion';
                    break;
                }
                askforce = '';
                continue;
            }
            else if (askforce === 'run_code_causes_error' || askforce === 'nothing_responsed') {
                moduleInstall = false;
                await strout('Would you like to request the creation of a revised code?')
                await strout('Please select an option:')
                setContinousNetworkTryCount(0);
                let mode = ['Create of a revised code', 'Modify Prompt', 'Quit'];
                let index = isElectron() ? 2 : await promptChoices(mode, `Enter your choice`, { cancel: false });
                if (index === 0) {
                    askforce = '';
                    continue;
                }
                else if (index === 1) {
                    let askingMent = '';
                    if (askforce === 'run_code_causes_error') {
                        askingMent = 'What do you want me to do for this error?';
                    }
                    if (askforce === 'nothing_responsed') {
                        askingMent = 'What could I do for you?';
                    }
                    try {
                        await strout(`Previous prompt: ${chalk.bold(promptSession.prompt)}`);
                        let request = (await ask_prompt_text(askingMent)).trim();
                        await errorPromptHandle(request, history, askforce, promptSession);
                    } catch (e) {
                        printError(e);
                        await strout(e);
                    }
                    askforce = '';
                    continue;
                }
                else if (index === 2) {
                    abort = true;
                    abortReason = 'chosen Quit';
                    break;
                }
                await strout('')
            }
            await oraStart(`Generating code with ${chalk.bold(await getModelName())}`);
            if (disableOra) await oraStop();
            const parameters = { temperature: reGenerateMode ? 0.7 : 0 };
            if (USE_LLM === 'ollama') {
                python_code = await aiChat(messages, parameters, taskId);
            } else if (USE_LLM === 'openai') {
                if (debugMode) debugMode.leave('AIREQ', messages);
                try {
                    python_code = await aiChat(messages, parameters, taskId);
                } catch (e) {
                    printError(e);
                    const message = e?.response?.data?.error?.message;
                    if (isContextWindowExceeded(message)) {
                        contextWindowRatio -= 0.1;
                        if (contextWindowRatio > 0.1) {
                            await oraStop();
                            continue;
                        }
                    }
                    await oraFail(chalk.redBright(message));
                    if (isElectron()) { abort = true; abortReason = message; break; }
                    if (e.response.data.error.code === 'invalid_api_key') {
                        await disableVariable('OPENAI_API_KEY');
                        await installProcess(false);
                        continue;
                    } else {
                        abort = true;
                        abortReason = 'Invalid OpenAI API Key';
                        break;
                    }
                }
            } else if (USE_LLM === 'groq') {
                if (debugMode) debugMode.leave('AIREQ', messages);
                try {
                    python_code = await aiChat(messages, parameters, taskId);
                } catch (e) {
                    printError(e);
                    const message = e?.response?.data?.error?.message;
                    if (isContextWindowExceeded(message)) {
                        contextWindowRatio -= 0.1;
                        if (contextWindowRatio > 0.1) {
                            await oraStop();
                            continue;
                        }
                    }
                    await oraFail(chalk.redBright(message));
                    if (isElectron()) { abort = true; abortReason = message; break; }
                    if (e.response.data.error.code === 'invalid_api_key') {
                        await disableVariable('GROQ_API_KEY');
                        await installProcess(false);
                        continue;
                    } else {
                        abort = true;
                        abortReason = 'Invalid GROQ API Key';
                        break;
                    }
                }
            } else if (USE_LLM === 'anthropic') {
                try {
                    python_code = await aiChat(messages, parameters, taskId)
                } catch (e) {
                    printError(e);
                    await oraFail(chalk.redBright(e?.response?.data?.error?.message || ''));
                    if (isElectron()) { abort = true; abortReason = e?.response?.data?.error?.message; break; }
                    // e.response.data.error 컨텍스트 윈도우를 넘치는 경우에 대한 처리 필요.
                    if (e.response.data.error.type === 'authentication_error') {
                        await disableVariable('ANTHROPIC_API_KEY');
                        await installProcess(false);
                        continue;
                    } else {
                        abort = true;
                        abortReason = 'Invalid Anthropic API Key';
                        break;
                    }
                }

            } else if (USE_LLM === 'gemini') {
                try {
                    python_code = await aiChat(messages, parameters, taskId);
                } catch (e) {
                    printError(e);
                    await oraFail(chalk.redBright(e?.response?.data?.error?.message || ''));
                    if (isElectron()) { abort = true; abortReason = e?.response?.data?.error?.message; break; }
                    if (e.response.data.error.message.indexOf('API key not valid') > -1) {
                        await disableVariable('GOOGLE_API_KEY');
                        await installProcess(false);
                        continue;
                    }
                    // e.response.data.error 컨텍스트 윈도우를 넘치는 경우에 대한 처리 필요.
                    if (e.response.data.error.status === 'INVALID_ARGUMENT') {
                        // 이 상황이 꼭 API키가 잘못되었을경우만 있는것은 아니다.
                        if (!isElectron()) { process.exit(1); } else {
                            abort = true;
                            abortReason = 'Invalid argument for google api';
                            break;
                        }
                    } else {
                        abort = true;
                        abortReason = 'Invalid Anthropic API Key';
                        break;
                    }
                }
            }
            break;
        }
    } catch (errorInfo) { printError(errorInfo); }
    let err = '';
    let raw = python_code;
    let correct_code = await isCorrectCode(python_code, ['python3', 'python2', 'python', 'py', ''], false, moduleInstall);
    if (correct_code.python_code) python_code = correct_code.python_code;
    if (correct_code.err) python_code = '';
    if (correct_code.err) err = correct_code.err;
    let generateSuccess = !err && !!python_code;
    if (generateSuccess) {
        await oraSucceed(chalk.greenBright(`Generation succeeded with ${chalk.bold(await getModelName())}`))
    }
    await oraStop();
    const rst = { raw, err, correct_code: !!python_code, python_code, abort, abortReason, usedModel: await getModelName() };
    return rst;
}
export async function isModelLlamas() {
    const model = await getModelName();
    return llamaFamily.includes(model);
}
export async function getModelName() {
    const USE_LLM = await getVarVal('USE_LLM');
    if (USE_LLM === 'openai') return await getVarVal('OPENAI_MODEL');
    if (USE_LLM === 'groq') return await getVarVal('GROQ_MODEL');
    if (USE_LLM === 'gemini') return 'gemini-pro';
    if (USE_LLM === 'anthropic') return await getVarVal('ANTHROPIC_MODEL');
    if (USE_LLM === 'ollama') return await getVarVal('OLLAMA_MODEL');
    return '';
}


export async function getContextWindowSize() {
    const mode = await getModelName();
    const data = contextWindows
    let value = data[mode];
    if (!value) value = 8192; // 걍.. 
    return value;
}


export function resultTemplate(result) {
    if (!result) return '';
    return [
        `# The code you provided caused the error.`,
        ``,
        result.stdout ? `## stdout:` : ``,
        result.stdout ? `${result.stdout}` : ``,
        ``,
        result.stderr ? `## stderr:` : ``,
        result.stderr ? `${result.stderr}` : ``,
        ``,
        `## WHAT TO DO:`,
        `- Fix the problem.`,
        ``,
        `## INSTRUCTION:`,
        `- Respond only with the corrected Python code.`,
        `- Avoid using commands that only work in interactive environments like Jupyter Notebooks, especially those starting with \`!\`, in standard Python script files.`,
        `- Always use the explicit output method via the print function, not expression evaluation, when your Python code displays results.`,
        `- Include all dependencies such as variables and functions required for proper execution.`,
        `- Do not provide any explanations about the response.`,
        `- Ensure the code contains all dependencies such as referenced modules, variables, functions, and classes in one complete script.`,
        `- The entire response must consist of only one complete form of code.`,
        ``,
    ].join('\n').trim()
}
export async function axiosPostWrap() {
    setContinousNetworkTryCount(getContinousNetworkTryCount() + 1)
    if (continousNetworkTryCount >= 10) {
        if (!isElectron()) { process.exit(1); return; }
        return new Promise((resolve, reject) => {
            // e.response.data.error.code
            //new Error('too many tries')
            reject({
                response: {
                    data: {
                        error: {
                            message: 'too many tries',
                            code: -1
                        }
                    }
                }
            });
        })
    }
    let res = axios.post(...arguments);
    // isTaskAborted(taskId)
    return res;
}
export async function ask_prompt_text(prompt) {
    await errNotifier('Natural language prompt input request error occurred');
    setContinousNetworkTryCount(0);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return await new Promise(resolve => {
        rl.question(' ' + prompt + ': ', (df) => {
            resolve(df);
            rl.close();
        });
    })
}
