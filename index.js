#!/usr/bin/env node
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
    const colors = {
        "comment": "#5e6687",
        "keyword": "#c76b29",
        "built_in": "#c08b30",
        "string": "#ac9739",
        "number": "#22a2c9",
        "operator": "#3d8fd1",
        "function": "#6679cc",
        "class": "#9c637a",
        "variable": "#c94922",
        "regexp": "#979db4",
        "attribute": "#c76b29",
        "meta": "#6b7394",
        "default": "#898ea4"
    };
    Object.keys(colors).forEach(key => colors[key] = chalk.hex(colors[key]));
    let continousNetworkTryCount = 0;
    let oraMessageManager = null;
    function oraSucceed(msg) {
        if (!oraMessageManager) return;
        oraMessageManager?.odf?.succeed(msg);
        oraMessageManager = null;
    }
    function oraFail(msg) {
        if (!oraMessageManager) return;
        oraMessageManager?.odf?.fail(msg);
        oraMessageManager = null;
    }
    function oraStop() {
        if (!oraMessageManager) return;
        oraMessageManager?.odf?.stop();
        oraMessageManager = null;
    }
    function oraStart(msg) {
        oraStop();
        if (!msg) return;
        let odf = ora(msg);
        oraMessageManager = { msg, odf };
        odf.start();
    }
    function oraBackupAndStopCurrent() {
        let msg = oraMessageManager?.msg;
        oraStop();
        return msg;
    }
    function print() {
        let msg = oraBackupAndStopCurrent();
        console.log(...arguments);
        oraStart(msg)
    }
    const threeticks = '```';
    const disableOra = false;
    const limitline = 30; // 대화 기록이 이만큼에 닿게되면 요약을 시도한다.
    const annn = 3; // 요약을 할 때 이만큼에 해당하는 대화건은 요약에서 제외하고 원래 내용대로 유지한다. 만약 3이라고 하면 실제 메시지수는 이의 4배인 12개이다.
    const responseTokenRatio = 0.3; // 답변에 사용할 토큰 비율이다. 만약 이 값을 0.3으로 설정하면 컨텍스트 제공목적으로 사용하는 토큰을 0.7만큼 사용한다는것이다. 전체 컨텍스트윈도우가 1000이라면 700이 되는것이다.
    const program = new Command();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const VERSION = '1.0.114'; // version
    function splitStringIntoTokens(inputString) {
        return inputString.split(/(\w+|\S)/g).filter(token => token.trim() !== '');
    }
    function measureColumns(min = 2) {
        const terminallWidth = process.stdout.columns;
        return terminallWidth - min;
    }
    async function getEnvRCVar(key) {
        if (false) process.env[key];
        let file = await getVarVal(key);
        return file;//
    }
    function isWindows() { return process.platform === 'win32'; }
    //-----------------------------------------------
    let GOOGLE_API_KEY = await getEnvRCVar('GOOGLE_API_KEY');
    let OPENAI_API_KEY = await getEnvRCVar('OPENAI_API_KEY');
    let USE_LLM = await getEnvRCVar('USE_LLM');
    let ANTHROPIC_API_KEY = await getEnvRCVar('ANTHROPIC_API_KEY');
    let PYTHON_VENV_PATH = await getEnvRCVar('PYTHON_VENV_PATH');
    let OLLAMA_PROXY_SERVER = await getEnvRCVar('OLLAMA_PROXY_SERVER');
    let OLLAMA_MODEL = await getEnvRCVar('OLLAMA_MODEL');
    let OPENAI_MODEL = await getEnvRCVar('OPENAI_MODEL');
    let ANTHROPIC_MODEL = await getEnvRCVar('ANTHROPIC_MODEL');
    const GEMINI_MODEL = 'gemini-pro';
    await loadConfig();
    //-----------------------------------------------
    const bash_path = !isWindows() ? await which(`bash`) : null;
    let python_interpreter;
    try {
        python_interpreter = await which_python();
    } catch { }
    const pwd = process.cwd();
    function codeDisplay(mission, python_code) {
        return (highlight(
            [`# GENERATED CODE for:`,
                `# ${mission}`,
                ``,
                `${python_code.trim()}`,
                ``,
                `# This code is proposed for mission execution`,
                `# This code will be run in ${pwd}`,
                `# Please review the code carefully as it may cause unintended system behavior`,
            ].join('\n').trim()
            , {
                language: 'python',
                theme: colors
            }))
    }
    function resultTemplate(result) {
        return [
            `# The code you provided caused the error.`,
            ``,
            `## stdout:`,
            `${result.stdout}`,
            ``,
            `## stderr:`,
            `${result.stderr}`,
            ``,
            `## WHAT TO DO:`,
            `- fix it!`,
        ].join('\n').trim()
    }
    async function loadConfig(loadForce = false) {
        if (loadForce || !GOOGLE_API_KEY) GOOGLE_API_KEY = await getVarVal('GOOGLE_API_KEY');
        if (loadForce || !OPENAI_API_KEY) OPENAI_API_KEY = await getVarVal('OPENAI_API_KEY');
        if (loadForce || !USE_LLM) USE_LLM = await getVarVal('USE_LLM'); // USE_LLM 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !ANTHROPIC_API_KEY) ANTHROPIC_API_KEY = await getVarVal('ANTHROPIC_API_KEY'); // ANTHROPIC_API_KEY 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !PYTHON_VENV_PATH) PYTHON_VENV_PATH = await getVarVal('PYTHON_VENV_PATH'); // PYTHON_VENV_PATH 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !OLLAMA_PROXY_SERVER) OLLAMA_PROXY_SERVER = await getVarVal('OLLAMA_PROXY_SERVER'); // OLLAMA_PROXY_SERVER 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !OLLAMA_MODEL) OLLAMA_MODEL = await getVarVal('OLLAMA_MODEL'); // OLLAMA_MODEL 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !OPENAI_MODEL) OPENAI_MODEL = await getVarVal('OPENAI_MODEL'); // OPENAI_MODEL 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
        if (loadForce || !ANTHROPIC_MODEL) ANTHROPIC_MODEL = await getVarVal('ANTHROPIC_MODEL'); // ANTHROPIC_MODEL 값이 정의되어 있지 않은 경우 대체 값을 가져옵니다.
    }
    async function disableAllVariable() {
        const variables = ['GOOGLE_API_KEY', 'OPENAI_API_KEY', 'USE_LLM', 'ANTHROPIC_API_KEY', 'PYTHON_VENV_PATH', 'OLLAMA_PROXY_SERVER', 'OLLAMA_MODEL', 'OPENAI_MODEL', 'ANTHROPIC_MODEL'];
        for (const variableName of variables) {
            await disableVariable(variableName);
        }
    }
    async function disableVariable(variableName) {
        try {
            let filePath = await getRCPath();
            let content = await readRCDaata();
            if (!content) throw null;
            let lines = content.split('\n');
            lines = lines.map(line => {
                let lineback = line;
                while (line.indexOf('  ') > -1) line = line.split('  ').join(' ');
                if (line.trim().startsWith(`export ${variableName}=`)) {
                    return `# ${lineback}`;
                }
                return lineback;
            });
            content = lines.join('\n');
            await fsPromises.writeFile(filePath, content);
        } catch (error) {
        }
        await loadConfig(true);
    }
    async function axiosPostWrap() {
        continousNetworkTryCount++;
        if (continousNetworkTryCount >= 10) {
            process.exit(1);
            return new Promise((resolve, reject) => {
                reject(new Error('too many tries'));
            })
        }
        return axios.post(...arguments);
    }
    async function ask_prompt_text(prompt) {
        continousNetworkTryCount = 0;
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return await new Promise(resolve => {
            rl.question(' ' + prompt + ': ', (df) => {
                resolve(df);
                rl.close();
            });
        })
    }
    function getModelName() {
        if (USE_LLM === 'openai') return OPENAI_MODEL;
        if (USE_LLM === 'gemini') return GEMINI_MODEL;
        if (USE_LLM === 'anthropic') return ANTHROPIC_MODEL;
        if (USE_LLM === 'ollama') return OLLAMA_MODEL;
        return '';
    }
    function getContextWindowSize() {
        let mode = getModelName();
        let data = {
            "llama3:latest": 8192,
            "llama3:8b-instruct-q8_0": 8192,
            "llama3:70b": 8192,
            "gemini-pro": 1000000,
            "gpt-4-turbo": 128000,
            "gpt-4": 8192,
            "gpt-3.5-turbo": 16385,
            "claude-3-opus-20240229": 200000,
            "claude-3-sonnet-20240229": 200000,
            "claude-3-haiku-20240307": 200000,
        }
        let value = data[mode];
        if (!value) value = 8192; // 걍.. 
        return value;
    }
    async function execAdv(cmd, mode = true, opt = {}) {
        if (isWindows()) {
            return new Promise(resolve => {
                shelljs.exec(mode ? `powershell -Command "${cmd}"` : cmd, { silent: true, ...opt }, (code, stdout, stderr) => {
                    resolve({ code, stdout, stderr });
                })
            })
        } else {
            return await new Promise(function (resolve) {
                shelljs.exec(cmd, { silent: true, ...opt }, function (code, stdout, stderr) {
                    resolve({ code, stdout, stderr });
                });
            });
        }
    };
    async function which(cmd) {
        if (cmd.indexOf(' ') > -1) process.exit(1);
        if (isWindows()) {
            let { stdout } = await execAdv(`(Get-Command ${cmd}).Source`)
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
    async function which_python() {
        let list = ['python', 'python3'];
        for (let i = 0; i < list.length; i++) {
            let name = list[i];
            let ppath = await which(name);
            if (!ppath) continue;
            if (false) if (ppath.indexOf(' ') > -1) throw ppath;
            let str = `${Math.random()}`;
            let rfg;
            if (isWindows()) rfg = await execAdv(`& '${ppath}' -c \\"print('${str}')\\"`, false);
            else rfg = await execAdv(`"${ppath}" -c "print('${str}')"`, false);
            let { stdout } = rfg;
            if (stdout.trim() === str) return ppath;
        }
    }
    async function isDebugMode() {
        return !!(await getEnvRCVar('AIEXEDEBUGMODE'));
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
                let content = []
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
    function doctorCheck(display = false) {
        let doctorOk = true;
        if (!python_interpreter) {
            if (display) console.error(chalk.yellowBright(" - Python is required to use this app."));
            doctorOk = false;
        }
        if (!USE_LLM) {
            if (display) console.error(chalk.yellowBright(' - The "USE_LLM" environment variable is missing but required to specify the LLM vendor.'));
            doctorOk = false;
        }
        if (USE_LLM === 'gemini') {
            if (!GOOGLE_API_KEY) {
                if (display) console.error(chalk.yellowBright(' - The "GOOGLE_API_KEY" environment variable is missing but required.'));
                doctorOk = false;
            }
        }
        if (USE_LLM === 'anthropic') {
            if (!ANTHROPIC_API_KEY) {
                if (display) console.error(chalk.yellowBright(' - The "ANTHROPIC_API_KEY" environment variable is missing but required.'));
                doctorOk = false;
            }
            if (!ANTHROPIC_MODEL) {
                if (display) console.error(chalk.yellowBright(' - The "ANTHROPIC_MODEL" environment variable is missing but required.'));
                doctorOk = false;
            }
        }
        if (USE_LLM === 'openai') {
            if (!OPENAI_MODEL) {
                if (display) console.error(chalk.yellowBright(" - The 'OPENAI_MODEL' environment variable is required and must specify the name of the LLM model."));
                doctorOk = false;
            }
            if (!OPENAI_API_KEY) {
                if (display) console.error(chalk.yellowBright(" - The 'OPENAI_API_KEY' environment variable is required and must contain the API Key for using OpenAI's LLM."));
                doctorOk = false;
            }
        }
        if (USE_LLM === 'ollama') {
            if (!OLLAMA_MODEL) {
                if (display) console.error(chalk.yellowBright(" - The environment variable 'OLLAMA_MODEL' is required and should contain the name of the LLM model."));
                doctorOk = false;
            }
        }
        if (!PYTHON_VENV_PATH) {
            if (display) console.error(chalk.yellowBright(" - The 'PYTHON_VENV_PATH' environment variable is required and should contain the path to the Python virtual environment."));
            doctorOk = false;
        } else {
            try {
                fs.readdirSync(`${PYTHON_VENV_PATH}`);
            } catch {
                if (display) console.error(chalk.yellowBright(` - ${PYTHON_VENV_PATH} Python's venv folder is needed.`));
                if (display) console.error(chalk.yellowBright(` - ${python_interpreter} -m venv "${PYTHON_VENV_PATH}"`));
                doctorOk = false;
            }
        }
        return doctorOk;
    }
    let testmode = !true;
    async function execInVenv(command, app) {
        let response = await new Promise(resolve => {
            app = app.toLowerCase();
            let python = ['python', 'python3'].includes(app);
            let pip = ['pip', 'pip3'].includes(app);
            let child;
            function addslashes(str) { return str.replace(/[\\"]/g, '\\$&').replace(/\u0000/g, '\\0'); }
            if (isWindows()) {
                let activateCmd = `${PYTHON_VENV_PATH}\\Scripts\\Activate.ps1`;
                let pythonInterpreterPath = ''
                if (python) pythonInterpreterPath = ([
                    `${PYTHON_VENV_PATH}\\Scripts\\python.exe`,
                    `${PYTHON_VENV_PATH}\\Scripts\\python3.exe`,
                    python_interpreter
                ]).find(fs.existsSync);
                else if (pip) pythonInterpreterPath = ([
                    `${PYTHON_VENV_PATH}\\Scripts\\pip.exe`,
                    `${PYTHON_VENV_PATH}\\Scripts\\pip3.exe`,
                ]).find(fs.existsSync);
                const python_interpreter_ = pythonInterpreterPath || '';
                if (!python_interpreter_) throw new Error('Python Interpreter Not Found');
                let pythonCmd = `'${python_interpreter_}' ${addslashes(command)}`;
                let runcmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {& '${activateCmd}'}; {& ${pythonCmd}}" < nul`;
                // console.log(runcmd);
                child = shelljs.exec(runcmd, { async: true, silent: true });
            } else {
                let pythonInterpreterPath = ''
                if (python) pythonInterpreterPath = ([
                    `${PYTHON_VENV_PATH}/bin/python`,
                    `${PYTHON_VENV_PATH}/bin/python3`,
                    python_interpreter
                ]).find(fs.existsSync);
                else if (pip) pythonInterpreterPath = ([
                    `${PYTHON_VENV_PATH}/bin/pip`,
                    `${PYTHON_VENV_PATH}/bin/pip3`,
                ]).find(fs.existsSync);
                const python_interpreter_ = pythonInterpreterPath || '';
                if (!python_interpreter) throw new Error('Python Interpreter Not Found');
                let runcmd = `"${bash_path}" -c "source \\"${PYTHON_VENV_PATH}/bin/activate\\" && \\"${python_interpreter_}\\" ${addslashes(command)} < /dev/null"`;
                // console.log(runcmd)
                child = shelljs.exec(runcmd, { async: true, silent: true });
            }
            let stdout = [];
            let stderr = [];
            child.stdout.on('data', function (data) {
                stdout.push(data);
                process.stdout.write(chalk.greenBright(data));
            });
            child.stderr.on('data', function (data) {
                if (data.indexOf(`warnings.warn("`) > -1 && data.indexOf(`Warning: `) > -1) return;
                stderr.push(data);
                process.stderr.write(chalk.red(data));
            });
            child.on('close', function (code) {
                stdout = stdout.join('');
                stderr = stderr.join('');
                resolve({ code, stdout, stderr });
            });
        });
        return response;
    }

    async function shell_exec(python_code) {
        let response = await new Promise(resolve => {
            let scriptPath = `${PYTHON_VENV_PATH}/._code.py`;
            let warninglist = ["DeprecationWarning", "UserWarning", "FutureWarning", "ImportWarning", "RuntimeWarning", "SyntaxWarning", "PendingDeprecationWarning", "ResourceWarning", "InsecureRequestWarning", "InsecurePlatformWarning"];
            let modulelist = ["abc", "argparse", "array", "ast", "asyncio", "atexit", "base64", "bdb", "binascii", "bisect", "builtins", "bz2", "calendar", "cmath", "cmd", "code", "codecs", "codeop", "collections", "colorsys", "compileall", "concurrent", "configparser", "contextlib", "contextvars", "copy", "copyreg", "cProfile", "csv", "ctypes", "dataclasses", "datetime", "dbm", "decimal", "difflib", "dis", "doctest", "email", "encodings", "ensurepip", "enum", "errno", "faulthandler", "filecmp", "fileinput", "fnmatch", "fractions", "ftplib", "functools", "gc", "getopt", "getpass", "gettext", "glob", "graphlib", "gzip", "hashlib", "heapq", "hmac", "html", "http", "imaplib", "importlib", "inspect", "io", "ipaddress", "itertools", "json", "keyword", "linecache", "locale", "logging", "lzma", "mailbox", "mailcap", "marshal", "math", "mimetypes", "mmap", "modulefinder", "multiprocessing", "netrc", "nntplib", "numbers", "operator", "optparse", "os", "pathlib", "pdb", "pickle", "pickletools", "pkgutil", "platform", "plistlib", "poplib", "posixpath", "pprint", "profile", "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc", "queue", "quopri", "random", "re", "reprlib", "rlcompleter", "runpy", "sched", "secrets", "select", "selectors", "shelve", "shlex", "shutil", "signal", "site", "smtpd", "smtplib", "sndhdr", "socket", "socketserver", "sqlite3", "ssl", "stat", "statistics", "string", "stringprep", "struct", "subprocess", "sunau", "symtable", "sys", "sysconfig", "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile", "test", "textwrap", "threading", "time", "timeit", "token", "tokenize", "trace", "traceback", "tracemalloc", "tty", "turtle", "types", "typing", "unicodedata", "unittest", "urllib", "uu", "uuid", "venv", "warnings", "wave", "weakref", "webbrowser", "wsgiref", "xdrlib", "xml", "xmlrpc", "zipapp", "zipfile", "zipimport", "zlib", "zoneinfo", "numpy", "pandas", "matplotlib", "seaborn", "scipy", "tensorflow", "keras", "torch", "statsmodels", "xgboost", "lightgbm", "gensim", "nltk", "pillow", "requests", "beautifulsoup4", "mahotas", "simplecv", "pycairo", "pyglet", "openpyxl", "xlrd", "xlwt", "pyexcel", "PyPDF2", "reportlab", "moviepy", "vidgear", "imutils", "pytube", "pafy"];
            let python_code_ = [
                `${warninglist.map(name => `try:\n   import warnings\n   warnings.filterwarnings("ignore", category=${name})\nexcept Exception as e:\n   pass`).join('\n')}`,
                `${modulelist.map(name => `try:\n   import ${name}\nexcept Exception as e:\n   pass`).join('\n')}`,
                `try:\n   sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')\nexcept Exception as e:\n   pass`,
                `${python_code}`
            ].join('\n');
            fs.writeFileSync(scriptPath, python_code_);
            let child;
            if (isWindows()) {
                let activateCmd = `${PYTHON_VENV_PATH}\\Scripts\\Activate.ps1`;
                const pythonInterpreterPath = [
                    `${PYTHON_VENV_PATH}\\Scripts\\python.exe`,
                    `${PYTHON_VENV_PATH}\\Scripts\\python3.exe`,
                    python_interpreter
                ].find(fs.existsSync);
                const python_interpreter_ = pythonInterpreterPath || '';
                if (!python_interpreter_) throw new Error('Python Interpreter Not Found');
                let pythonCmd = `'${python_interpreter_}' -u '${scriptPath}'`;
                child = shelljs.exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {& '${activateCmd}'}; {& ${pythonCmd}}" < nul`, { async: true, silent: true });
            } else {
                const pythonInterpreterPath = [
                    `${PYTHON_VENV_PATH}/bin/python`,
                    `${PYTHON_VENV_PATH}/bin/python3`,
                    python_interpreter
                ].find(fs.existsSync);
                const python_interpreter_ = pythonInterpreterPath || '';
                if (!python_interpreter) throw new Error('Python Interpreter Not Found');
                child = shelljs.exec(`"${bash_path}" -c "source \\"${PYTHON_VENV_PATH}/bin/activate\\" && \\"${python_interpreter_}\\" -u \\"${scriptPath}\\" < /dev/null"`, { async: true, silent: true });
            }
            let stdout = [];
            let stderr = [];
            child.stdout.on('data', function (data) {
                stdout.push(data);
                process.stdout.write(chalk.greenBright(data));
            });
            child.stderr.on('data', function (data) {
                if (data.indexOf(`warnings.warn("`) > -1 && data.indexOf(`Warning: `) > -1) return;
                stderr.push(data);
                process.stderr.write(chalk.red(data));
            });
            child.on('close', function (code) {
                stdout = stdout.join('');
                stderr = stderr.join('');
                resolve({ code, stdout, stderr, python_code });
            });
        });
        return response;
    }
    async function geminiChat(messages) {
        const debugMode = false;
        while (true) {
            let tempMessageForIndicator = oraBackupAndStopCurrent();
            let indicator = ora((`Requesting ${chalk.bold(GEMINI_MODEL)}`)).start()
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
                let response = await axiosPostWrap(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`, {
                    contents: clonedMessage
                }, { headers: { 'content-type': 'application/json' } });
                try {
                    python_code = response.data.candidates[0].content.parts[0].text;
                } catch {
                    if (response.data.candidates[0].finishReason) {
                        python_code = `${threeticks}\nprint("Request couldn't accept reason for ${response.data.candidates[0].finishReason}")\n${threeticks}`
                    }
                }
                indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(GEMINI_MODEL)} succeeded`));
                oraStart(tempMessageForIndicator);
                return python_code;
            } catch (e) {
                indicator.fail(chalk.red(`Requesting ${chalk.bold(GEMINI_MODEL)} failed`));
                oraStart(tempMessageForIndicator);

                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw e;
                    break;
                }

            }
        }
    }
    async function anthropicChat(messages) {
        while (true) {
            let tempMessageForIndicator = oraBackupAndStopCurrent();
            let indicator = ora((`Requesting ${chalk.bold(ANTHROPIC_MODEL)}`)).start()
            try {
                let clonedMessage = JSON.parse(JSON.stringify(messages));
                let system = clonedMessage[0].content;
                clonedMessage.shift();
                let response = await axiosPostWrap('https://api.anthropic.com/v1/messages', {
                    model: ANTHROPIC_MODEL,
                    max_tokens: 1024,
                    system,
                    messages: clonedMessage
                }, {
                    headers: {
                        'x-api-key': ANTHROPIC_API_KEY, // 환경 변수에서 API 키를 가져옵니다.
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    }
                });
                let resd = response.data.content[0].text;
                indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(ANTHROPIC_MODEL)} succeeded`));
                oraStart(tempMessageForIndicator);
                return resd;
            } catch (e) {
                indicator.fail(chalk.red(`Requesting ${chalk.bold(ANTHROPIC_MODEL)} failed`));
                oraStart(tempMessageForIndicator);

                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw e;
                    break;
                }
            }
        }
    }
    async function openaiChat(messages) {
        let completion;
        while (true) {
            let tempMessageForIndicator = oraBackupAndStopCurrent();
            let indicator = ora((`Requesting ${chalk.bold(OPENAI_MODEL)}`)).start()
            try {
                completion = await axiosPostWrap('https://api.openai.com/v1/chat/completions', { model: OPENAI_MODEL, messages, }, {
                    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
                });
                let python_code = completion.data.choices[0].message.content;
                indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OPENAI_MODEL)} succeeded`));
                oraStart(tempMessageForIndicator);
                return python_code;
            } catch (e) {
                indicator.fail(chalk.red(`Requesting ${chalk.bold(OPENAI_MODEL)} failed`));
                oraStart(tempMessageForIndicator);
                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    throw e;
                    break;
                }
            }
        }
    }
    async function aiChat(messages) {
        if (USE_LLM === 'openai') return await openaiChat(messages);
        if (USE_LLM === 'gemini') return await geminiChat(messages);
        if (USE_LLM === 'anthropic') return await anthropicChat(messages);
        if (USE_LLM === 'ollama') return await ollamaChat(messages);
    }
    async function ollamaChat(messages) {
        let airesponse;
        let response;
        let options = {
            temperature: 0
        }
        if (OLLAMA_PROXY_SERVER) {
            while (true) {
                let tempMessageForIndicator = oraBackupAndStopCurrent();
                let indicator = ora((`Requesting ${chalk.bold(OLLAMA_MODEL)}`)).start()
                try {
                    airesponse = await axiosPostWrap(OLLAMA_PROXY_SERVER, { proxybody: { model: OLLAMA_MODEL, stream: false, options, messages } });
                    indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OLLAMA_MODEL)} succeeded`));
                    oraStart(tempMessageForIndicator);
                    break;
                } catch (e) {
                    indicator.fail(chalk.red(`Requesting ${chalk.bold(OLLAMA_MODEL)} failed`));
                    oraStart(tempMessageForIndicator);

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
                let tempMessageForIndicator = oraBackupAndStopCurrent();
                let indicator = ora((`Requesting ${chalk.bold(OLLAMA_MODEL)}`)).start()
                try {
                    airesponse = await axiosPostWrap('http://localhost:11434/api/chat', { model: OLLAMA_MODEL, stream: false, options, messages });
                    indicator.succeed(chalk.greenBright(`Requesting ${chalk.bold(OLLAMA_MODEL)} succeeded`));
                    oraStart(tempMessageForIndicator);
                    break;
                } catch (e) {
                    indicator.fail(chalk.red(`Requesting ${chalk.bold(OLLAMA_MODEL)} failed`));
                    oraStart(tempMessageForIndicator);
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
    function combindMessageHistory(summary, messages_, history, askforce) {
        return [
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
                    `- Response only the python code.`,
                    `- As import modules, use try-except to first check whether the module you want to use exists, and if it does not exist, include logic to install it as a subprocess not the way commanding in Jupyter Notebooks like \`!pip\``,
                    `- Please avoid using commands that only work in interactive environments like Jupyter Notebooks, especially those starting with \`!\`, in standard Python script files.`,
                    `- Always use the explicit output method via the print function, not expression evaluation, when your Python code displays results.`,
                    `- Code should include all dependencies such as variables and functions required for proper execution.`,
                    `- Never explain about response`,
                    `- The code must contain all dependencies such as referenced modules, variables, functions, and classes in one code.`,
                    `- The entire response must consist of only one complete form of code.`,
                    `${isWindows() ? `The Python code will run on Microsoft Windows Environment\n` : ''}`,
                    `## CODING CONVENTIONS:`,
                    `- STANDARD CODING STYLE TO IMPORT:`,
                    `    If you want to use a module in your code, import the module using the following logic before using it.`,
                    `    ${threeticks}python`,
                    `    try:`,
                    `        import package_name`,
                    `    except ImportError:`,
                    `        import subprocess`,
                    `        subprocess.run(['pip', 'install', 'package_name'])`,
                    `    package_name # using of the module after importing logic`,
                    `    ${threeticks}`,
                    ``,
                    `## Exception`,
                    `- As an exception, if you request a simple explanation that does not require Python code to resolve the user's request, please respond with an explanation in natural language rather than Python code.`,
                    ``,
                    `${summary ? `## SUMMARY SO FAR:` : ''}`,
                    `${summary ? summary : ''}`,
                ].join('\n').trim()
            },
            ...messages_
            , ...history
        ]
    }
    async function code_generator(summary, messages_ = [], history = [], askforce, debugMode, defineNewMission, addHistory, getPrompt) {
        let python_code = '';
        let abort = false;
        try {
            while (true) {
                let messages = combindMessageHistory(summary, messages_, history, askforce);
                oraStop();
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
                if (askforce === 'responsed_code_is_invalid_syntax') {
                    let request = (await ask_prompt_text(`What can I do for you?`)).trim(); // 이 물음에서 진행했을때 `Nothing responsed`의 상황이 만들어진다.
                    if (request) {
                        defineNewMission(request);
                    } else {
                        abort = true;
                        break;
                    }
                    askforce = '';
                    continue;
                }
                else if (askforce === 'responsed_opinion') {
                    let request = (await ask_prompt_text(`What can I do for you?`)).trim();
                    if (request) {
                        defineNewMission(request);
                    } else {
                        abort = true;
                        break;
                    }
                    askforce = '';
                    continue;
                }
                else if (askforce === 'run_code_causes_error' || askforce === 'nothing_responsed') {
                    print('Would you like to request the creation of a revised code?')
                    print('Please select an option:')
                    continousNetworkTryCount = 0;
                    let mode = ['Create of a revised code', 'Modify Prompt', 'Quit'];
                    let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
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
                            print(`Previous prompt: ${chalk.bold(getPrompt())}`);
                            let request = (await ask_prompt_text(askingMent)).trim();
                            if (request) {
                                if (askforce === 'run_code_causes_error') {
                                    history.at(-1).content += `\n\nDon't say anything`;
                                    addHistory({ role: "assistant", content: '' });
                                    defineNewMission(request, true); // dont remove
                                    false && print(JSON.stringify(history, undefined, 3));
                                }
                                if (askforce === 'nothing_responsed') defineNewMission(request);
                                print('The request has been changed.\nRequesting again with the updated request.');
                            } else {
                                print('There are no changes.\nRequesting again with the original request.');
                            }
                        } catch (e) {
                            print(e);
                        }
                        askforce = '';
                        continue;
                    }
                    else if (index === 2) {
                        abort = true;
                        break;
                    }
                    print('')
                }
                oraStart(`Generating code with ${chalk.bold(getModelName())}`);
                if (disableOra) oraStop();
                if (USE_LLM === 'ollama') {
                    python_code = await aiChat(messages);
                } else if (USE_LLM === 'openai') {
                    if (debugMode) debugMode.leave('AIREQ', messages);
                    try {
                        python_code = await aiChat(messages);
                    } catch (e) {
                        oraFail(chalk.redBright(e.response.data.error.message));
                        if (e.response.data.error.code === 'invalid_api_key') {
                            let answer = await ask_prompt_text(`What is your OpenAI API key for accessing OpenAI services?`);
                            await disableVariable('OPENAI_API_KEY');
                            await setVarVal('OPENAI_API_KEY', answer);
                            continue;
                        } else {
                            abort = true;
                            break;
                        }
                    }
                } else if (USE_LLM === 'anthropic') {
                    try {
                        python_code = await aiChat(messages)
                    } catch (e) {
                        oraFail(chalk.redBright(e.response.data.error.message));
                        if (e.response.data.error.type === 'authentication_error') {
                            let answer = await ask_prompt_text(`What is your Anthropic API key for accessing Anthropic services?`);
                            await disableVariable('ANTHROPIC_API_KEY');
                            await setVarVal('ANTHROPIC_API_KEY', answer);
                            continue;
                        } else {
                            abort = true;
                            break;
                        }
                    }

                } else if (USE_LLM === 'gemini') {
                    try {
                        python_code = await aiChat(messages);
                    } catch (e) {
                        oraFail(chalk.redBright(e.response.data.error.message));
                        if (e.response.data.error.status === 'INVALID_ARGUMENT') {
                            // 이 상황이 꼭 API키가 잘못되었을경우만 있는것은 아니다.
                            if (true) process.exit(1);
                            let answer = await ask_prompt_text(`What is your Gemini API key for accessing Gemini services?`);
                            await disableVariable('GOOGLE_API_KEY');
                            await setVarVal('GOOGLE_API_KEY', answer);
                            continue;
                        } else {
                            abort = true;
                            break;
                        }
                    }
                }
                break;
            }
        } catch { }
        let err = '';
        let raw = python_code;
        let correct_code = await isCorrectCode(python_code);
        if (correct_code.python_code) python_code = correct_code.python_code;
        if (correct_code.err) python_code = '';
        if (correct_code.err) err = correct_code.err;
        let generateSuccess = !err && !!python_code;
        if (generateSuccess) {
            oraSucceed(chalk.greenBright(`Generation succeeded with ${chalk.bold(getModelName())}`))
        } else {
        }
        oraStop();
        const rst = { raw, err, correct_code: !!python_code, python_code, abort, usedModel: getModelName() };
        return rst;
    }
    function getModelName() {
        if (USE_LLM === 'ollama') {
            return OLLAMA_MODEL;
        } else if (USE_LLM === 'openai') {
            return OPENAI_MODEL;
        } else if (USE_LLM === 'anthropic') {
            return ANTHROPIC_MODEL;
        } else if (USE_LLM === 'gemini') {
            return GEMINI_MODEL;
        }
    }
    function nakeFence(airesponsetext, list = ['python3', 'python2', 'python', 'py', '']) {
        if ((typeof airesponsetext) !== 'string') return '';
        if (airesponsetext.trim() === '') return '';
        if (list.filter(a => a === '').length === 0) list.push('');

        function genTicks(n) {
            return '`'.repeat(n);
        }
        {
            let splited = airesponsetext.split(threeticks);
            if (splited.length === 3) {
                splited[0] = '';
                splited[2] = '';
                airesponsetext = splited.join(threeticks);
            }
        }

        let endPadding = 0;
        let startPadding = 0;

        let loopcount = 10;
        for (let i = loopcount; i > 0; i--) {
            let ticks = genTicks(i);
            let endsWithTicks = airesponsetext.trim().endsWith(ticks);
            if (endsWithTicks) {
                endPadding = ticks.length;
                break;
            }
        }
        if (!startPadding) {
            list = [...list.map(a => a.toLowerCase()), ...list.map(a => a.toUpperCase())];
            for (let f = 0; f < list.length; f++) {
                let word = list[f];
                for (let i = loopcount; i > 0; i--) {
                    let ticks = genTicks(i);
                    let startsWithTicksWithPython = airesponsetext.trim().toLowerCase().startsWith(ticks + word);
                    if (startsWithTicksWithPython) {
                        startPadding = (ticks + word).length;
                        break;
                    }
                }
                if (startPadding) break;
            }
        }
        airesponsetext = airesponsetext.trim().substring(startPadding, airesponsetext.trim().length - endPadding)
        function removeMinIndentation(text) {
            const lines = text.split('\n');
            let minIndent = Infinity;
            for (const line of lines) {
                if (line.trim().length === 0) continue;
                const leadingSpaces = line.match(/^ */)[0].length;
                if (leadingSpaces < minIndent) {
                    minIndent = leadingSpaces;
                }
            }
            const result = lines.map(line => line.slice(minIndent)).join('\n');
            return result;
        }
        if (airesponsetext.trim()) {
            airesponsetext = removeMinIndentation(airesponsetext);
            airesponsetext = airesponsetext.trim();
            return airesponsetext;
        }
        return '';
    }
    async function isCorrectCode(python_code) {
        let rtcode = {
            python_code: '',
            err: '',
        };
        if ((typeof python_code) !== 'string') return rtcode;
        if (python_code.trim() === '') return rtcode;

        function genTicks(n) {
            return '`'.repeat(n);
        }
        {
            let splited = python_code.split(threeticks);
            if (splited.length === 3) {
                splited[0] = '';
                splited[2] = '';
                python_code = splited.join(threeticks);
            }
        }

        let endPadding = 0;
        let startPadding = 0;

        let loopcount = 10;
        for (let i = loopcount; i > 0; i--) {
            let ticks = genTicks(i);
            let endsWithTicks = python_code.trim().endsWith(ticks);
            if (endsWithTicks) {
                endPadding = ticks.length;
                break;
            }
        }
        if (!startPadding) {
            let list = ['python3', 'python2', 'python', 'py', ''];
            list = [...list.map(a => a.toLowerCase()), ...list.map(a => a.toUpperCase())];
            for (let f = 0; f < list.length; f++) {
                let word = list[f];
                for (let i = loopcount; i > 0; i--) {
                    let ticks = genTicks(i);
                    let startsWithTicksWithPython = python_code.trim().toLowerCase().startsWith(ticks + word);
                    if (startsWithTicksWithPython) {
                        startPadding = (ticks + word).length;
                        break;
                    }
                }
                if (startPadding) break;
            }
        }
        python_code = python_code.trim().substring(startPadding, python_code.trim().length - endPadding)
        function removeMinIndentation(text) {
            const lines = text.split('\n');
            let minIndent = Infinity;
            for (const line of lines) {
                if (line.trim().length === 0) continue;
                const leadingSpaces = line.match(/^ */)[0].length;
                if (leadingSpaces < minIndent) {
                    minIndent = leadingSpaces;
                }
            }
            const result = lines.map(line => line.slice(minIndent)).join('\n');
            return result;
        }
        if (python_code.trim()) {
            python_code = removeMinIndentation(python_code);
            python_code = python_code.trim();
            fs.writeFileSync(`${PYTHON_VENV_PATH}` + '/._tmpcode.py', python_code);
            let err = await code_validator(`${PYTHON_VENV_PATH}` + '/._tmpcode.py');
            if (err) {
                rtcode.err = err;
                rtcode.syntaxtest = { code: python_code, error: err };
            } else {
                rtcode.python_code = python_code;
            }
        }
        return rtcode;
    }
    async function code_validator(filepath) { // OK
        if (isWindows()) {
            let pythonCmd = `'${python_interpreter}' -m py_compile '${filepath}'`;
            let activateCmd = `${PYTHON_VENV_PATH}\\Scripts\\Activate.ps1`;
            return await new Promise(resolve => {
                shelljs.exec(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {& '${activateCmd}'}; {& ${pythonCmd}}" < nul`, { silent: true }, function (code, stdout, stderr) {
                    resolve(stderr.trim())
                });
            });
        } else {
            let pythonCmd = `'${python_interpreter}' -m py_compile '${filepath}'`;
            return await new Promise(resolve => {
                shelljs.exec(`${bash_path} -c "source ${PYTHON_VENV_PATH}/bin/activate && ${pythonCmd}"`, { silent: true }, function (code, stdout, stderr) {
                    resolve(stderr.trim())
                });
            });
        }
    }
    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}-${milliseconds}`;
    }
    async function getRCPath() {
        if (isWindows()) {
            const pathd = `${os.homedir()}/.aiexe.configuration`;
            try { fs.mkdirSync(pathd); } catch { }
            if (!fs.existsSync(pathd)) return '';
            let filepath = `${pathd}/configuration`;
            try { fs.readFileSync(filepath); } catch { fs.appendFileSync(filepath, ''); }
            return filepath;
        } else {
            const shell = process.env.SHELL;
            let filePath;
            let lastName = shell.split('/').at(-1);
            if (lastName === ('zsh')) {
                filePath = path.join(os.homedir(), '.zshrc');
            } else if (lastName === ('bash')) {
                const bashProfilePath = path.join(os.homedir(), '.bash_profile');
                const bashrcPath = path.join(os.homedir(), '.bashrc');
                async function checkFilePath(bashProfilePath, bashrcPath) {
                    let filePath;
                    try {
                        await fsPromises.access(bashProfilePath, fsPromises.constants.F_OK);
                        filePath = bashProfilePath;
                    } catch {
                        filePath = bashrcPath;
                    }
                    return filePath;
                }
                filePath = await checkFilePath(bashProfilePath, bashrcPath);
            } else {
                return;
            }
            return filePath;
        }
    }
    async function readRCDaata() {
        let currentContents;
        try {
            let path = await getRCPath();
            currentContents = await fsPromises.readFile(path, 'utf8');
        } catch (err) {
            currentContents = '';
        }
        return currentContents;
    }
    async function findMissingVars(envConfig) {
        let currentContents = await readRCDaata();
        let list = [];
        currentContents = currentContents.split('\n');
        for (const [key, value] of Object.entries(envConfig)) {
            const pattern = new RegExp(`^\\s*export\\s+${key}\\s*=\\s*['"]?([^'"\n]+)['"]?`, 'm');
            if (!currentContents.some(line => pattern.test(line))) list.push(key);
        }
        return list;
    }
    async function isKeyInConfig(keyname) {
        let list = await findMissingVars({ [keyname]: true });
        return list[0] !== keyname;
    }
    async function venvCandidatePath() {
        let homePath = os.homedir();
        let count = 0;
        let _path;
        while (true) {
            try {
                _path = `${homePath}/.aiexe_venv${count ? `_${count}` : ''}`;
                await fsPromises.mkdir(_path)
                break;
            } catch {
                count++;
            }
        }
        return _path;
    }
    async function setVarVal(key, value) {
        if (await isKeyInConfig(key)) return;
        let typeone = str => {
            for (let i = 0; i < str.length; i++) {
                const ch = str[i];
                if (!(ch >= 'A' && ch <= 'Z') && // 대문자 알파벳
                    !(ch >= 'a' && ch <= 'z') && // 소문자 알파벳
                    !(ch >= '0' && ch <= '9') && // 숫자
                    ch !== '-' && ch !== '_' && ch !== '/' && ch !== '.' && ch !== ':' && (isWindows() ? ch !== '\\' : '/')) {
                    return false;
                }
            }
            return true;
        };
        const regChecker = {
            USE_LLM: typeone,
            GOOGLE_API_KEY: typeone,
            OPENAI_API_KEY: typeone,
            ANTHROPIC_API_KEY: typeone,
            ANTHROPIC_MODEL: typeone,
            OLLAMA_PROXY_SERVER: typeone,
            OLLAMA_MODEL: typeone,
            OPENAI_MODEL: typeone,
            PYTHON_VENV_PATH: typeone,
        };
        if (!regChecker[key]) return;
        if (!regChecker[key](value)) return;
        let rcPath = await getRCPath();
        let cmd = `export ${key}="${value}"`;
        await fsPromises.appendFile(rcPath, `\n${cmd}\n`);
        await loadConfig(true);
    }
    async function turnOnOllamaAndGetModelList() {
        let count = 10;
        while (count >= 0) {
            count--;
            try {
                return await axios.get('http://localhost:11434/api/tags');
            } catch (e) {
                if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else if (e.code === 'ECONNREFUSED') {
                    let ollamaPath = (await which('ollama')).trim();
                    if (!ollamaPath) break;
                    if (false) if (ollamaPath.indexOf(' ') > -1) break;
                    let ddd;
                    if (isWindows()) ddd = await execAdv(`& '${ollamaPath}' list`, true, { timeout: 5000 });
                    else ddd = await execAdv(`${ollamaPath} list`, true, { timeout: 5000 });
                    let { code } = ddd;
                    if (code) break;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    break;
                }
            }
        }
    }
    async function getVarVal(key) {
        try {
            const rcPath = await getRCPath();
            if (!rcPath) return null;
            const contents = await fs.promises.readFile(rcPath, 'utf8');
            const pattern = new RegExp(`^\\s*export\\s+${key}\\s*=\\s*['"]?([^'"\n]+)['"]?`, 'm');
            const match = pattern.exec(contents);
            return match ? match[1] : null;
        } catch (err) {
            // console.error('Error reading the RC file:', err);
            return null;
        }
    }
    async function installProcess() {
        let setted = false;
        const pythonPath = await checkPython();
        if (false) if (!pythonPath) {
            print('* Python is not installed in your system. Python is required to use this app');
            throw new Error('Python is not installed in your system. Python is required to use this app');
        }
        if (!await isKeyInConfig('PYTHON_VENV_PATH')) {
            if (pythonPath) {
                let path = await venvCandidatePath();
                oraStart('Creating virtual environment for Python');
                if (disableOra) oraStop();
                let res;
                if (isWindows()) res = await execAdv(`& '${pythonPath}' -m venv \\"${path}\\"`); //dt
                else res = await execAdv(`"${pythonPath}" -m venv "${path}"`)
                if (res.code === 0) {
                    await setVarVal('PYTHON_VENV_PATH', path);
                    oraSucceed(chalk.greenBright('Creating virtual environment for Python successed'));
                } else {
                    oraFail(chalk.redBright('Creating VENV fail'));
                    console.error(chalk.yellowBright(res.stdout))
                    throw new Error('Creating VENV fail');
                }
            }
        }
        if (!await isKeyInConfig('USE_LLM')) {
            print(chalk.bold('Which LLM vendor do you prefer?'))
            continousNetworkTryCount = 0;
            let mode = ['OpenAI', 'Anthropic', 'Ollama', 'Gemini'];
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
                continousNetworkTryCount = 0;
                let mode = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
                let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
                await setVarVal('OPENAI_MODEL', mode[index]);
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
                continousNetworkTryCount = 0;
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
                await loadConfig(true);
                return await installProcess();
            }
            else if (false && ollamaPath.indexOf(' ') > -1) {
                print(`* Ollama found located at "${ollamaPath}"`);
                print("However, the path should not contain spaces.");
                await disableVariable('USE_LLM');
                await loadConfig(true);
                return await installProcess();
            }
            if (ollamaPath && !await isKeyInConfig('OLLAMA_MODEL')) {
                try {
                    let list = await turnOnOllamaAndGetModelList();
                    if (!list) {
                        print('* Ollama server is not ready');
                        print(`Ollama command located at ${chalk.bold(ollamaPath)}`)
                        await disableVariable('USE_LLM');
                        await loadConfig(true);
                        return await installProcess();
                    }
                    if (list) {
                        try {
                            if (list.data.models.length) {
                                print(chalk.bold('Which Ollama model do you want to use for your queries?'))
                                let mode = list.data.models.map(a => a.name);
                                continousNetworkTryCount = 0;
                                let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
                                await setVarVal('OLLAMA_MODEL', mode[index]);
                                setted = true;
                            } else {
                                throw 1;
                            }
                        } catch {
                            print('* You have no model installed in Ollama');
                            await disableVariable('USE_LLM');
                            await loadConfig(true);
                            return await installProcess();
                        }
                    }
                } catch {
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
        await loadConfig(true);
        return setted;
    }
    async function checkPython() {
        let python_interpreter;
        try {
            python_interpreter = await which_python();
        } catch {
        }
        if (!python_interpreter) {
            console.error('This app requires python interpreter.')
            process.exit(1)
            return;
        } else if (false && python_interpreter.indexOf(' ') > -1) {
            print(`* Python interpreter found located at "${e}"`);
            print("However, the path should not contain spaces.");
            process.exit(1)
            return;
        }
        return python_interpreter;
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
        .option('-b, --debug', 'Debug mode')
        .option('-p, --python <command>', 'Run a command in the Python virtual environment')
        .action(async (prompt, options) => {

            if (!isWindows() && !bash_path) {
                console.error('This app requires bash to function.')
                process.exit(1)
            }

            if (options.python) {
                try {
                    await checkPython();
                    let clone = options.python.split(' ');
                    let commd = clone[0];
                    clone.shift();
                    await execInVenv(clone.join(' '), commd);
                } catch { }
                return;
            }
            if (options.destination) {
                try {
                    await installProcess();
                    let forignLanguage = { "en": "foreign language", "fr": "langue étrangère", "ko": "외국어", "ja": "外国語", "vi": "ngoại ngữ", "es": "idioma extranjero", "de": "Fremdsprache", "zh": "外语", "ru": "иностранный язык", "it": "lingua straniera", "pt": "língua estrangeira", "hi": "विदेशी भाषा" };
                    let hello = { "en": "Hello", "fr": "Bonjour", "ko": "안녕하세요", "ja": "こんにちは", "vi": "Xin chào", "es": "Hola", "de": "Hallo", "zh": "你好", "ru": "Привет", "it": "Ciao", "pt": "Olá", "hi": "नमस्ते", };
                    let howAreYou = { "en": "How are you?", "fr": "Comment allez-vous ?", "ko": "어떻게 지내세요?", "ja": "お元気ですか？", "vi": "Bạn khỏe không?", "es": "¿Cómo estás?", "de": "Wie geht es Ihnen?", "zh": "你好吗？", "ru": "Как дела?", "it": "Come stai?", "pt": "Como você está?", "hi": "आप कैसे हैं?", };
                    let whatAreYouDoing = { "en": "What are you doing?", "fr": "Que faites-vous ?", "ko": "무엇을 하고 계세요?", "ja": "何をしていますか？", "vi": "Bạn đang làm gì?", "es": "¿Qué estás haciendo?", "de": "Was machst du?", "zh": "你在做什么？", "ru": "Что ты делаешь?", "it": "Cosa stai facendo?", "pt": "O que você está fazendo?", "hi": "तुम क्या कर रहे हो?", };
                    const langtable = { "en": "English", "fr": "French", "ko": "Korean", "ja": "Japanese", "vi": "Vietnamese", "es": "Spanish", "de": "German", "zh": "Chinese", "ru": "Russian", "it": "Italian", "pt": "Portuguese", "hi": "Hindi", };
                    if (!Object.keys(langtable).includes(options.destination.toLowerCase())) {
                        console.log(`Unsupported destination language: ${options.destination}`);
                        return;
                    }
                    const promptTemplate = {
                        [`en`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `You are a highly skilled translator for translating #LANGCODE# into English.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Translate the following #LANGCODE# text into English.
                                #TRANSDATA#
                                Guidelines
                                - Please only use characters that make up the alphabet and English.
                                - Provide your answer in JSON format. {"english":"Translated English content"}
                                - Use a natural, gentle writing style and appropriate words, expressions, and vocabulary.
                                - Translate everything as is, without leaving out any content from the original text.
                                - Do not include any content other than JSON.`
                            }
                        ],
                        [`fr`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Vous êtes un traducteur très compétent pour traduire #LANGCODE# en français.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Veuillez traduire la phrase #LANGCODE# suivante en français.
                                #TRANSDATA#
                                Instructions
                                - Répondez uniquement en utilisant l'alphabet latin et en français.
                                - N'incluez aucun contenu autre que JSON.`
                            }
                        ],
                        [`ko`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `당신은 #LANGCODE#를 한국어로 번역하는 고도로 숙련된 번역가입니다.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `다음의 #LANGCODE#문장을 한국어로 번역하세요.
                                #TRANSDATA#
                                지침
                                - 반드시 알파벳, 한글로만 응답하세요.
                                - 가타가나 히라가나, 한자는 절대로 포함하지 마세요.
                                - JSON으로 응답하세요. {"korean":"번역된 한국어 내용"}
                                - 자연스럽고 부드러운 문체와 적절한 단어, 표현 및 어휘를 사용하세요.
                                - 존댓말을 사용하세요.
                                - 원문의 내용은 하나도 빼놓지 말고 모두 그대로 번역하세요.
                                - JSON이외의 다른 어떤 내용도 절대로 포함하지 마세요.`
                            }
                        ],
                        [`ja`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `あなたは#LANGCODE#を日本語に翻訳する非常に熟練した翻訳者です。`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `次の#LANGCODE#の文章を日本語に翻訳してください。
                                #TRANSDATA#
                                ガイドライン
                                - 必ずアルファベット、日本語を構成する文字でのみ対応してください。
                                - JSONで答えてください。 {"japanese":"翻訳された日本語の内容"}
                                - 自然で柔らかい文体と適切な単語、表現、語彙を使用してください。
                                - 尊敬語を使用してください。
                                - 原文の内容は一つも欠かさず、すべてそのまま翻訳してください。
                                - JSON以外の他のコンテンツは絶対に含めないでください。`
                            }
                        ],
                        [`vi`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Bạn là một dịch giả có tay nghề cao trong việc dịch #LANGCODE# sang tiếng việt.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Hãy dịch đoạn văn #LANGCODE# sau đây sang tiếng việt.
                                #TRANSDATA#
                                Hướng dẫn
                                - Vui lòng chỉ trả lời bằng chữ cái latinh và tiếng Việt.
                                - Hãy trả lời bằng JSON. {"japanese":"Nội dung dịch sang tiếng Việt"}
                                - Sử dụng phong cách mềm mại và tự nhiên với các từ ngữ, biểu đạt và từ vựng phù hợp.
                                - Hãy sử dụng ngôn ngữ tôn trọng.
                                - Dịch chính xác từng từ trong bản gốc.
                                - Không được bao gồm bất kỳ nội dung nào khác ngoài JSON.`
                            }
                        ],
                        [`es`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Eres un traductor altamente cualificado para traducir #LANGCODE# al español.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Por favor, traduce la siguiente frase en #LANGCODE# al español.
                                #TRANSDATA#
                                Instrucciones
                                - Responde únicamente usando el alfabeto latino y en español.
                                - No incluyas ningún contenido más que JSON.`
                            }
                        ],
                        [`de`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Sie sind ein hochqualifizierter Übersetzer, der #LANGCODE# ins deutsch übersetzt.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Bitte übersetzen Sie den folgenden #LANGCODE# Satz ins deutsch.
                                #TRANSDATA#
                                Anleitung
                                - Bitte antworten Sie nur mit lateinischen Buchstaben und auf Deutsch.
                                - Schließen Sie keinen anderen Inhalt als JSON ein.`
                            }
                        ],
                        [`zh`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `您是一位非常熟练的翻译员，擅长将#LANGCODE#翻译成中文。`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `请将以下#LANGCODE#句子翻译成中文。
                                #TRANSDATA#
                                指南
                                - 以 JSON 格式提供您的答案。 {"english":"翻译的中文内容"}
                                - 使用自然、温和的写作风格以及适当的单词、表达和词汇。 
                                - 按原样翻译所有内容，不要遗漏原文中的任何内容。 
                                - 不要包含除 JSON 之外的任何内容。
                                `
                            }
                        ],
                        [`ru`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Вы высококвалифицированный переводчик, переводящий #LANGCODE# на русский.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Пожалуйста, переведите следующий #LANGCODE# текст на русский.
                                #TRANSDATA#
                                Руководство
                                - Отвечайте только на латинице и на русском языке.
                                - Включайте только JSON, не добавляйте ничего другого.`
                            }
                        ],
                        [`it`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Sei un traduttore altamente qualificato che traduce #LANGCODE# in italiano.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Per favore, traduci la seguente frase #LANGCODE# in italiano.
                                #TRANSDATA#
                                Istruzioni
                                - Rispondi solo usando l'alfabeto latino e in italiano.
                                - Non includere altro contenuto oltre al JSON.`
                            }
                        ],
                        [`pt`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `Você é um tradutor altamente qualificado para traduzir #LANGCODE# para o português.`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `Por favor, traduza a seguinte frase #LANGCODE# para o português.
                                #TRANSDATA#
                                Instruções
                                - Responda apenas usando o alfabeto latino e em português.
                                - Não inclua nenhum outro conteúdo além do JSON.`
                            }
                        ],
                        [`hi`]: [
                            {
                                [`role`]: `system`,
                                [`content`]: `आप एक अत्यधिक कुशल अनुवादक हैं, जो #LANGCODE# से हिंदी में अनुवाद करते हैं।`
                            },
                            {
                                [`role`]: `user`,
                                [`content`]: `कृपया निम्नलिखित #LANGCODE# वाक्य को हिंदी में अनुवाद करें।
                                #TRANSDATA#
                                निर्देश
                                - कृपया केवल लैटिन अक्षरों और हिंदी में उत्तर दें।
                                - कृपया JSON के अलावा कोई अन्य सामग्री शामिल न करें।`
                            }],
                    };
                    Object.keys(promptTemplate).forEach(langCode => {
                        promptTemplate[langCode].forEach(prompt => prompt['content'] = prompt['content'].split('\n').map(line => line.trim()).join('\n').trim())
                    });
                    const mainlg = async (input) => {
                        if (!input) return;
                        async function languageDetector(input) {
                            let counter = 3;
                            while (counter > 0) {
                                try {
                                    let iso = await aiChat([{
                                        role: 'system', content: [
                                            `Detect language and response in ISO 639-1`,
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
                                        ].join('\n').trim()
                                    }, { role: 'user', content: 'I am happy' }, { role: 'assistant', content: 'en' }, { role: 'user', content: '나는 행복하다' }, { role: 'assistant', content: 'ko' }, { role: 'user', content: input.substring(0, 50) },]);
                                    if (iso?.length !== 2) throw null;
                                    return iso;
                                } catch {
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
                                let sourceCode = oiajfd;
                                if (sourceCode && promptTemplate[options.destination]) {
                                    let eres = JSON.stringify(promptTemplate[options.destination]);
                                    let parsed = JSON.parse(eres.split('#LANGCODE#').join(sourceCode));
                                    let messages = [];
                                    messages.push(parsed[0]);
                                    USE_LLM !== 'ollama' ? null : [hello, whatAreYouDoing, howAreYou].forEach(obj => {
                                        messages.push({ role: 'user', content: obj[source] });
                                        messages.push({ role: 'assistant', content: obj[options.destination] });
                                    })
                                    messages.push(parsed.at(-1))
                                    messages[messages.length - 1].content = messages[messages.length - 1].content.split('\n').map(a => a.trim()).join('\n');
                                    messages[messages.length - 1].content = messages[messages.length - 1].content.split('#TRANSDATA#').join('\n```\n' + input + '\n```\n')
                                    let result = await aiChat(messages);
                                    try {
                                        if (typeof result === 'string') {
                                            result = result.split('\n').join(' ');
                                            result = await nakeFence(result, ['json'])
                                            result = JSON.parse(result);
                                        }
                                    } catch (e) {
                                    }
                                    let sentence =
                                        result[langtable[options.destination]] ||
                                        result[langtable[options.destination].toLowerCase()] ||
                                        result[langtable[options.destination].toUpperCase()];
                                    if (sentence) sentence = sentence.trim();
                                    if (!sentence) throw null;
                                    print(sentence);
                                }
                                break;
                            } catch (e) {
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
                } catch { }
                return;
            }
            async function mainApp(prompt) {
                let debugMode = (await isDebugMode() || (options.debug)) ? {} : null;
                async function leave(mode, data) {
                    if (!debugMode) return;
                    await debugMode.leave(mode, data);
                }
                if (debugMode) {
                    try {
                        const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        const folderName = `_debug_data_${currentDateTime}`;
                        debugMode.logpath = `${pwd}/${folderName}`;
                        await fs.promises.mkdir(debugMode.logpath)
                        debugMode.count = 100000;
                        debugMode.leave = async (mode, data) => {
                            debugMode.count++;
                            let filename = `${getCurrentDateTime()}.json`;
                            let filepath = `${debugMode.logpath}/${debugMode.count}.${filename}`;
                            await fs.promises.writeFile(filepath, JSON.stringify({ mode, data }, undefined, 3));
                        }
                    } catch { debugMode = null; }
                }
                if (!doctorCheck(false)) {
                    doctorCheck(true);
                    return;
                }
                let _promp_t = prompt;
                if (!testmode && _promp_t) {
                    let mission;
                    let history = [];
                    let messages_ = [];
                    function resetHistory() {
                        while (history.length) history.splice(0, 1);
                    }
                    function addMessages(msg) {
                        try {
                            if (messages_.at(-1)?.role === msg.role) throw new Error();
                            if (messages_.length === 0 && msg.role === 'assistant') throw new Error();
                            messages_.push(msg);
                        } catch {
                            return;
                            for (let i = 0; i < 10000; i++) print('DDDDDDDEEEEEEEEEEERRRRRR');
                        }
                    }
                    function addHistory(msg) {
                        try {
                            if (history.at(-1)?.role === msg.role) throw new Error();
                            if (history.length === 0 && msg.role === 'assistant') throw new Error();
                            history.push(msg);
                        } catch {
                            return;
                            for (let i = 0; i < 10000; i++) print('DDDDDDDEEEEEEEEEEERRRRRR');
                        }
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
                            let aofidj = JSON.parse(JSON.stringify(messages_));
                            return aofidj.splice(0, aofidj.length - (remain * 4));
                        }
                        try {
                            if (messages_.length >= limit) {
                                oraStart(`Summarizing the conversation so far`);
                                if (disableOra) oraStop();
                                let aoifj = [];
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
                                let sum = await aiChat(aoifj);
                                oraSucceed(`Summarizing successed like below`);
                                print(chalk.gray(sum + '\n'));
                                summary = sum;
                                while (messages_.length > remain * 4) messages_.splice(0, 1);
                            }
                        } catch (e) {
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
                            break;
                        }
                        let resForOpi = askforce === 'ask_opinion';
                        if (resForOpi) { askforce = ''; }
                        if (!correct_code) {
                            if (result2.raw) {
                                history.forEach(addMessages);
                                addMessages({ role: "assistant", content: result2.raw.trim() });
                                resetHistory();
                                print(chalk.hex('#4b4b66').bold('─'.repeat(measureColumns(0))));
                                print(chalk.hex('#a8a6f3')(chalk.bold(`AI's Response`) + ':'));
                                let resultd = result2.raw.trim();//await nakeFence(result2.raw.trim(), ['plaintext', 'textplain', 'plain', 'text']);
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
                            print(codeDisplay(mission, python_code))
                            print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                            print('Please select an option:')
                            continousNetworkTryCount = 0;
                            let mode = ['Execute Code', 'Re-Generate Code', 'Modify Prompt', 'Quit'];
                            let index = readlineSync.keyInSelect(mode, `Enter your choice`, { cancel: false });
                            if (index === 1) { askforce = ''; continue; }
                            if (index === 2) {
                                print(`Previous prompt: ${chalk.bold(getPrompt())}`);
                                let request = (await ask_prompt_text(`Modify Prompt`)).trim();
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
                            let result = await shell_exec(python_code)
                            print(chalk.hex('#222222').bold('─'.repeat(measureColumns(0))));
                            if (result.code === 0 && !result?.stderr?.trim()) {
                                print(chalk.greenBright.bold(`✔ The code ran successfully`))
                                addMessages(history[0]);
                                addMessages({
                                    role: "assistant",
                                    content: '```\n' + python_code + '\n```'
                                });
                                let out = result.stdout;
                                if (true) {
                                    let split = splitStringIntoTokens(out);
                                    let allowed = getContextWindowSize();
                                    let reqToken = (allowed - (allowed * responseTokenRatio));
                                    let token = Math.floor((reqToken / (messages_.length + history.length)));
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
                                if (false) {
                                    addMessages({
                                        role: "assistant",
                                        content: 'congratulations. Do you need further assistance?'
                                    });
                                    print(chalk.gray.bold('─'.repeat(measureColumns(0))));
                                    let request = (await ask_prompt_text(`Do you need further assistance?`)).trim();
                                    if (!request) break;
                                    defineNewMission(request); //oo
                                }
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
                await loadConfig(true);
                try { await installProcess(); } catch { }
            } else if (options.choosevendor) {
                await disableVariable('USE_LLM');
                await loadConfig(true);
                try { await installProcess(); } catch { }
            } else if (options.choosemodel) {
                const vendor = await getEnvRCVar('USE_LLM')
                if (vendor === 'gemini') await disableVariable('USE_LLM');
                if (vendor === 'ollama') await disableVariable('OLLAMA_MODEL');
                if (vendor === 'openai') await disableVariable('OPENAI_MODEL');
                if (vendor === 'anthropic') await disableVariable('ANTHROPIC_MODEL');
                await loadConfig(true);
                try { await installProcess(); } catch { }
            }
            else if (prompt) {
                await mainApp(prompt);
            } else {
                await showLogo();
                try {
                    await installProcess();
                    print('')
                    let request = await ask_prompt_text(` What can I do for you?.`);
                    await mainApp(request);
                } catch { }
            }
        });
    program.parse(process.argv);
})();
//