/* global process */
/* eslint-disable no-unused-vars, no-async-promise-executor, no-empty */
import { setContinousNetworkTryCount, getContinousNetworkTryCount, aiChat, geminiChat, anthropicChat, groqChat, openaiChat, ollamaChat, turnOnOllamaAndGetModelList, combindMessageHistory, code_generator, getModelName, getContextWindowSize, resultTemplate, axiosPostWrap, ask_prompt_text } from './aiFeatures.js'
import { isCorrectCode, code_validator, makeVEnvCmd } from './codeModifiers.js'
import { printError, isBadStr, addslashes, getCurrentDateTime, is_dir, is_file, isItem, splitStringIntoTokens, measureColumns, isWindows, promptChoices, isElectron, errNotifier } from './commons.js'
import { createVENV, disableAllVariable, disableVariable, getRCPath, readRCDaata, getVarVal, findMissingVars, isKeyInConfig, setVarVal } from './configuration.js'
import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
import { installProcess, realworld_which_python, which, getPythonVenvPath, getActivatePath, getPythonPipPath, venvCandidatePath, checkPythonForTermination } from './envLoaders.js'
import { resetHistory, addMessages, addHistory, summarize, resultAssigning, defineNewMission, assignNewPrompt, } from './promptManager.js'
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print, strout } from './oraManager.js'
import promptTemplate from './translationPromptTemplate.js';
import pyModuleTable from './pyModuleTable.js';
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
import { spawn, exec } from 'child_process';
import os from 'os';
import singleton from './singleton.js'

export async function procPlainText(messages_, history, result2, resForOpi, apimode = false) {
    let askforce;
    if (result2.raw) {
        history.forEach(item => addMessages(messages_, item));
        addMessages(messages_, { role: "assistant", content: result2.raw.trim() });
        resetHistory(history);
        if (!apimode) await strout(chalk.hex('#4b4b66').bold('─'.repeat(measureColumns(0))));
        if (!apimode) await strout(chalk.hex('#a8a6f3')(chalk.bold(`AI's Response`) + ':'));
        let resultd = result2.raw.trim();
        if (!apimode) await strout(chalk.hex('#a8a6f3')(resultd))
        if (!apimode) await strout(chalk.hex('#4b4b66').bold('─'.repeat(measureColumns(0))));
        askforce = 'responsed_code_is_invalid_syntax';
        if (resForOpi) askforce = 'responsed_opinion';
        // askforce = 'responsed_opinion';
    } else {
        if (!apimode) await strout(chalk.red('Nothing responsed'));
        askforce = 'nothing_responsed';
    }
    return { askforce }
}

export async function neededPackageOfCode(python_code, blank = true) {
    const objected = {};
    try {
        const importcode = await generateModuleInstallCode(python_code, true);
        if (!importcode.codename.length) return;
        importcode.codename.forEach(name => objected[name] = blank ? '' : asPyModuleName(name));
    } catch (e) { printError(e); }
    return objected;
}
export function repld(mn) { return mn.split('_').join('-'); }
export function asPyModuleName(mname) {
    return repld(`${pyModuleTable[mname] ? pyModuleTable[mname] : mname}`);
}
export async function generateModuleInstallCode(codefile, code = false) {
    if (code) {
        const venv_path = await getPythonVenvPath();
        const pathd = `${venv_path}` + '/._module_requirements.py';
        await fsPromises.writeFile(pathd, codefile);
        codefile = pathd;
    }
    let adf = await moduleValidator(codefile);
    let imcode = [];
    imcode.push('try:')
    imcode.push('   import subprocess')
    adf.forEach(mname => imcode.push(`   subprocess.run(['pip', 'install', '${asPyModuleName(mname)}'])`));
    imcode.push('except Exception as e:\n   pass')
    const packages = adf.map(mname => asPyModuleName(mname));
    return { count: adf.length, code: imcode.join('\n'), packages, codename: adf };
}
export async function moduleValidator(code_file_path) {
    const python_code = `if True:
    import os
    import ast
    import importlib.util
    import subprocess

    def readFile(file_path):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"file not found: {file_path}")

        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            return content
        except IOError as e:
            raise IOError(f"An error occurred while reading the file: {file_path}{e}")
    
    def extract_imports_from_ast(python_code):
        tree = ast.parse(python_code)
        imports = set()
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
        
        return sorted(imports)
    
    def check_modules_existence(modules):
        non_existent_modules = []
        for module in modules:
            if importlib.util.find_spec(module) is None:
                non_existent_modules.append(module)
        return non_existent_modules
    
    def get_package_name_from_pypi(module_name):
        return module_name
    
    def generate_install_commands(non_existent_modules):
        commands = []
        for module in non_existent_modules:
            # Check package name in PyPI
            package_name = get_package_name_from_pypi(module)
            if package_name is None:
                # By default, use the module name as the package name
                package_name = module
            commands.append(f'pip install {package_name}')
        return commands
    
    python_code = readFile("${code_file_path.split('\\').join('/')}")
    
    modules = extract_imports_from_ast(python_code)
    
    non_existent_modules = check_modules_existence(modules)
    print(json.dumps(non_existent_modules))
    `;
    let resutl = await shell_exec(python_code, false, true, true);
    try {
        return JSON.parse(resutl.stdout);
    } catch (e) { printError(e); }
    return [];
}
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
export async function shell_exec(python_code, only_save = false, silent = false, orasilent = false) {
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
        if (!orasilent) await oraStart(`Executing code`);
        const python_interpreter_ = await getPythonPipPath();
        if (!python_interpreter_) throw new Error('Python Interpreter Not Found');
        const pythonCmd = `'${python_interpreter_}' -u '${scriptPath}'`;
        const arg = await makeVEnvCmd(pythonCmd, true);
        const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
        if (singleton?.options?.debug === 'shellexe') {
            await singleton.debug(arg, 'shellexe');
            await strout(chalk.blueBright(python_code));
        }
        // ㅣㄷㅅ
        let windowsHide;
        let cwd;
        if (isElectron()) {
            cwd = `${venv_path}/working/`;
            try {
                if (!await is_dir(cwd)) {
                    await fsPromises.mkdir(cwd)
                }
            } catch { }
        }
        if (isWindows() && isElectron()) windowsHide = true

        //inherit
        //if (isWindows() && isElectron())
        const child = spawn(...arg, { windowsHide, env, stdio: (isWindows() && isElectron()) ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'], cwd });
        attatchWatcher(child, resolve, python_code, silent);
    });
}
export function attatchWatcher(child, resolve, python_code, silent = false) {
    const stdout = [];
    const stderr = [];
    (isWindows() && isElectron()) && child.stdin.end();
    child.stdout.on('data', function (data) {
        oraStop();
        stdout.push(data);
        if (!silent) process.stdout.write(chalk.greenBright(data));
    });
    child.stderr.on('data', function (data) {
        oraStop();
        if (data.indexOf(`warnings.warn("`) > -1 && data.indexOf(`Warning: `) > -1) return;
        if (data.indexOf(`WARNING: `) > -1 && data.indexOf(`Secure coding is automatically enabled for restorable state`) > -1) return;
        if (data.indexOf(`AdjustCapsLockLEDForKeyTransitionHandling`) > -1 && data.indexOf(`Secure coding is automatically enabled for restorable state`) > -1) return;
        if (data.indexOf(`NotOpenSSLWarning`) > -1 && data.indexOf(`warnings.warn(`) > -1) return;
        stderr.push(data);
        if (!silent) process.stderr.write(chalk.red(data));
    });
    child.on('close', function (code) {
        oraStop();
        resolve({ code, stdout: stdout.join(''), stderr: stderr.join(''), python_code });
    });
}
export async function execInVenv(cmd, opt, callback) {
    // exec(cmd, (error, stdout, stderr) => {
    //     let code = 0;
    //     if (error) code = error.code
    //     callback(code, stdout, stderr);
    // });
}
export async function shelljs_exec(cmd, opt, callback) {
    exec(cmd, (error, stdout, stderr) => {
        let code = 0;
        if (error) code = error.code
        callback(code, stdout, stderr);
    });
}
export async function execPlain(cmd) {
    return new Promise(resolve => {
        shelljs_exec(cmd, { silent: true, }, (code, stdout, stderr) => {
            resolve({ code, stdout, stderr });
        })
    })
}

let __powershellPath;
export async function getPowerShellPath() {
    try {
        if (!isWindows()) return;
        if (__powershellPath) return __powershellPath;
        let testCommands = [
            '(Get-Command powershell).Source',
            'where.exe powershell',
            'C:\\Windows\\System32\\where.exe powershell',
        ];
        let powershellPath;
        for (let i = 0; i < testCommands.length; i++) {
            let result = await execPlain(testCommands[i]);
            if (result.code) continue;
            let _powershellPath = result.stdout.trim().split('\n')[0].trim();
            if (!await is_file(_powershellPath)) continue;
            powershellPath = _powershellPath;
        }
        let hardpath = `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
        if (!powershellPath && await is_file(hardpath)) powershellPath = hardpath;
        if (isBadStr(powershellPath)) powershellPath = null;
        if (!powershellPath) {
            if (isElectron()) await errNotifier(`Window PowerShell not found`);
            if (!isElectron()) await strout(chalk.red(`Window PowerShell not found`));
            process.exit(1);
            return;
        }
        __powershellPath = powershellPath;
        return powershellPath;
    } catch (e) { printError(e); }
}

export async function execAdv(cmd, mode = true, opt = {}) {
    if (isWindows()) {
        const powershell = await getPowerShellPath();
        return new Promise(resolve => {
            shelljs_exec(mode ? `"${powershell}" -Command "${cmd}"` : cmd, { silent: true, ...opt }, (code, stdout, stderr) => {
                resolve({ code, stdout, stderr });
            })
        })
    } else {
        return await new Promise(function (resolve) {
            shelljs_exec(cmd, { silent: true, ...opt }, function (code, stdout, stderr) {
                resolve({ code, stdout, stderr });
            });
        });
    }
};
