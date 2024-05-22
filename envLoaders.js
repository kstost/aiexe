/* global process */
/* eslint-disable no-unused-vars, no-constant-condition */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { makePreprocessingCode, shell_exec, execInVenv, attatchWatcher, execAdv, generateModuleInstallCode, asPyModuleName } from './codeExecution.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal, openEndedPrompt, multipleChoicePrompt } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
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
import checkbox, { Separator } from '@inquirer/checkbox';
import cliProgress from 'cli-progress';
// const cliProgress = require('cli-progress');

export async function installModules(promptmessage, packageDescriptions) {
    const venv_path = await getPythonVenvPath();
    if (!venv_path) return;
    const transformedPackages = Object.keys(packageDescriptions).map(mname => {
        let pyName = asPyModuleName(mname);
        let df = chalk.yellowBright('pip install ' + pyName);
        return ({
            name: `${chalk.bold(pyName)} - ${packageDescriptions[mname] ? packageDescriptions[mname] : df}`,
            value: mname,
            checked: true
        });
    });
    if (promptmessage) print(`\n${chalk.bold(promptmessage)}`);
    const choosenList = await checkbox({
        message: 'Select modules to install',
        choices: [
            ...transformedPackages,
        ],
    });
    const progressBar = new cliProgress.SingleBar({ format: 'Installing [{bar}] {percentage}% | {currentModule}', }, cliProgress.Presets.shades_classic);
    progressBar.start(choosenList.length, 0, { currentModule: 'Starting' });
    for (let i = 0; i < choosenList.length; i++) {
        let modulesName = choosenList[i];
        const pathd = `${venv_path}` + '/._module_requirements.py';
        await fsPromises.writeFile(pathd, `${[modulesName].map(name => `import ${name}`).join('\n')}`);
        let importcode = await generateModuleInstallCode(pathd);
        await shell_exec(importcode.code, false, true, true);
        progressBar.update(i + 1, { currentModule: asPyModuleName(modulesName) });
    }
    progressBar.update(choosenList.length, { currentModule: 'Complete' });
    progressBar.stop();
}
export async function installProcess(greeting = false) {
    let modificationMade = false;
    let createdVENV = false;
    if (!await isKeyInConfig('PYTHON_VENV_PATH')) {
        await createVENV();
        createdVENV = true;
    }
    const venv_path = await getPythonVenvPath();
    if (createdVENV && venv_path) {
        let answer = await multipleChoicePrompt('', 'Would you like to proceed with installing commonly used Python module packages such as requests, numpy and pillow?', ['YES', 'NO']);
        if (answer === 'YES') {
            await installModules('',
                {
                    requests: 'HTTP 라이브러리로, Python에서 HTTP 요청을 보내고 받을 수 있습니다.',
                    bs4: '웹 스크래핑을 위한 라이브러리로, HTML과 XML 파일에서 데이터를 추출할 수 있습니다.',
                    lxml: 'XML과 HTML 파일을 처리할 수 있는 라이브러리로, 빠르고 효율적인 파싱을 제공합니다.',
                    pandas: '데이터 분석과 조작을 위한 도구로, 데이터 프레임을 사용하여 데이터 처리가 용이합니다.',
                    numpy: '과학 계산을 위한 패키지로, 다차원 배열 객체와 다양한 수학 함수들을 제공합니다.',
                    matplotlib: '정적, 애니메이션 및 인터랙티브한 시각화를 만들 수 있는 라이브러리입니다.',
                    scipy: '수학, 과학, 공학용 라이브러리로, 고급 수학적 계산을 지원합니다.',
                    seaborn: '통계적 데이터 시각화를 위한 라이브러리로, 아름다운 그래프를 쉽게 그릴 수 있습니다.',
                    pillow: 'Python Imaging Library로, 다양한 이미지 파일 형식을 열고, 조작하고, 저장할 수 있습니다.',
                    plotly: '인터랙티브한 그래프를 만들 수 있는 라이브러리로, 웹 애플리케이션에서 시각화를 쉽게 통합할 수 있습니다.',
                    pytube: 'YouTube 비디오를 다운로드하고 처리할 수 있는 라이브러리입니다.',
                    openpyxl: 'Excel 파일을 읽고 쓸 수 있는 라이브러리입니다.',
                    xlrd: 'Excel 파일을 읽을 수 있는 라이브러리로, 특히 오래된 .xls 형식을 지원합니다.',
                    xlwt: 'Excel 파일을 쓸 수 있는 라이브러리로, 특히 오래된 .xls 형식을 지원합니다.',
                    xlutils: 'xlrd와 xlwt를 보완하여 Excel 파일을 수정할 수 있는 도구입니다.',
                    fitz: 'PyMuPDF로 알려진 PDF 파일을 읽고 조작할 수 있는 라이브러리입니다.',
                    PyPDF2: 'PDF 파일을 읽고 쓸 수 있는 라이브러리로, PDF 병합, 분할 등의 기능을 제공합니다.',
                    tabula: 'tabula-py로 알려진 PDF 테이블을 판다스 데이터프레임으로 변환할 수 있는 라이브러리입니다.',
                    pypdf: 'PDF 파일을 읽고 쓸 수 있는 라이브러리로, PyPDF2와 유사한 기능을 제공합니다.',
                    youtube_transcript_api: 'YouTube 비디오의 자막을 추출할 수 있는 라이브러리입니다.',
                    skimage: '이미지 처리 및 분석을 위한 라이브러리입니다.',
                    pydub: '오디오 파일을 처리할 수 있는 라이브러리로, 다양한 오디오 형식을 변환할 수 있습니다.',
                    moviepy: '비디오 편집을 위한 라이브러리로, 비디오 파일을 자르고, 붙이고, 변환할 수 있습니다.',
                    kivy: '멀티터치 애플리케이션을 만들기 위한 Python 프레임워크입니다.',
                    PyQt5: 'Qt 애플리케이션을 만들기 위한 Python 바인딩으로, GUI 애플리케이션을 개발할 수 있습니다.',
                    pygame: '비디오 게임을 개발할 수 있는 라이브러리로, 그래픽과 소리를 쉽게 처리할 수 있습니다.',
                    selenium: '웹 브라우저 자동화를 위한 라이브러리로, 웹 애플리케이션 테스트를 자동화할 수 있습니다.',
                });
        }
    }
    if (!await isKeyInConfig('USE_LLM')) {
        await multipleChoicePrompt('USE_LLM', 'Which LLM vendor do you prefer?', ['OpenAI', 'Anthropic', 'Ollama', 'Gemini', 'Groq'], true); // , 'CustomAPI'
        modificationMade = true;
    }
    let use_llm = await getVarVal('USE_LLM');
    if (use_llm === 'openai') {
        if (!await isKeyInConfig('OPENAI_API_KEY')) {
            await openEndedPrompt('OPENAI_API_KEY', `What is your OpenAI API key for accessing OpenAI services?`, true);
            modificationMade = true;
        }
        if (!await isKeyInConfig('OPENAI_MODEL')) {
            await multipleChoicePrompt('OPENAI_MODEL', 'Which OpenAI model do you want to use for your queries?', ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'], true);
            modificationMade = true;
        }
    }
    else if (use_llm === 'groq') {
        if (!await isKeyInConfig('GROQ_API_KEY')) {
            await openEndedPrompt('GROQ_API_KEY', `What is your Groq API key for accessing Groq services?`, true);
            modificationMade = true;
        }
        if (!await isKeyInConfig('GROQ_MODEL')) {
            await multipleChoicePrompt('GROQ_MODEL', 'Which Groq model do you want to use for your queries?', ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'], true);
            modificationMade = true;
        }
    }
    else if (use_llm === 'anthropic') {
        if (!await isKeyInConfig('ANTHROPIC_API_KEY')) {
            await openEndedPrompt('ANTHROPIC_API_KEY', `What is your Anthropic API key for accessing Anthropic services?`, true);
            modificationMade = true;
        }
        if (!await isKeyInConfig('ANTHROPIC_MODEL')) {
            await multipleChoicePrompt('ANTHROPIC_MODEL', 'Which Anthropic model do you want to use for your queries?', ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'], true);
            modificationMade = true;
        }
    }
    else if (use_llm === 'gemini') {
        if (!await isKeyInConfig('GOOGLE_API_KEY')) {
            await openEndedPrompt('GOOGLE_API_KEY', `What is your Gemini API key for accessing Gemini services?`, true);
            modificationMade = true;
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
                            await multipleChoicePrompt('OLLAMA_MODEL', 'Which Ollama model do you want to use for your queries?', list.data.models.map(a => a.name), true);
                            modificationMade = true;
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
    if (!await isKeyInConfig('UPDATE_CHECK')) {
        await multipleChoicePrompt('UPDATE_CHECK', 'Do you want to check for new updates every time you run the app?', ['YES', 'NO'], true);
        modificationMade = true;
    }
    if (greeting && modificationMade) {
        print(chalk.gray.bold('─'.repeat(measureColumns(0))));
        print(chalk.greenBright('Configuration has done'));
        print(`With the ${chalk.white.bold(`aiexe -c`)} command, you can select an AI vendor.`);
        print(`With the ${chalk.white.bold(`aiexe -m`)} command, you can select models corresponding to the chosen AI vendor.`);
        print(`The ${chalk.white.bold(`aiexe -r`)} command allows you to reset all settings and the Python virtual environment so you can start from scratch.`);
        print(chalk.green('Enjoy AIEXE'));
        print(chalk.gray('$') + ' ' + chalk.yellowBright('aiexe "print hello world"'));
        print(chalk.gray.bold('─'.repeat(measureColumns(0))));
    }
}
export async function realworld_which_python() {
    singleton.debug({ head: '-'.repeat(10) }, 'realworld_which_python');
    let list = ['python', 'python3'];

    if (isWindows()) list = ['python', 'python3', '.python', '.python3'];
    if (singleton?.options?.debug === 'pmode1') list = ['python', 'python3'];
    if (singleton?.options?.debug === 'pmode2') list = ['.python', '.python3'];
    if (singleton?.options?.debug === 'pmode3') list = ['.python', '.python3', 'python', 'python3'];

    const python_detect_result = [];
    for (let i = 0; i < list.length; i++) {
        const name = list[i];
        singleton.debug({ name }, 'realworld_which_python');
        const ppath = name[0] === '.' ? name.substring(1, Infinity) : await which(name);
        singleton.debug({ path: ppath }, 'realworld_which_python');
        if (!ppath) continue;
        if (isBadStr(ppath)) throw ppath;
        const str = `${Math.random()}`;
        let rfg;
        if (isWindows()) rfg = await execAdv(`& '${ppath}' -c \\"print('${str}')\\"`);
        else rfg = await execAdv(`"${ppath}" -c "print('${str}')"`);
        let { stdout } = rfg;
        singleton.debug({ result: stdout.trim(), source: str, comparison: stdout.trim() === str }, 'realworld_which_python');
        if (stdout.trim() === str) return ppath;
        python_detect_result.push({
            path: ppath,
            ...rfg
        })
    }
    return python_detect_result;
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
    singleton.debug({ head: '-'.repeat(10) }, 'getPythonPipPath');
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    async function pythonPath() {
        try { return await realworld_which_python(); } catch (errorInfo) {
            singleton.debug({ error: errorInfo, inside: true }, 'getPythonPipPath');
            printError(errorInfo);
        }
    }
    function getValue(result) {
        if (result?.constructor === String) return result;
    }
    singleton.debug({ venv, app, win32: isWindows() }, 'getPythonPipPath');
    singleton.debug({ venv_path }, 'getPythonPipPath');
    if (!venv) {
        const rwp = (await pythonPath());
        singleton.debug({ rwp }, 'getPythonPipPath');
        return rwp;
    }
    let foundPath = ''
    try {
        const python = ['python', 'python3'].includes(app);
        const pip = ['pip', 'pip3'].includes(app);
        if (isWindows()) {
            if (python) foundPath = ([
                `${venv_path}\\Scripts\\python.exe`,
                `${venv_path}\\Scripts\\python3.exe`,
            ]).find(fs.existsSync) || getValue(await pythonPath());
            else if (pip) foundPath = ([
                `${venv_path}\\Scripts\\pip.exe`,
                `${venv_path}\\Scripts\\pip3.exe`,
            ]).find(fs.existsSync);
        } else {
            if (python) foundPath = ([
                `${venv_path}/bin/python`,
                `${venv_path}/bin/python3`,
            ]).find(fs.existsSync) || getValue(await pythonPath());
            else if (pip) foundPath = ([
                `${venv_path}/bin/pip`,
                `${venv_path}/bin/pip3`,
            ]).find(fs.existsSync);
        }
    } catch (errorInfo) {
        singleton.debug({ error: errorInfo }, 'getPythonPipPath');
        printError(errorInfo);
    }
    singleton.debug({ foundPath }, 'getPythonPipPath');
    return foundPath || '';
}

let _VENVfoundPath = {};
let _realFoundPath;
export async function _getPythonPipPath(app = 'python', venv = true) {
    if (false) _VENVfoundPath = {};
    if (false) _realFoundPath = null;
    if (venv && _VENVfoundPath[app]) return _VENVfoundPath[app];
    singleton.debug({ head: '-'.repeat(10) }, 'getPythonPipPath');
    const venv_path = await getVarVal('PYTHON_VENV_PATH');
    async function pythonPath() {
        if (_realFoundPath) return _realFoundPath;
        try {
            let realworldPython = await realworld_which_python();
            _realFoundPath = realworldPython;
            return _realFoundPath;
        } catch (errorInfo) {
            singleton.debug({ error: errorInfo, inside: true }, 'getPythonPipPath');
            printError(errorInfo);
        }
    }
    function getValue(result) {
        if (result?.constructor === String) return result;
    }
    singleton.debug({ venv, app, win32: isWindows() }, 'getPythonPipPath');
    singleton.debug({ venv_path }, 'getPythonPipPath');
    if (!venv) {
        const rwp = (await pythonPath());
        singleton.debug({ rwp }, 'getPythonPipPath');
        return rwp;
    }
    let foundPath = ''
    try {
        const python = ['python', 'python3'].includes(app);
        const pip = ['pip', 'pip3'].includes(app);
        async function joinPath(path) {
            if (!venv_path) return;
            return `${venv_path}${path}`;
        }
        if (isWindows()) {
            if (python) foundPath = ([
                joinPath(`\\Scripts\\python.exe`),
                joinPath(`\\Scripts\\python3.exe`),
            ]).filter(Boolean).find(fs.existsSync) || getValue(await pythonPath());
            else if (pip) foundPath = ([
                joinPath(`\\Scripts\\pip.exe`),
                joinPath(`\\Scripts\\pip3.exe`),
            ]).filter(Boolean).find(fs.existsSync);
        } else {
            if (python) foundPath = ([
                joinPath(`/bin/python`),
                joinPath(`/bin/python3`),
            ]).filter(Boolean).find(fs.existsSync) || getValue(await pythonPath());
            else if (pip) foundPath = ([
                joinPath(`/bin/pip`),
                joinPath(`/bin/pip3`),
            ]).filter(Boolean).find(fs.existsSync);
        }
    } catch (errorInfo) {
        singleton.debug({ error: errorInfo }, 'getPythonPipPath');
        printError(errorInfo);
    }
    singleton.debug({ foundPath }, 'getPythonPipPath');
    foundPath = foundPath || '';
    if (foundPath) _VENVfoundPath[app] = foundPath;
    return _VENVfoundPath[app];
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
function containsUnicode(text) {
    const regex = /[^\u0000-\u007F]/;
    return regex.test(text);
}
function findStr(str, find) {
    return str.indexOf(find) === -1;
}

let _python_interpreter;
export async function checkPythonForTermination() {
    if (_python_interpreter) return _python_interpreter;
    let python_interpreter;
    try {
        python_interpreter = await getPythonPipPath('python', false);
    } catch (errorInfo) {
        // rare possibility
        singleton.debug({ error: errorInfo }, 'checkPythonForTermination');
        printError(errorInfo);
    }
    if (python_interpreter && python_interpreter?.constructor === String && !isBadStr(python_interpreter)) {
        _python_interpreter = python_interpreter;
    }
    else if (python_interpreter && python_interpreter?.constructor === String && isBadStr(python_interpreter)) {
        print(`* Python interpreter found located at "${python_interpreter}"`);
        print("However, the path should not contain ', \".");
        process.exit(1)
        return;
    }
    else if (python_interpreter && python_interpreter?.constructor === Array) {
        print(`* AIEXE couldn't find a proper python interpreter`);
        python_interpreter.forEach(candidate => {
            candidate.path = candidate.path.split('\\').join('/');
            candidate.unicode = candidate.path.split('/').filter(part => containsUnicode(part)).length > 0;
        });
        if (true) {
            const picked = python_interpreter.filter(candidate => findStr(candidate.path, '/'));
            const proper_candidate = picked.filter(candidate => !findStr(candidate.path, 'Microsoft/WindowsApps'));
            const placeHolders = picked.filter(candidate => findStr(candidate.path, 'Microsoft/WindowsApps'));
            if (proper_candidate.length) {
                proper_candidate.forEach(candidate => {
                    if (candidate.unicode) {
                        print(`${candidate.path} found, but it contains unicode characters which may cause issues.`);
                        print(`This can be resolved by moving the Python interpreter to a path without unicode characters.`);
                        print(`Simply uninstall Python and reinstall it to a path without unicode characters.`);
                        print(`You can install the Python interpreter by downloading it from https://python.org`);
                        print(`For additional inquiries, please contact monogatree@gmail.com`);
                    } else {
                        print(`${candidate.path} found but it couldn't pass the test`);
                    }
                });
            } else if (placeHolders.length) {
                print(`${placeHolders.map(candidate => candidate.path).join(', ')} found, but it is a placeholder path for installing Python from the Microsoft Store.`);
                print(`You can install the Python interpreter by downloading it from https://python.org`);
                print(`For additional inquiries, please contact monogatree@gmail.com`);
            }
        }
        process.exit(1)
        return;
    }
    else if (!python_interpreter) {
        // rare possibility
        console.error('This app requires python interpreter.')
        process.exit(1)
        return;
    } else {
        // rare possibility
        console.error('This app requires python interpreter..')
        process.exit(1)
        return;
    }
    // if (true) _python_interpreter = python_interpreter;
    return _python_interpreter;
}