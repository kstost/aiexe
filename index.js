#!/usr/bin/env node
/* global process */
/* eslint-disable no-unused-vars, no-unreachable, no-constant-condition */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv, execPlain, getPowerShellPath } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices } from './commons.js'
import { createVENV, doctorCheck, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print } from './oraManager.js'
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

(async () => {
    Object.keys(colors).forEach(key => colors[key] = chalk.hex(colors[key]));
    const program = new Command();
    const VERSION = '1.0.133'; // version
    //-----------------------------------------------
    //-----------------------------------------------
    function codeDisplay(mission, python_code, code_saved_path) {
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
    async function isDebugMode() {
        return !!(await getVarVal('AIEXEDEBUGMODE'));
    }
    async function showLogo() {
        await figlet.text(
            "AI.EXE",
            {
                horizontalLayout: "default",
                verticalLayout: "default",
                width: 40,
                whitespaceBreak: true,
            },
            function (err, data) {
                const content = []
                content.push(chalk.hex('#dddddd')('A cutting-edge CLI tool'));
                content.push(chalk.hex('#dddddd')(`for AI integration. Ver. ${VERSION}`));
                content.push(chalk.hex('#dddddd')(data));
                content.push(chalk.hex('#dddddd')(`(c) 2024 코드깎는노인's AI Laboratories`) +
                    chalk.hex('#dddddd')(`\n  - Email: monogatree@gmail.com`) +
                    chalk.hex('#dddddd')(`\n  - YouTube: https://www.youtube.com/@codeteller`)
                );
                print(chalk.bgMagenta(boxen(content.join('\n'), {
                    padding: 1,
                    margin: 0,
                    backgroundColor: 'magenta',
                    borderStyle: 'double',
                    borderColor: '#dddddd',
                    width: 60,
                    titleAlignment: 'center'
                })));
            }
        );
    }

    program
        .name('aiexe')
        .version(VERSION)
        .description('An advanced CLI tool for automating tasks using AI.')
        .usage('[options] [prompt]')
        .argument('[prompt]', 'Enter the prompt for the task to execute')
        .option('-r, --resetconfig', 'Reset configuration mode')
        .option('-s, --source <source>', 'Source language', 'auto')
        .option('-d, --destination <destination>', 'Destination language', '')
        .option('-c, --choosevendor', 'Choose LLM Vendor')
        .option('-m, --choosemodel', 'Choose LLM Model')
        .option('-b, --debug <scopename>', 'Debug mode', '')
        .option('-p, --python <command>', 'Run a command in the Python virtual environment')
        .action(async (prompt, options) => {

            singleton.options = options;
            if (singleton?.options?.debug === 'python_path_test_for_windows') {
                await (async () => {
                    async function execTest(cmd) {
                        return new Promise(resolve => {
                            shelljs.exec(cmd, { silent: true, }, (code, stdout, stderr) => {
                                resolve({ code, stdout, stderr });
                            })
                        })
                    }
                    const commands = [
                        `Where.exe python`,
                        `Where.exe python3`,
                        `(Get-ChildItem Env:Path).Value`,
                        `(Get-ChildItem Env:PATH).Value`,
                        `powershell -Command "(Get-Command python).Source"`,
                        `powershell -Command "(Get-Command python3).Source"`,
                        `(Get-Command python).Source`,
                        `(Get-Command python3).Source`,
                        `Get-Command python`,
                        `Get-Command python3`,
                        `python --version`,
                        `python3 --version`,
                    ];
                    for (let i = 0; i < commands.length; i++) {
                        console.log('-'.repeat(20));
                        console.log('CommandTest:', commands[i]);
                        console.log(await execTest(commands[i]));
                    }
                    console.log('-'.repeat(20));
                    console.log(await getPowerShellPath());
                    console.log('-'.repeat(20));
                    console.log('Thank you.')
                })();
                process.exit(0);
                return;
            }
            const bash_path = !isWindows() ? await which(`bash`) : null;
            if (!isWindows() && !bash_path) {
                console.error('This app requires bash to function.')
                process.exit(1)
            }
            if (options.python) {
                try {
                    await checkPythonForTermination();
                    const clone = options.python.split(' ');
                    const commd = clone[0];
                    clone.shift();
                    await execInVenv(clone.join(' '), commd);
                } catch (errorInfo) { printError(errorInfo); }
                return;
            }
            if (options.destination) {
                try {
                    await installProcess();
                    if (!Object.keys(langtable).includes(options.destination.toLowerCase())) {
                        console.log(`Unsupported destination language: ${options.destination}`);
                        return;
                    }

                    Object.keys(promptTemplate).forEach(langCode => {
                        promptTemplate[langCode].forEach(prompt => prompt['content'] = prompt['content'].split('\n').map(line => line.trim()).join('\n').trim())
                    });
                    const mainlg = async (input) => {
                        if (!input) return;
                        const USE_LLM = await getVarVal('USE_LLM');
                        async function languageDetector(input) {
                            let counter = 3;
                            while (counter > 0) {
                                try {
                                    let iso = await aiChat([{
                                        role: 'system', content: [
                                            `You determine the language in which the user speaks and respond with the appropriate language code in ISO 639-1 format.`,
                                            `## ISO 639-1 Table`,
                                            `{`,
                                            `    "en": "English",`,
                                            `    "fr": "Français",`,
                                            `    "ko": "한국어",`,
                                            `    "ja": "日本語",`,
                                            `    "vi": "Tiếng Việt",`,
                                            `    "es": "Español",`,
                                            `    "de": "Deutsch",`,
                                            `    "zh": "中文",`,
                                            `    "ru": "Русский",`,
                                            `    "it": "Italiano",`,
                                            `    "pt": "Português",`,
                                            `    "hi": "हिन्दी"`,
                                            `}`,
                                            ``,
                                            `## INSTRUCT`,
                                            `- response only 2 bytes for the ISO 639-1 language code`,
                                        ].join('\n').trim()
                                    }, { role: 'user', content: 'I am happy' }, { role: 'assistant', content: 'en' }, { role: 'user', content: '나는 행복하다' }, { role: 'assistant', content: 'ko' }, { role: 'user', content: '教えて' }, { role: 'assistant', content: 'ja' }, { role: 'user', content: 'cám ơn' }, { role: 'assistant', content: 'vi' }, { role: 'user', content: 'bien-être' }, { role: 'assistant', content: 'fr' }, { role: 'user', content: input.substring(0, 50) },]);
                                    iso = iso.split('"').join('');
                                    iso = iso.toLowerCase();
                                    if (iso?.length !== 2) throw null;
                                    return iso;
                                } catch (errorInfo) {
                                    printError(errorInfo);
                                    counter--;
                                }
                            }
                        }
                        let source = options.source;
                        if (!(USE_LLM !== 'ollama')) {
                            source = source !== "auto" ? source : await languageDetector(input);
                            if (source?.length !== 2) return;
                        } else {
                            source = source !== "auto" ? source : "";
                            if (!(source?.length === 2 || source?.length === 0)) return;
                        }
                        let counter = 3;
                        while (counter > 0) {
                            try {

                                let oiajfd = source ? langtable[source] : forignLanguage[options.destination];
                                if (!oiajfd) oiajfd = 'forign language';
                                const sourceCode = oiajfd;
                                if (sourceCode && promptTemplate[options.destination]) {
                                    const eres = JSON.stringify(promptTemplate[options.destination]);
                                    const parsed = JSON.parse(eres.split('#LANGCODE#').join(sourceCode));
                                    const messages = [];
                                    messages.push(parsed[0]);
                                    USE_LLM !== 'ollama' ? null : [greetings, whatAreYouDoing, howAreYou].forEach(obj => {
                                        messages.push({ role: 'user', content: obj[source] });
                                        messages.push({ role: 'assistant', content: obj[options.destination] });
                                    })
                                    messages.push(parsed.at(-1))
                                    messages[messages.length - 1].content = messages[messages.length - 1].content.split('\n').map(a => a.trim()).join('\n');
                                    messages[messages.length - 1].content = messages[messages.length - 1].content.split('#TRANSDATA#').join('\n```\n' + input + '\n```\n')
                                    let result = await aiChat(messages);
                                    try {
                                        throw null;
                                        if (typeof result === 'string') {
                                            result = result.split('\n').join(' ');
                                            result = await isCorrectCode(result, ['json'], true)
                                            result = JSON.parse(result);
                                        }
                                    } catch (e) {
                                        printError(e);
                                    }
                                    let sentence = result;
                                    if (false) {
                                        if (result?.constructor === Object && Object.keys(result).length === 1) sentence =
                                            result[langtable[options.destination]] ||
                                            result[langtable[options.destination].toLowerCase()] ||
                                            result[langtable[options.destination].toUpperCase()] ||
                                            result[Object.keys(result)[0]];
                                        else if (!sentence && result?.constructor === String) sentence = result;
                                    }
                                    if (sentence) sentence = sentence.trim();
                                    if (!sentence) throw null;
                                    print(sentence);
                                }
                                break;
                            } catch (e) {
                                printError(e);
                                counter--;
                            }
                        }
                    }
                    if (!prompt) {
                        let input = '';
                        process.stdin.on('data', (chunk) => input += chunk);
                        process.stdin.on('end', () => mainlg(input));
                    } else {
                        await mainlg(prompt);
                    }
                } catch (errorInfo) { printError(errorInfo); }
                return;
            }
            async function mainApp(prompt) {
                let debugMode = false;//(await isDebugMode() || (options.debug)) ? {} : null;
                if (debugMode) {
                    return;
                    try {
                        const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const folderName = `_debug_data_${currentDateTime}`;
                        debugMode.logpath = `${process.cwd()}/${folderName}`;
                        await fs.promises.mkdir(debugMode.logpath)
                        debugMode.count = 100000;
                        debugMode.leave = async (mode, data) => {
                            debugMode.count++;
                            let filename = `${getCurrentDateTime()}.json`;
                            let filepath = `${debugMode.logpath}/${debugMode.count}.${filename}`;
                            await fs.promises.writeFile(filepath, JSON.stringify({ mode, data }, undefined, 3));
                        }
                    } catch (errorInfo) { printError(errorInfo); debugMode = null; }
                }
                if (!await doctorCheck(false)) {
                    await doctorCheck(true);
                    return;
                }
                const _promp_t = prompt;
                if (_promp_t) {
                    let mission;
                    const history = [];
                    const messages_ = [];
                    function resetHistory() {
                        while (history.length) history.splice(0, 1);
                    }
                    function addMessages(msg) {
                        try {
                            if (messages_.at(-1)?.role === msg.role) throw new Error();
                            if (messages_.length === 0 && msg.role === 'assistant') throw new Error();
                            messages_.push(msg);
                        } catch (errorInfo) { printError(errorInfo); }
                    }
                    function addHistory(msg) {
                        try {
                            if (history.at(-1)?.role === msg.role) throw new Error();
                            if (history.length === 0 && msg.role === 'assistant') throw new Error();
                            history.push(msg);
                        } catch (errorInfo) { printError(errorInfo); }
                    }
                    function defineNewMission(mis, keep = false) {
                        mission = mis.split('\n').join('').trim();
                        if (!keep) resetHistory();
                        addHistory({
                            role: "user",
                            content: mission
                        });
                    }
                    async function summarize(summary, limit, remain) {
                        function cut() {
                            const aofidj = JSON.parse(JSON.stringify(messages_));
                            return aofidj.splice(0, aofidj.length - (remain * 4));
                        }
                        try {
                            if (messages_.length >= limit) {
                                oraStart(`Summarizing the conversation so far`);
                                if (disableOra) oraStop();
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
                                oraSucceed(`Summarizing successed like below`);
                                print(chalk.gray(sum + '\n'));
                                summary = sum;
                                while (messages_.length > remain * 4) messages_.splice(0, 1);
                            }
                        } catch (e) {
                            printError(e);
                            oraStop();
                        }
                        oraStop();
                        return summary;
                    }
                    defineNewMission(_promp_t);
                    let askforce = '';
                    let summary;
                    function getPrompt() {
                        return mission;
                    }
                    while (true) {
                        let python_code;
                        let correct_code;
                        let result2;
                        try {
                            summary = await summarize(summary, limitline, annn);
                            result2 = await code_generator(summary, messages_, history, askforce, debugMode, defineNewMission, addHistory, getPrompt)
                            python_code = result2.python_code;
                            correct_code = result2.correct_code;
                            if (result2.abort) break;
                        } catch (e) {
                            printError(e);
                            break;
                        }
                        const resForOpi = askforce === 'ask_opinion';
                        if (resForOpi) { askforce = ''; }
                        if (!correct_code) {
                            if (result2.raw) {
                                history.forEach(addMessages);
                                addMessages({ role: "assistant", content: result2.raw.trim() });
                                resetHistory();
                                print(chalk.hex('#4b4b66').bold('─'.repeat(measureColumns(0))));
                                print(chalk.hex('#a8a6f3')(chalk.bold(`AI's Response`) + ':'));
                                let resultd = result2.raw.trim();
                                print(chalk.hex('#a8a6f3')(resultd))
                                print(chalk.hex('#4b4b66').bold('─'.repeat(measureColumns(0))));
                                askforce = 'responsed_code_is_invalid_syntax';
                                if (resForOpi) askforce = 'responsed_opinion';
                            } else {
                                print(chalk.red('Nothing responsed'));
                                askforce = 'nothing_responsed';
                            }
                            continue;

                        } else {
                            print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                            const code_saved_path = await shell_exec(python_code, true)
                            print(codeDisplay(mission, python_code, code_saved_path))
                            print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                            print('Please select an option:')
                            setContinousNetworkTryCount(0);
                            const mode = ['Execute Code', 'Re-Generate Code', 'Modify Prompt', 'Quit'];
                            const index = await promptChoices(mode, `Enter your choice`, { cancel: false });
                            if (index === 1) { askforce = 're-generate'; continue; }
                            if (index === 2) {
                                print(`Previous prompt: ${chalk.bold(getPrompt())}`);
                                const request = (await ask_prompt_text(`Modify Prompt`)).trim();
                                if (request) {
                                    addHistory({
                                        role: "assistant",
                                        content: '```\n' + python_code + '\n```'
                                    });
                                    defineNewMission(request, true);
                                    print('The request has been changed.\nRequesting again with the updated request.');
                                } else {
                                    print('There are no changes.\nRequesting again with the original request.');
                                }
                                askforce = '';
                                continue;
                            }
                            if (index === 3) { break; }
                            print(chalk.hex('#222222').bold('─'.repeat(measureColumns(0))));
                            const result = await shell_exec(python_code, false);
                            print(chalk.hex('#222222').bold('─'.repeat(measureColumns(0))));
                            if (result?.code === 0 && !result?.stderr?.trim()) {
                                const USE_LLM = await getVarVal('USE_LLM');
                                print(chalk.greenBright.bold(`✔ The code ran successfully`))
                                addMessages(history[0]);
                                addMessages({
                                    role: "assistant",
                                    content: '```\n' + python_code + '\n```'
                                });
                                let out = result.stdout;
                                if (true) {
                                    const split = splitStringIntoTokens(out);
                                    const allowed = await getContextWindowSize();
                                    const reqToken = (allowed - (allowed * responseTokenRatio));
                                    const token = Math.floor((reqToken / (messages_.length + history.length)));
                                    if (split.length > token) {
                                        let croped = out.substring(0, split.splice(0, token).join(' ').length)
                                        if (croped.length < out.length) {
                                            croped += `\n.\n.\n...(omitted below)`;
                                            out = croped;
                                        }
                                    }
                                }
                                resetHistory();
                                addHistory({
                                    role: "user",
                                    content: `
                                    ${USE_LLM === 'ollama' ? `이전에 제공한 코드를 실행하여 다음과 같은 결과를 얻었습니다.` : `I executed the code you provided earlier and obtained the following results:`}
                                    ${'\n\n' + threeticks + `stdout\n${out}\n` + threeticks + '\n\n'}
                                    ${USE_LLM === 'ollama' ?
                                            `이 결과가 정확하고 예상한 대로인지 확인해 주시겠습니까? 또한, 이러한 결과가 코드의 맥락과 우리가 해결하려는 문제에 대해 무엇을 의미하는지 설명해주세요.\n지침\n- 한국어 이외의 다른 언어는 포함하지 마세요.\n- 오직 대한민국의 공식 언어인 한국어로만 모든것을 설명하세요.` :
                                            `Could you please confirm if these results are correct and as expected? Additionally, I would greatly appreciate it if you could explain what these results signify in the context of the code and the problem we are trying to solve.\n\nINSTRUCTION\n- If user's request is written in korean, then response in korean.`
                                        }
                                    `
                                });
                                askforce = 'ask_opinion';
                                continue;
                            } else {
                                print(chalk.redBright.bold(`✔ The code failed to run because of an error`))
                                addHistory({ role: 'assistant', content: "```\n" + python_code + "\n```" });
                                addHistory({ role: 'user', content: resultTemplate(result) });
                                askforce = 'run_code_causes_error';
                                continue;
                            }
                        }
                        break;
                    }
                    print(boxen(chalk.gray.bold(` Bye for now `), { padding: 0, margin: 0, borderStyle: 'single', borderColor: 'gray' }));
                    print(chalk.gray(`Subscribe my YouTube Channel(https://www.youtube.com/@codeteller)`));
                }
            }
            if (options.resetconfig) {
                await disableAllVariable();

                try { await installProcess(); } catch (errorInfo) { printError(errorInfo); }
            } else if (options.choosevendor) {
                await disableVariable('USE_LLM');

                try { await installProcess(); } catch (errorInfo) { printError(errorInfo); }
            } else if (options.choosemodel) {
                const vendor = await getVarVal('USE_LLM')
                if (vendor === 'gemini') await disableVariable('USE_LLM');
                if (vendor === 'ollama') await disableVariable('OLLAMA_MODEL');
                if (vendor === 'openai') await disableVariable('OPENAI_MODEL');
                if (vendor === 'groq') await disableVariable('GROQ_MODEL');
                if (vendor === 'anthropic') await disableVariable('ANTHROPIC_MODEL');

                try { await installProcess(); } catch (errorInfo) { printError(errorInfo); }
            }
            else if (prompt) {
                await mainApp(prompt);
            } else {
                await showLogo();
                try {
                    await installProcess();
                    print('')
                    const request = await ask_prompt_text(` What can I do for you?.`);
                    await mainApp(request);
                } catch (errorInfo) { printError(errorInfo); }
            }
        });
    program.parse(process.argv);
})();
//
