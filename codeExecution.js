/* global process */
/* eslint-disable no-unused-vars, no-async-promise-executor */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices } from './commons.js'
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


export async function makePreprocessingCode() {
    const venv_path = await getPythonVenvPath();
    if (!venv_path) return;
    const importsScriptPath = `${venv_path}/${preprocessing}.py`;
    if (await isItem(importsScriptPath)) return;
    const warninglist = ["DeprecationWarning", "UserWarning", "FutureWarning", "ImportWarning", "RuntimeWarning", "SyntaxWarning", "PendingDeprecationWarning", "ResourceWarning", "InsecureRequestWarning", "InsecurePlatformWarning"];
    const modulelist = ["abc", "argparse", "array", "ast", "asyncio", "atexit", "base64", "bdb", "binascii", "bisect", "builtins", "bz2", "calendar", "cmath", "cmd", "code", "codecs", "codeop", "collections", "colorsys", "compileall", "concurrent", "configparser", "contextlib", "contextvars", "copy", "copyreg", "cProfile", "csv", "ctypes", "dataclasses", "datetime", "dbm", "decimal", "difflib", "dis", "doctest", "email", "encodings", "ensurepip", "enum", "errno", "faulthandler", "filecmp", "fileinput", "fnmatch", "fractions", "ftplib", "functools", "gc", "getopt", "getpass", "gettext", "glob", "graphlib", "gzip", "hashlib", "heapq", "hmac", "html", "http", "imaplib", "importlib", "inspect", "io", "ipaddress", "itertools", "json", "keyword", "linecache", "locale", "logging", "lzma", "mailbox", "mailcap", "marshal", "math", "mimetypes", "mmap", "modulefinder", "multiprocessing", "netrc", "nntplib", "numbers", "operator", "optparse", "os", "pathlib", "pdb", "pickle", "pickletools", "pkgutil", "platform", "plistlib", "poplib", "posixpath", "pprint", "profile", "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc", "queue", "quopri", "random", "re", "reprlib", "rlcompleter", "runpy", "sched", "secrets", "select", "selectors", "shelve", "shlex", "shutil", "signal", "site", "smtpd", "smtplib", "sndhdr", "socket", "socketserver", "sqlite3", "ssl", "stat", "statistics", "string", "stringprep", "struct", "subprocess", "sunau", "symtable", "sys", "sysconfig", "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile", "test", "textwrap", "threading", "time", "timeit", "token", "tokenize", "trace", "traceback", "tracemalloc", "tty", "turtle", "types", "typing", "unicodedata", "unittest", "urllib", "uu", "uuid", "venv", "warnings", "wave", "weakref", "webbrowser", "wsgiref", "xdrlib", "xml", "xmlrpc", "zipapp", "zipfile", "zipimport", "zlib", "zoneinfo", "numpy", "pandas", "matplotlib", "seaborn", "scipy", "tensorflow", "keras", "torch", "statsmodels", "xgboost", "lightgbm", "gensim", "nltk", "pillow", "requests", "beautifulsoup4", "mahotas", "simplecv", "pycairo", "pyglet", "openpyxl", "xlrd", "xlwt", "pyexcel", "PyPDF2", "reportlab", "moviepy", "vidgear", "imutils", "pytube", "pafy"];
    await fsPromises.writeFile(importsScriptPath, [
        `# Please understand that the code is quite long. AI often omits necessary modules when executing code. To address this, I have prepared code at the top that imports commonly used module packages. The main logic of the code created by the AI can be found at the bottom of this code.`,
        `# ${'-'.repeat(80)}`,
        `${warninglist.map(name => `try:\n${threespaces}import warnings\n${threespaces}warnings.filterwarnings("ignore", category=${name})\nexcept Exception as e:\n${threespaces}pass`).join('\n')}`,
        `${modulelist.map(name => `try:\n${threespaces}import ${name}\nexcept Exception as e:\n${threespaces}pass`).join('\n')}`,
        `# ${'-'.repeat(80)}`,
    ].join('\n'));
}
export async function shell_exec(python_code, only_save = false) {
    const venv_path = await getPythonVenvPath();
    if (!venv_path) return;
    return new Promise(async resolve => {
        await makePreprocessingCode();
        const scriptPath = `${venv_path}/${only_save ? getCurrentDateTime() : '._code'}.py`;
        await fsPromises.writeFile(scriptPath, [
            `try:\n${threespaces}from ${preprocessing} import *\nexcept Exception:\n${threespaces}pass`,
            `# ${'-'.repeat(80)}`,
            `${python_code}`
        ].join('\n'));
        if (only_save) return resolve(scriptPath);
        oraStart(`Executing code`);
        const python_interpreter_ = await getPythonPipPath();
        if (!python_interpreter_) throw new Error('Python Interpreter Not Found');
        const pythonCmd = `'${python_interpreter_}' -u '${scriptPath}'`;
        const child = shelljs.exec(await makeVEnvCmd(pythonCmd), { async: true, silent: true });
        attatchWatcher(child, resolve, python_code);
    });
}
export async function execInVenv(command, app) {
    await createVENV();
    return new Promise(async (resolve, reject) => {
        oraStart(`Executing code`);
        const python_interpreter_ = await getPythonPipPath(app.toLowerCase());
        if (!python_interpreter_) { oraFail(chalk.red('Python Interpreter Not Found')); reject(new Error('Python Interpreter Not Found')); return; }
        const pythonCmd = `'${python_interpreter_}' ${addslashes(command)}`;
        const child = shelljs.exec(await makeVEnvCmd(pythonCmd), { async: true, silent: true });
        attatchWatcher(child, resolve);
    });
}
export function attatchWatcher(child, resolve, python_code) {
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', function (data) {
        oraStop();
        stdout.push(data);
        process.stdout.write(chalk.greenBright(data));
    });
    child.stderr.on('data', function (data) {
        oraStop();
        if (data.indexOf(`warnings.warn("`) > -1 && data.indexOf(`Warning: `) > -1) return;
        stderr.push(data);
        process.stderr.write(chalk.red(data));
    });
    child.on('close', function (code) {
        oraStop();
        resolve({ code, stdout: stdout.join(''), stderr: stderr.join(''), python_code });
    });
}
export async function execAdv(cmd, mode = true, opt = {}) {
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
