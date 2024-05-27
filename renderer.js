/* global CodeMirror */
/* eslint-disable no-unused-vars, no-unreachable, no-constant-condition */
// import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'
// const { ipcRenderer } = require('electron');

// ipcRenderer.on('init', (event, data) => {
//     console.log(data.message); // "Hello from Main Process!" 출력
// });


window.addEventListener('load', async () => {
    // console.log
    // console.log(threeticks);
    let currentMode = 'waiting';
    let currdata;
    let currentInputViews;
    let counter = 0;
    let queue = {};
    let abortedTasks = {};
    function getUnique() {
        counter++;
        return `${counter}.${new Date().getTime()}.${Math.random()}`;
    }
    async function abortAllTask() {
        await Promise.all(Object.keys(queue).map(abortTask));
    }
    async function abortTask(taskId) {
        let _resolve;
        let promise = new Promise(resolve => _resolve = resolve);
        abortedTasks[taskId] = _resolve;
        window.electronAPI.send('aborting', { taskId: taskId });
        await promise;
    }


    let reqAPIQueue = [];
    async function reqAPI(mode, arg, indicator = false) {
        reqAPIQueue.push({ mode, arg });
        while (true) {
            if (reqAPIQueue[0].mode === mode && reqAPIQueue[0].arg === arg) {
                break;
            } else {
                await new Promise(resolve => setTimeout(resolve));
            }
        }
        if (indicator) showLoading();
        if ('savestate' !== mode && 'getstatelist' !== mode) {
            if (false) console.log(mode, JSON.stringify(arg, undefined, 3));
        }
        let taskId = getUnique();
        let _resolve;
        let _reject;
        let promise = new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });
        queue[taskId] = { _resolve, _reject };
        window.electronAPI.send('request', { mode, taskId, arg });

        let dt;
        try { dt = await promise; } catch { }
        if (indicator) removeLoading();
        reqAPIQueue.shift();
        return dt;
    }
    let oneLineMessageIndicator;
    function showIndicator(text) {
        oneLineMessageIndicator?.remove();
        if (!text) return;
        if (typeof text === 'string') {
            const element = document.createElement('div');
            element.innerText = text;
            element.style.color = 'rgb(255,255,255,0.6)';
            text = element;
        }
        text.style.padding = '10px';
        text.style.textAlign = 'center';
        text.style.fontFamily = 'monospace';
        oneLineMessageIndicator = createConversationLine({ text: text, type: 2, parent: chatMessages });
        scrollSmoothToBottom();
    }
    window.electronAPI.receive('requesting', (arg) => {
        let resValue = '';
        let reqValue = arg.arg;
        if (arg.mode === 'namee') {
            resValue = reqValue;
        }
        if (arg.mode === 'letnotify') {
            oneLineMessageIndicator = null;
        }
        if (arg.mode === 'disnotify') {
            showIndicator(null)
        }
        if (arg.mode === 'errnotify') {
            const err = document.createElement('div');
            err.innerText = reqValue;
            err.style.color = 'rgb(239 82 82)';
            simpleIndi(err);
            resValue = reqValue;
        }
        if (arg.mode === 'outnotify') {
            const err = document.createElement('div');
            err.innerText = reqValue;
            err.style.color = '#5fc868';
            simpleIndi(err);
            resValue = reqValue;
        }
        window.electronAPI.send('resolving', { taskId: arg.taskId, arg: resValue });
    });
    function simpleIndi(err) {
        let loadings = !!loading;
        if (loadings) removeLoading();
        showIndicator(err)
        if (loadings) showLoading();
        else scrollSmoothToBottom();
    }
    window.electronAPI.receive('aborting_queued', (arg) => {
        let taskId = arg.taskId;
        if (abortedTasks[taskId]) abortedTasks[taskId]();
        queue[taskId]._reject();
        delete abortedTasks[taskId];
        delete queue[taskId];
    });
    window.electronAPI.receive('response', (arg) => {
        let fnd = queue[arg.taskId];
        if (!fnd) return; // because of abortion by renderer
        delete queue[arg.taskId];
        fnd._resolve(arg.arg);
    });
    //----------------------------------------------------
    // let resultAssignnewprompt = await reqAPI('assignnewprompt', { request: text, history: history_, promptSession, python_code: currdata.python_code });

    const versioninfo = document.querySelector('#versioninfo');
    const poweredby = document.querySelector('#poweredby');


    const inputarea = document.querySelector('.input-container div');
    const promptSendingButton = document.querySelector('.input-container button');
    const chatMessages = document.querySelector('#chat-messages');
    const talklist = document.querySelector('#talklist');
    const majore = document.querySelector('#majore');
    function scrollSmoothToBottom(smooth = true) {
        chatMessages.scroll({
            top: chatMessages.scrollHeight * 1,
            behavior: smooth ? 'smooth' : undefined
        });
    }
    await aiIndicator();

    let loading = null;
    function showLoading() {
        removeLoading();
        let adf = `<span class="loader"></span>`;
        let oiadjsf = document.createElement('div');
        oiadjsf.style.textAlign = 'center';
        oiadjsf.style.padding = '15px';
        oiadjsf.innerHTML = adf;
        chatMessages.appendChild(oiadjsf);
        scrollSmoothToBottom();
        loading = oiadjsf;
    }
    function removeLoading() {
        loading?.remove();
        loading = null;
    }
    promptSendingButton.addEventListener('click', e => {
        sendingPrompt(chatEditor, chatEditor.getValue());
        chatEditor.focus();
    })

    let chatEditor = makeEditor(inputarea, '', "text", !true, sendingPrompt, true);
    // chatEditor.setValue(`raise error don't catch just let it raise error`);
    let cline = [];
    window.cline = cline;
    let pageMode = 'config';
    async function sendingPrompt(cm, text) {
        if (loading) return;
        if (!text.trim()) return;
        // alert(pageMode);
        if (pageMode !== 'talk') await startNewTalk();
        if (text.trim().startsWith('///')) {
            let commandLine = text.trim();
            while (commandLine.indexOf('  ') > -1) commandLine = commandLine.split('  ').join(' ');
            let args = commandLine.substring(1, Infinity).split(' ');
            if (args[0] === 'reset_configuration_value') {
                if (args[1]) {
                    if (args[1] === 'remove_everything_even_history') {
                        await reqAPI('resetconfig');
                        await prepareVENV();
                        await config();
                    } else {
                        await reqAPI('disableVariable', { value: args[1] });
                        await config();
                    }
                }
            }
            cm.setValue('');
            return;
        }
        showIndicator(null);
        cm.setValue('');
        removeTools();
        if (true) {
            const line = createConversationLine({ text: text, type: 1, parent: chatMessages })
            cline.push(line);
            scrollSmoothToBottom();
            if (currentMode === 'waiting') {
                try {
                    await requestAI(text);
                } catch (e) {
                    if (e === 10001) {
                        console.log('렌더러에 의한 중단')
                        /* 렌더러에 의한 중단*/
                    }
                }
            }
            else if (currentMode === 'choosing') {
                currentInputViews.remove();
                let resultAssignnewprompt = await reqAPI('assignnewprompt', { request: text, history: history_, promptSession, python_code: currdata.python_code });
                promptSession = resultAssignnewprompt.promptSession
                history_ = resultAssignnewprompt.history
                setAskForce(resultAssignnewprompt.askforce)
                await saveState();
                try {
                    await requestAI(text);
                } catch (e) {
                    console.log('abort', e);
                    if (e === 10001) {
                        console.log('렌더러에 의한 중단');
                        /* 렌더러에 의한 중단*/
                    }
                }
            } else if (currentMode === 'run_code_causes_error') {
                currentInputViews.remove();
                setAskForce(currentMode)
                let resultErrorprompthandle = await reqAPI('errorprompthandle', { request: text, history: history_, askforce: getAskForce(), promptSession });
                history_ = resultErrorprompthandle.history
                setAskForce('');
                promptSession = resultErrorprompthandle.promptSession
                await saveState();
                try {
                    await requestAI(text);
                } catch (e) {
                    console.log('abort', e);
                    if (e === 10001) {
                        console.log('렌더러에 의한 중단');
                        /* 렌더러에 의한 중단*/
                    }
                }
            }
        }
    }

    let first = true;
    let askforce = '';
    let history_ = [];
    let messages_ = [];
    let summary = '';
    let promptSession;
    async function getmodelnamed() {
        const vendorName = await reqAPI('getconfig', { key: 'USE_LLM' });
        let modelName = '';
        if (vendorName === 'openai') modelName = await reqAPI('getconfig', { key: 'OPENAI_MODEL' });//kn = ('OPENAI_MODEL');
        if (vendorName === 'groq') modelName = await reqAPI('getconfig', { key: 'GROQ_MODEL' });//kn = ('GROQ_MODEL');
        if (vendorName === 'gemini') modelName = 'gemini-pro';
        if (vendorName === 'anthropic') modelName = await reqAPI('getconfig', { key: 'ANTHROPIC_MODEL' });//kn = ('ANTHROPIC_MODEL');
        if (vendorName === 'ollama') modelName = await reqAPI('getconfig', { key: 'OLLAMA_MODEL' });//kn = ('OLLAMA_MODEL');
        return modelName;
    }
    async function aiIndicator(load = false) {
        poweredby.innerHTML = [
            `<div style="text-align:center;padding:5px;">`,
            `<span style="opacity:0.5;font-size:0.8em;opacity:0;">Powered by </span>`,
            `<span style="font-size:0.8em;opacity:0;">checking</span>`,
            `</div>`,
        ].join('');
        if (!load) return;
        // return;
        const vendorName = await reqAPI('getconfig', { key: 'USE_LLM' });
        let modelName = '';
        if (vendorName === 'openai') modelName = await reqAPI('getconfig', { key: 'OPENAI_MODEL' });//kn = ('OPENAI_MODEL');
        if (vendorName === 'groq') modelName = await reqAPI('getconfig', { key: 'GROQ_MODEL' });//kn = ('GROQ_MODEL');
        if (vendorName === 'gemini') modelName = 'gemini-pro';
        if (vendorName === 'anthropic') modelName = await reqAPI('getconfig', { key: 'ANTHROPIC_MODEL' });//kn = ('ANTHROPIC_MODEL');
        if (vendorName === 'ollama') modelName = await reqAPI('getconfig', { key: 'OLLAMA_MODEL' });//kn = ('OLLAMA_MODEL');
        poweredby.style.cursor = 'pointer';
        poweredby.innerHTML = [
            `<div style="text-align:center;padding:5px;">`,
            `<span style="opacity:0.5;font-size:0.8em;">Powered by </span>`,
            `<span style="font-size:0.8em;">${modelName}</span>`,
            `</div>`,
        ].join('');
        [...poweredby.children].forEach(e => e.addEventListener('click', async e => {
            await configPage();
            // await resetAllModel();
            // await resetVendor();
            // await config();
        }));
    }
    function seedata() {

        // console.log('--------------------------');
        // console.log('메시지');
        // console.log(JSON.stringify(messages_, undefined, 3));
        // console.log('히스토리');
        // console.log(JSON.stringify(history_, undefined, 3));
        // console.log('--------------------------');
    }
    function makeEditor(codebox, code, mode, readOnly = false, nonchat = null, nogutter = false) {
        const codeArea = document.createElement('textarea');
        codebox.appendChild(codeArea);
        codeArea.value = code;
        const editor = CodeMirror.fromTextArea(codeArea, {
            mode,
            theme: "monokai",
            lineNumbers: !nogutter,
            lineWrapping: true,
            extraKeys: !nonchat ? {
                "Ctrl-Space": "autocomplete",
            } : {
                "Ctrl-Space": "autocomplete",
                "Enter": function (cm) {
                    nonchat(cm, cm.getValue());
                },
                "Shift-Enter": "newlineAndIndentContinueMarkdownList"
            },
            readOnly: readOnly
        });
        return editor;
    }

    function setEditorFontColor(editor, color) {
        [...editor.display.lineDiv.querySelectorAll('*')].forEach(el => {
            el.style.color = color;
        });
    }

    async function requestAI(prompt) {
        let resultAireq = await reqAPI('aireq', { prompt, askforce: getAskForce(), summary, messages_, history: history_, first }, true);
        await resultProcedure(resultAireq)
        await saveState();
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
        return `${year}${month}${day}_${hours}${minutes}${seconds}_${milliseconds}`;
    }
    let sessionDate = getCurrentDateTime();
    async function saveState() {
        const conversationLine = cline.map(line => {
            let data = line[Symbol.for('state')]();
            return { askforce: data.askforce, type: data.type, values: data.cm.map(cm => cm?.getValue() || '') };
        })
        // let sessionDate = getCurrentDateTime();
        let state = {
            environment: {
                sessionDate,
                promptSession,
                history: history_,
                messages: messages_,
                askforce: getAskForce(),
                summary,
                first
            },
            conversationLine
        }
        await reqAPI('savestate', { sessionDate, state }) && await refreshList();
    }
    function makeButton(name) {
        const execode = document.createElement('button');
        execode.innerText = name;
        execode.style.color = 'rgba(255,255,255,0.7)';
        execode.style.backgroundColor = 'transparent';
        execode.style.border = '0px';
        execode.style.padding = '10px';
        execode.style.cursor = 'pointer';
        return execode;
    }


    async function resultProcedure(procResult) {
        if (!procResult) throw 10000;
        if (procResult.abortedByRenderer) throw 10001;
        if (procResult.error) throw 10002;
        if (procResult.abortion) throw 10003;
        first = false;
        currdata = procResult;
        promptSession = procResult.promptSession;
        summary = procResult.summary;
        history_ = procResult.history;
        messages_ = procResult.messages_;
        setAskForce(procResult.askforce)
        await saveState();
        seedata()
        if (procResult.correct_code) {
            if (false) procResult.python_code = [`# GENERATED CODE`,
                `# This code is proposed for mission execution`,
                // `# This code will be run in ${process.cwd()}`,
                // `# This code file is actually located at ${code_saved_path.split('/').join(isWindows() ? '\\' : '/')} and you can review the code by opening this file.`,
                `# Additional code included at the top of this file ensures smooth operation. For a more detailed review, it is recommended to open the actual file.`,
                `# Please review the code carefully as it may cause unintended system behavior`,
                ``,
                `${procResult.python_code}`,
            ].join('\n');

            const codebox = createConversationLine({ text: procResult.python_code, type: 5, parent: chatMessages })
            cline.push(codebox);
            scrollSmoothToBottom();
            currentMode = 'choosing';
            currentInputViews = codebox[Symbol.for('choosebox')];
        } else {
            currentMode = 'waiting';
            let explain = createConversationLine({ text: procResult.raw, type: 4, parent: chatMessages });
            cline.push(explain);
            scrollSmoothToBottom();

        }

    }
    function removeTools() {
        const chooseboxSymbol = Symbol.for('choosebox');
        cline.forEach(item => item[chooseboxSymbol]?.remove());
    }
    function createConversationLine({ text, type, parent, askforce, restore, last }) {
        let conversationLine;
        if (type === 1) {
            // 내가 말한 메시지
            conversationLine = document.createElement('div');
            conversationLine.classList.add('mine')
        }
        else {
            // 버튼 박스
            conversationLine = document.createElement('div');
            if (type !== 2) conversationLine.classList.add('other')
        }
        if (type !== 2) conversationLine.classList.add('message')



        // if (type === 4 || type === 1 || type === 3 || type === 5 || type === 6 || type === 2) { } else {
        //     if (text) {
        //         if (typeof text === 'string') {
        //             conversationLine.innerText = text;
        //         } else {
        //             conversationLine.appendChild(text);
        //         }
        //     }
        // }
        if (type === 1) {
            parent.appendChild(conversationLine);
            const cm = makeEditor(conversationLine, text, "text", true, null, true);
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [cm] };
            };
        }
        if (type === 2) {
            parent.appendChild(conversationLine);
            if (text) {
                if (typeof text === 'string') {
                    conversationLine.innerText = text;
                } else {
                    conversationLine.appendChild(text);
                }
            }
            // const cm = makeEditor(conversationLine, text, "text", true, null, true);
            // conversationLine[Symbol.for('state')] = () => {
            //     return { type, cm: [cm] };
            // };
        }
        if (type === 3) {
            parent.appendChild(conversationLine);
            let { stderr, stdout } = JSON.parse(text);
            let editors = {};
            if (stdout) {
                let editor = makeEditor(conversationLine, stdout, "text", true);
                scrollSmoothToBottom();
                setEditorFontColor(editor, '#5fc868');
                editors.stdout = editor;
            }
            if (stderr) {
                let editor = makeEditor(conversationLine, stderr, "text", true);
                setEditorFontColor(editor, 'rgb(239 82 82)');
                scrollSmoothToBottom();
                editors.stderr = editor;
            }
            if (!stderr && !stdout) {
                let editor = makeEditor(conversationLine, '(The code ran quietly)', "text", true);
                scrollSmoothToBottom();
                setEditorFontColor(editor, '#5fc868');
                editors.stdout = editor;
            }
            const toolBtn = document.createElement('div');
            toolBtn.style.display = 'block';
            toolBtn.style.width = '100%'
            toolBtn.style.textAlign = 'right'
            conversationLine.appendChild(toolBtn);
            conversationLine[Symbol.for('choosebox')] = toolBtn;
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [editors.stdout, editors.stderr], askforce };
            };
            if (!restore || last) {
                if (askforce === "run_code_causes_error") {
                    currentMode = askforce;
                    const execode = makeButton('Create of a revised code');
                    execode.addEventListener('click', async e => {
                        chatEditor.focus();
                        toolBtn.remove();
                        setAskForce('');
                        await saveState();
                        try {
                            await requestAI(promptSession.prompt);
                        } catch (e) {
                            console.log('abort', e);
                            if (e === 10001) {
                                console.log('렌더러에 의한 중단');
                                /* 렌더러에 의한 중단*/
                            }
                        }
                        return;
                    });
                    toolBtn.appendChild(execode);
                    currentInputViews = toolBtn;
                }
            }
        }
        if (type === 4) {
            parent.appendChild(conversationLine);
            const cm = makeEditor(conversationLine, text, "text", true);
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [cm] };
            };
        }
        if (type === 6) {
            parent.appendChild(conversationLine);
            // let resolver;
            let modulelistOb = JSON.parse(text);
            conversationLine.innerText = '';
            let chosenList = {};


            const title = document.createElement('div');
            // title.style.color = 'rgba(255,255,255,0.4)';
            title.style.display = 'inline-block'
            title.innerText = `Missing Module Installataion`;
            title.style.marginBottom = '5px';
            title.style.fontFamily = 'monospace';
            title.style.paddingTop = '10px';
            title.style.paddingLeft = '10px';
            title.style.paddingRight = '10px';
            conversationLine.appendChild(title);


            //font-family:monospace;opacity:0.7;font-size:0.85em
            const message = document.createElement('div');
            message.style.opacity = '0.7';
            message.style.display = 'inline-block'
            message.innerText = `Here are the Python module packages that are required to execute the code but are currently missing from the virtual environment. Please select the packages you wish to install and proceed with the installation. Note that there might be mistakes in the package names due to AI errors, so please be cautious.`;
            message.style.fontSize = '0.85em';
            message.style.fontFamily = 'monospace';
            message.style.paddingLeft = '10px';
            message.style.paddingRight = '10px';
            message.style.paddingBottom = '5px';
            conversationLine.appendChild(message);

            const toolBtnd = document.createElement('button');
            Object.keys(modulelistOb).forEach(name => {

                let df = document.createElement('div');
                df.style.display = 'inline-block';
                df.style.padding = '5px';
                df.style.margin = '5px';
                df.style.fontFamily = 'monospace';
                df.style.cursor = 'pointer';
                df.innerText = modulelistOb[name];
                let toggle = false;
                df.addEventListener('click', e => {
                    chatEditor.focus();
                    toggle = !toggle;
                    if (toggle) {
                        df.style.borderBottom = '3px solid yellow';
                        df.style.color = 'rgba(255,255,255,0.8)';
                        chosenList[name] = true;
                    } else {
                        df.style.borderBottom = '3px solid rgba(0,0,0,0)';
                        df.style.color = 'rgba(255,255,255,0.3)';
                        delete chosenList[name]
                    }
                    toolBtnd.innerText = Object.keys(chosenList).length === 0 ? 'Skip' : 'Install';
                })
                conversationLine.appendChild(df);
                df.click();
            });
            const toolBtn = document.createElement('div');
            toolBtn.style.display = 'block';
            toolBtn.style.width = '100%'
            toolBtn.style.textAlign = 'right'
            toolBtn.style.padding = '0px'
            toolBtn.innerText = '';
            conversationLine.appendChild(toolBtn);



            toolBtnd.style.color = 'rgba(255,255,255,0.7';
            toolBtnd.style.display = 'inline-block'
            toolBtnd.style.cursor = 'pointer'
            toolBtnd.style.border = '0px'
            toolBtnd.style.padding = '10px'
            toolBtnd.style.margin = '10px'
            toolBtnd.style.backgroundColor = 'transparent'
            toolBtnd.innerText = 'Install';
            toolBtn.appendChild(toolBtnd);
            toolBtnd.addEventListener('click', e => {
                toolBtn.remove();
                chatEditor.focus();
                resolver(Object.keys(chosenList));
            })
            scrollSmoothToBottom();
            let resolver;
            let promise = new Promise(resolve => {
                resolver = resolve;
            });
            conversationLine[Symbol.for('choosebox')] = toolBtn;
            return promise;
            // return new Promise(resolve => {
            //     // resolver = resolve;
            // })

            // const cm = makeEditor(conversationLine, text, "text", true);
            // conversationLine[Symbol.for('state')] = () => {
            //     return { type, cm: [cm] };
            // };
        }
        if (type === 5) {
            parent.appendChild(conversationLine);

            const notifymessage = document.createElement('div');
            notifymessage.style.display = 'block';
            notifymessage.style.width = '100%'
            notifymessage.style.textAlign = 'right'
            notifymessage.style.padding = '20px'
            let msgd = [
                `<div style="text-align:left;font-family:monospace;font-size:1em;padding-bottom:4px">GENERATED CODE</div>`,
                `<div style="text-align:left;font-family:monospace;opacity:0.7;font-size:0.85em">This code is proposed for mission execution</div>`,
                `<div style="text-align:left;font-family:monospace;opacity:0.7;font-size:0.85em">Additional code included at the top of this file ensures smooth operation. For a more detailed review, it is recommended to open the actual file.</div>`,
                `<div style="text-align:left;font-family:monospace;opacity:0.7;font-size:0.85em">Please review the code carefully as it may cause unintended system behavior</div>`,
                `<div style="text-align:left;font-family:monospace;opacity:0.7;font-size:0.85em">You can modify this code before execute</div>`,
            ].join('');
            notifymessage.innerHTML = msgd;


            const choosebox = document.createElement('div');
            choosebox.style.display = 'block';
            choosebox.style.width = '100%'
            choosebox.style.textAlign = 'right'
            conversationLine[Symbol.for('choosebox')] = choosebox;


            // (!restore || last)
            // (restore&&!last)


            conversationLine.appendChild(notifymessage);
            const cm = makeEditor(conversationLine, text, "python", (restore && !last))
            conversationLine.appendChild(choosebox);
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [cm] };
            };

            if (!restore || last) {
                const execode = makeButton('Execute Code');
                choosebox.appendChild(execode);
                execode.addEventListener('click', async e => {
                    chatEditor.focus();
                    choosebox.remove();
                    let codeBody = (cm.getValue()?.split('\n'))?.filter(line => line?.trim()[0] !== '#').join('\n')
                    let neededPackageListOfObject = await reqAPI('neededpackages', { python_code: codeBody });
                    if (neededPackageListOfObject) {
                        let packageList = Object.keys(neededPackageListOfObject);

                        const chosen = await createConversationLine({ text: JSON.stringify(neededPackageListOfObject), type: 6, askforce: getAskForce(), parent: parent });
                        console.log(chosen);
                        // cline.push(resultContainer);

                        if (true) {
                            for (let i = 0; i < chosen.length; i++) {
                                let installResult = await reqAPI('installpackage', { name: chosen[i] });
                                console.log('install', chosen[i], installResult)
                            }
                        }
                    }
                    let result = await reqAPI('shell_exec', { "code": codeBody, "b64": false }, true);
                    let code = result.code
                    let stdout = result.stdout
                    let stderr = result.stderr
                    let resggd = await reqAPI('resultassigning', { python_code: codeBody, result, messages_: messages_, history: history_ });
                    setAskForce(resggd.askforce);

                    history_ = resggd.history;
                    messages_ = resggd.messages;
                    const resultContainer = createConversationLine({ text: JSON.stringify({ stdout, stderr }), type: 3, askforce: getAskForce(), parent: parent });
                    cline.push(resultContainer);
                    await saveState();
                    if (getAskForce() === "ask_opinion") {
                        if (getUseReview() === 'YES') {
                            try {
                                await requestAI(promptSession.prompt);
                            } catch (e) {
                                console.log('abort', e);
                                if (e === 10001) {
                                    console.log('렌더러에 의한 중단');
                                    /* 렌더러에 의한 중단*/
                                }
                            }
                        } else {
                            setAskForce('responsed_opinion');
                        }
                        return;
                    }

                });
            }
            if (!restore || last) {
                const execode = makeButton('Re-Generate Code');
                execode.addEventListener('click', async e => {
                    chatEditor.focus();
                    choosebox.remove();
                    conversationLine.remove();
                    cline.pop();
                    setAskForce('re-generate');
                    await saveState();
                    try {
                        await requestAI(promptSession.prompt);
                    } catch (e) {
                        console.log('abort', e);
                        if (e === 10001) {
                            console.log('렌더러에 의한 중단');
                            /* 렌더러에 의한 중단*/
                        }
                    }
                });

                choosebox.appendChild(execode);
            }

        }
        return conversationLine;
    }

    function setAskForce(v) {
        askforce = v
    }
    function getAskForce() {
        return askforce;
    }

    async function resetVendor() {
        await reqAPI('disableVariable', { value: 'USE_LLM' });
    }
    async function chooseModel() {
        const USE_LLM = await reqAPI('getconfig', { key: 'USE_LLM' });
        let kn = modelConfigurationKey(USE_LLM);
        if (kn) {
            await reqAPI('disableVariable', { value: kn });
            // await config();
        }
    }
    async function resetAllModel() {
        let list = [];
        list.push('OPENAI_MODEL');
        list.push('GROQ_MODEL');
        list.push('ANTHROPIC_MODEL');
        list.push('OLLAMA_MODEL');
        for (let i = 0; i < list.length; i++) {
            await reqAPI('disableVariable', { value: list[i] });
        }
    }
    function modelConfigurationKey(aiVendor) {
        if (!aiVendor) aiVendor = '';
        aiVendor = aiVendor.toLowerCase();
        let kn = '';
        if (aiVendor === 'openai') kn = ('OPENAI_MODEL');
        if (aiVendor === 'groq') kn = ('GROQ_MODEL');
        if (aiVendor === 'gemini') kn = '';
        if (aiVendor === 'anthropic') kn = ('ANTHROPIC_MODEL');
        if (aiVendor === 'ollama') kn = ('OLLAMA_MODEL');
        return kn;
    }
    // majore

    {
        let menu = [
            // {
            //     name: 'AI 제공사 선택', async trg() {
            //         await resetAllModel();
            //         await resetVendor();
            //         await config();
            //     }
            // },
            // {
            //     name: 'AI 모델 선택', async trg() {
            //         await resetAllModel();
            //         await config();
            //     }
            // },
            {
                name: 'AI 설정', async trg() {
                    await configPage();
                    return;
                    let apiasking = [
                        { llmname: 'openai', key: 'OPENAI_API_KEY', title: `What is your OpenAI API key for accessing OpenAI services?` },
                        { llmname: 'groq', key: 'GROQ_API_KEY', title: `What is your GROQ API key for accessing GROQ services?` },
                        { llmname: 'anthropic', key: 'ANTHROPIC_API_KEY', title: `What is your Anthropic API key for accessing Anthropic services?` },
                        { llmname: 'gemini', key: 'GOOGLE_API_KEY', title: `What is your Gemini API key for accessing Gemini services?` },
                    ];
                    const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
                    await new Promise(r => requestAnimationFrame(r));
                    await new Promise(r => requestAnimationFrame(r));
                    if (!confirm(`현재 설정된 ${use_llm}의 API키를 제거하고 재설정하시겠습니까?`)) {
                        return;
                    }
                    for (let i = 0; i < apiasking.length; i++) {
                        const { key, title, llmname } = apiasking[i];
                        if (llmname === use_llm) {
                            await reqAPI('disableVariable', { value: key });
                        }
                    }
                    await config();
                }
            },
            // {
            //     name: '모든 설정 초기화', async trg() {
            //         if (confirm('모든 설정을 초기화 하시겠습니까? 대화기록도 모두 제거됩니다.')) {
            //             await abortAllTask();
            //             await reqAPI('resetconfig');
            //             await prepareVENV();
            //             await config();
            //             // await refreshList();
            //             let els = await refreshList();
            //             if (els[0]) els[0]?.click()

            //         }
            //     }
            // },
            {
                name: '코드깎는노인 유튜브', async trg() {
                    await reqAPI('open', { value: 'https://www.youtube.com/@codeteller' });
                }
            },
            {
                name: '코드깎는노인 클래스', async trg() {
                    await reqAPI('open', { value: 'https://cokac.com' });
                }
            },
        ];
        menu.forEach(itm => {

            let li = document.createElement('li');
            li.innerText = itm.name;
            li.style.wordBreak = 'break-all';
            majore.appendChild(li);
            li.addEventListener('click', e => {
                chatEditor.focus();
                itm.trg();
            })
        })
    }
    async function startNewTalk(file) {
        await abortAllTask();
        if (false && reqAPIQueue.length) {
            alert('현재 진행중인 요청이 완료된 후 다시 시도해주세요')
            return;
        }
        if (!await getmodelnamed()) {
            await configPage();
            return;
        }
        pageMode = 'talk';
        chatEditor.focus();
        chatMessages.innerText = '';
        chatMessages.style.padding = '10px'
        cline.splice(0, Infinity);
        if (!file) {
            sessionDate = getCurrentDateTime();
            promptSession = null;
            history_ = [];
            messages_ = [];
            askforce = '';
            summary = '';
            first = true;
            return;
        }
        let stateData = await reqAPI('getstate', { filename: file });
        let parsed = JSON.parse(stateData);
        sessionDate = parsed.environment.sessionDate;
        promptSession = parsed.environment.promptSession;
        history_ = parsed.environment.history;
        messages_ = parsed.environment.messages;
        askforce = parsed.environment.askforce;
        summary = parsed.environment.summary;
        first = parsed.environment.first;
        for (let i = 0; i < parsed.conversationLine.length; i++) {
            let lineinfo = parsed.conversationLine[i];
            let text = lineinfo.values[0];
            if (lineinfo.type === 3) {
                text = JSON.stringify({ stdout: lineinfo.values[0], stderr: lineinfo.values[1] })
            }
            let last = parsed.conversationLine.length - 1 === i;
            const resultContainer = createConversationLine({ text: text, type: lineinfo.type, parent: chatMessages, askforce: lineinfo.askforce, restore: true, last });
            cline.push(resultContainer);
        }
        scrollSmoothToBottom(false);
    }
    async function refreshList() {
        let neededPackageListOfObject = await reqAPI('getstatelist');
        talklist.innerText = '';
        let el = [];
        [null, ...neededPackageListOfObject].forEach(file => {
            let li = document.createElement('li');
            el.push(li);
            li.style.wordBreak = 'break-all';
            talklist.appendChild(li);
            if (file) {
                let asdf = file.split('_');
                li.innerText = `${asdf[1]} ${asdf[2]}`;
            } else {
                li.innerText = `새 대화`;
            }
            li.addEventListener('click', () => startNewTalk(file));
        });
        return el;
    }

















    function initPage() {
        let style = document.createElement('style');
        style.innerHTML = `
        .spinner {
            border: 16px solid #f3f3f3;
            border-top: 16px solid #3498db;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
            margin-top: 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
        document.head.appendChild(style);

        // 로딩 컨테이너 생성
        let loadingContainer = document.createElement('div');
        loadingContainer.style.width = '100%';
        loadingContainer.style.height = '100%';
        loadingContainer.style.position = 'fixed';
        loadingContainer.style.top = '0';
        loadingContainer.style.left = '0';
        loadingContainer.style.display = 'flex';
        loadingContainer.style.flexDirection = 'column';
        loadingContainer.style.justifyContent = 'center';
        loadingContainer.style.alignItems = 'center';
        loadingContainer.style.backgroundColor = '#f0f0f0';

        // 로고 생성
        let logo = document.createElement('h1');
        logo.innerText = 'AIEXE';
        logo.style.fontSize = '5em';
        logo.style.marginBottom = '20px';

        // 스피너 생성
        let spinner = document.createElement('div');
        spinner.className = 'spinner';

        // "설치중" 텍스트 생성
        let loadingText = document.createElement('p');
        loadingText.innerText = 'Initialization';
        loadingText.style.fontSize = '2em';
        loadingText.style.marginTop = '20px';

        // 로딩 컨테이너에 로고, 스피너와 텍스트 추가
        loadingContainer.appendChild(logo);
        loadingContainer.appendChild(spinner);
        loadingContainer.appendChild(loadingText);

        // 로딩 컨테이너를 body에 추가
        document.body.appendChild(loadingContainer);
        return { loadingContainer, loadingText, spinner };
    }
    async function prepareVENV() {
        // console.log(await reqAPI('venvpath'));
        if (await reqAPI('venvpath')) return;
        const { loadingContainer, loadingText, spinner } = initPage();
        let { result, pythoncheck } = await reqAPI('createVENV');
        if (result) {
            document.body.removeChild(loadingContainer);
        } else {
            loadingContainer.removeChild(spinner);
            loadingContainer.removeChild(loadingText);
            let errmsg = document.createElement('div');
            errmsg.innerHTML = pythoncheck.join('<br />');
            errmsg.style.color = 'rgba(0,0,0,0.5)';
            errmsg.style.fontSize = '1.2em';
            errmsg.style.marginTop = '20px';
            loadingContainer.appendChild(errmsg);
            await new Promise(resolve => { });
        }
    }












    async function config() {
        return;
        let container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.backgroundColor = '#f0f0f0';
        container.style.opacity = '0';

        // 타이틀 생성
        let title = document.createElement('h1');
        title.innerText = 'AIEXE';
        title.style.fontSize = '5em';
        title.style.marginBottom = '20px';
        title.style.opacity = '1';  // 초기 상태를 투명하게 설정

        // 컨테이너에 타이틀 추가
        container.insertBefore(title, container.firstChild);

        // 컨테이너를 body에 추가
        document.body.appendChild(container);

        // 옵션 버튼들 생성

        {
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            if (!use_llm) {
                let title = 'Which LLM vendor do you prefer?';
                let options = ['OpenAI', 'Anthropic', 'Ollama', 'Gemini', 'Groq'];
                container.style.opacity = '1';
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'USE_LLM', value: chosen.toLowerCase() });
            }
        }
        {
            let apiasking = [
                { llmname: 'openai', key: 'OPENAI_API_KEY', title: `What is your OpenAI API key for accessing OpenAI services?` },
                { llmname: 'groq', key: 'GROQ_API_KEY', title: `What is your GROQ API key for accessing GROQ services?` },
                { llmname: 'anthropic', key: 'ANTHROPIC_API_KEY', title: `What is your Anthropic API key for accessing Anthropic services?` },
                { llmname: 'gemini', key: 'GOOGLE_API_KEY', title: `What is your Gemini API key for accessing Gemini services?` },
            ];
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            for (let i = 0; i < apiasking.length; i++) {
                const { key, title, llmname } = apiasking[i];
                let apiKeyString = await reqAPI('getconfig', { key: key });
                if (!apiKeyString) apiKeyString = '';
                if (!apiKeyString && use_llm === llmname) {
                    container.style.opacity = '1';
                    const chosen = await selector(title, apiKeyString, container);
                    await reqAPI('setconfig', { key: key, value: chosen });
                }
            }
        }
        {
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            const OPENAI_MODEL = await reqAPI('getconfig', { key: 'OPENAI_MODEL' });
            if (!OPENAI_MODEL && use_llm === 'openai') {
                const options = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
                let title = 'Which OpenAI model do you want to use for your queries?';
                container.style.opacity = '1';
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'OPENAI_MODEL', value: chosen });
            }
        }
        {
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            const ANTHROPIC_MODEL = await reqAPI('getconfig', { key: 'ANTHROPIC_MODEL' });
            if (!ANTHROPIC_MODEL && use_llm === 'anthropic') {
                const options = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
                let title = 'Which Anthropic model do you want to use for your queries?';
                container.style.opacity = '1';
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'ANTHROPIC_MODEL', value: chosen });
            }
        }
        {
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            const GROQ_MODEL = await reqAPI('getconfig', { key: 'GROQ_MODEL' });
            if (!GROQ_MODEL && use_llm === 'groq') {
                const options = ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];
                let title = 'Which GROQ model do you want to use for your queries?';
                container.style.opacity = '1';
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'GROQ_MODEL', value: chosen });
            }
        }
        {
            //ollamamodellist
            const use_llm = await reqAPI('getconfig', { key: 'USE_LLM' });
            const OLLAMA_MODEL = await reqAPI('getconfig', { key: 'OLLAMA_MODEL' });
            if (!OLLAMA_MODEL && use_llm === 'ollama') {
                const options = await reqAPI('ollamamodellist');
                let title = 'Which Ollama model do you want to use for your queries?';
                container.style.opacity = '1';
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'OLLAMA_MODEL', value: chosen });
            }
        }
        if (false) {
            const UPDATE_CHECK = await reqAPI('getconfig', { key: 'UPDATE_CHECK' });
            if (!UPDATE_CHECK) {
                let title = 'Do you want to check for new updates every time you run the app?';
                let options = ['YES', 'NO'];
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'UPDATE_CHECK', value: chosen.toLowerCase() });
            }
        }
        container.remove();
        await aiIndicator(true);

    }















    async function selector(title, options, container) {

        let subtitle = document.createElement('h1');
        subtitle.innerText = title;
        subtitle.style.fontSize = '2em';
        subtitle.style.margin = '20px';
        subtitle.style.opacity = '1';
        subtitle.style.color = 'rgba(0,0,0,0.5)';
        container.appendChild(subtitle);

        let resolver;
        let promise = new Promise(resolve => resolver = resolve);

        let btns = [];
        if (options?.constructor === Array) {
            options.forEach(optionText => {
                let button = document.createElement('button');
                button.innerText = optionText;
                button.style.fontSize = '1.5em';
                button.style.margin = '10px';
                button.style.padding = '10px 20px';
                button.style.border = '0px';
                button.style.cursor = 'pointer';
                container.appendChild(button);
                button.addEventListener('click', e => { resolver(optionText); });
                btns.push(button)
            });
        } else {
            let button = document.createElement('input');
            if (options) button.value = options;
            button.style.fontSize = '1.5em';
            button.style.margin = '10px';
            button.style.padding = '10px 20px';
            button.style.border = '0px';
            button.style.cursor = 'pointer';
            button.style.outlineStyle = 'none';
            button.style.width = '60%';
            button.style.textAlign = 'center';
            container.appendChild(button);
            button.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    resolver(button.value);
                }
            });
            button.focus();
            btns.push(button)
        }
        let chosen = await promise;
        while (btns.length) {
            btns.splice(0, 1)[0].remove();
        }
        subtitle.remove();
        return chosen;
    }




    let els = await refreshList();
    await startNewTalk()
    // if (els[0]) els[0]?.click()


    async function refreshVersionInfo() {
        let vinfo = {
            client: 'checking',
            latest: 'checking',
        }
        versioninfo.innerHTML = [
            `${vinfo.client ? `<div style="font-size: 0.7em;opacity: 0;">${vinfo.client}</div>` : ''}`,
            `${vinfo.client !== vinfo.latest ? '<div style="opacity: 0;font-size: 0.7em;color:yellow;font-weight:bold;cursor:pointer;" id="newavail">New Version Available</div>' : ''}`,
        ].join('');
        vinfo = await reqAPI('versioninfo');
        versioninfo.innerHTML = [
            `${vinfo.client ? `<div style="font-size: 0.7em;opacity: 0.3;">${vinfo.client}</div>` : ''}`,
            `${vinfo.client !== vinfo.latest ? '<div style="font-size: 0.7em;color:yellow;font-weight:bold;cursor:pointer;" id="newavail">New Version Available</div>' : ''}`,
        ].join('');
        document.querySelector('#newavail')?.addEventListener('click', async e => {
            await reqAPI('open', { value: 'https://cokac.com/list/announcement/6' })
        })
    }
    await refreshVersionInfo();
    await prepareVENV();
    await config();
    await aiIndicator(true);
    await showMainUI();
    async function showMainUI() {
        [...document.body.children].forEach(el => {
            el.style.opacity = '1';
        });
    }


    async function getUseReview() {
        return await reqAPI('getconfig', { key: 'USE_REVIEW' });
    }
    async function configPage() {
        await abortAllTask();

        if (!await getUseReview()) await reqAPI('setconfig', { key: 'USE_REVIEW', value: 'YES' });

        if (false && reqAPIQueue.length) {
            alert('현재 진행중인 요청이 완료된 후 다시 시도해주세요')
            return;
        }
        pageMode = 'config';
        const configContainer = chatMessages;
        configContainer.innerText = '';
        {
            async function getModelInformation(vendorKey) {
                if (vendorKey === 'openai') {
                    return {
                        keyname: 'OPENAI_MODEL',
                        modelList: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
                    };
                }
                if (vendorKey === 'anthropic') {
                    return {
                        keyname: 'ANTHROPIC_MODEL',
                        modelList: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
                    };
                }
                if (vendorKey === 'groq') {
                    return {
                        keyname: 'GROQ_MODEL',
                        modelList: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']
                    };
                }
                if (vendorKey === 'ollama') {
                    return {
                        keyname: 'OLLAMA_MODEL',
                        modelList: await reqAPI('ollamamodellist')
                    };
                }
                if (vendorKey === 'gemini') {
                    return {
                        keyname: 'GEMINI_MODEL',
                        modelList: ['gemini-pro']
                    };
                }
            }
            async function makeConfigLine(configContainer, { title, description, type, list, keyname, placeholder, vendorKey, handleRadioChange }) {
                const lineContainer = document.createElement('div');
                lineContainer.className = 'aiexe_configuration_config-line';
                lineContainer.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                configContainer.appendChild(lineContainer);

                const configKeyTitle = document.createElement('div');
                configKeyTitle.innerText = title;
                configKeyTitle.className = 'aiexe_configuration_config-key';
                lineContainer.appendChild(configKeyTitle);

                const configValueUI = document.createElement('div');
                configValueUI.className = 'aiexe_configuration_config-value';
                lineContainer.appendChild(configValueUI);

                if (type === 'input') {
                    const inputElement = document.createElement('input');
                    inputElement.classList.add('aiexe_configuration_input');
                    inputElement.type = 'password';
                    inputElement.___name = vendorKey;
                    inputElement.placeholder = placeholder;
                    inputElement.value = await reqAPI('getconfig', { key: keyname });
                    configValueUI.appendChild(inputElement);
                    inputElement.addEventListener('blur', async () => {
                        await reqAPI('setconfig', { key: keyname, value: inputElement.value })
                    });
                    inputElement.addEventListener('keyup', async () => {
                        await reqAPI('setconfig', { key: keyname, value: inputElement.value })
                    });
                } else if (type === 'radio' && list) {
                    const radioContainer = document.createElement('div');
                    radioContainer.className = 'aiexe_configuration_radio-container';
                    configValueUI.appendChild(radioContainer);

                    if (description) {
                        const descel = document.createElement('div');
                        descel.innerText = description;
                        descel.style.padding = `5px`;
                        descel.style.color = `rgba(255,255,255,0.3)`;
                        descel.style.display = `block`;
                        radioContainer.appendChild(descel);
                    }
                    let defaultValue = await reqAPI('getconfig', { key: keyname })

                    list.forEach((item, index) => {
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = title;
                        radioInput.value = item.keyAsValue;
                        radioInput.id = `radio-${item.keyAsValue}`;
                        if (defaultValue ? item.keyAsValue === defaultValue : index === 0) {
                            radioInput.checked = true;
                        }
                        radioInput.addEventListener('change', async () => {
                            if (handleRadioChange) await handleRadioChange(item.keyAsValue, keyname);
                        });
                        radioContainer.appendChild(radioInput);

                        const radioLabel = document.createElement('label');
                        radioLabel.htmlFor = `radio-${item.keyAsValue}`;
                        radioLabel.innerText = item.displayName;
                        radioContainer.appendChild(radioLabel);
                    });
                }
                return lineContainer;
            }


            // const configContainer = document.getElementById('configContainer');
            const title = document.createElement('div');
            title.innerText = 'Configuration';
            title.style.background = 'rgba(255,255,255,0.05)';
            title.style.padding = '15px';
            configContainer.style.padding = '0px';
            configContainer.appendChild(title);

            const vendorRadio = await makeConfigLine(configContainer, {
                title: 'AI Vendor',
                type: 'radio',
                keyname: 'USE_LLM',
                list: [
                    {
                        displayName: 'OpenAI', // API Key required
                        keyAsValue: 'openai',
                    },
                    {
                        displayName: 'Anthropic', // API Key required
                        keyAsValue: 'anthropic',
                    },
                    {
                        displayName: 'Ollama', // No need API Key
                        keyAsValue: 'ollama',
                    },
                    {
                        displayName: 'Gemini', // API Key required, as GOOGLE
                        keyAsValue: 'gemini',
                    },
                    {
                        displayName: 'Groq', // API Key required
                        keyAsValue: 'groq',
                    },
                ],
                defaultValue: 'openai',
                async handleRadioChange(selectedVendor, config_key) {
                    modelContainer.innerText = '';
                    const lines = document.querySelectorAll('.aiexe_configuration_config-line');
                    lines.forEach(line => {
                        const input = line.querySelector('.aiexe_configuration_input');
                        if (input) {
                            if (input.___name === selectedVendor) {
                                line.classList.remove('aiexe_configuration_hidden');
                            } else {
                                line.classList.add('aiexe_configuration_hidden');
                            }
                        }
                    });

                    let oaijdf = await getModelInformation(selectedVendor);
                    let modelRadio = await makeConfigLine(modelContainer, {
                        title: 'Model',
                        type: 'radio',
                        keyname: oaijdf.keyname,
                        list: true ? oaijdf.modelList.map(modelName => {
                            return {
                                displayName: modelName,
                                keyAsValue: modelName,
                            }
                        }) : null,
                        defaultValue: oaijdf.modelList[0],
                        async handleRadioChange(model_name, config_key_model) {
                            await reqAPI('setconfig', { key: config_key, value: selectedVendor });
                            await reqAPI('setconfig', { key: config_key_model, value: model_name });
                            await aiIndicator(true);
                        }
                    });
                    modelRadio.querySelector('input[type="radio"]:checked').dispatchEvent(new Event('change'));
                }
            });

            await makeConfigLine(configContainer, {
                title: 'OPENAI API KEY',
                type: 'input',
                keyname: 'OPENAI_API_KEY',
                placeholder: 'Please input API Key',
                vendorKey: 'openai',
            });
            await makeConfigLine(configContainer, {
                title: 'ANTHROPIC API KEY',
                type: 'input',
                keyname: 'ANTHROPIC_API_KEY',
                placeholder: 'Please input API Key',
                vendorKey: 'anthropic',
            });
            await makeConfigLine(configContainer, {
                title: 'GOOGLE API KEY',
                type: 'input',
                keyname: 'GOOGLE_API_KEY',
                placeholder: 'Please input API Key',
                vendorKey: 'gemini',
            });
            await makeConfigLine(configContainer, {
                title: 'GROQ API KEY',
                type: 'input',
                keyname: 'GROQ_API_KEY',
                placeholder: 'Please input API Key',
                vendorKey: 'groq',
            });
            let modelContainer = document.createElement('div');
            configContainer.appendChild(modelContainer);


            await makeConfigLine(configContainer, {
                title: 'Review',
                description: 'Whether to conduct a review by AI after executing the code.',
                type: 'radio',
                keyname: 'USE_REVIEW',
                list: true ? ['YES', 'NO'].map(modelName => {
                    return {
                        displayName: modelName,
                        keyAsValue: modelName,
                    }
                }) : null,
                async handleRadioChange(model_name, config_key_model) {
                    await reqAPI('setconfig', { key: 'USE_REVIEW', value: model_name });
                }
            });



            vendorRadio.querySelector('input[type="radio"]:checked').dispatchEvent(new Event('change'));


            async function resetConfiguration() {
                if (confirm('모든 설정을 초기화 하시겠습니까? 대화기록도 모두 제거됩니다.')) {
                    await abortAllTask();
                    await reqAPI('resetconfig');
                    await prepareVENV();
                    await config();
                    // await refreshList();
                    let els = await refreshList();
                    if (els[0]) els[0]?.click()
                }
            }
            {
                let toool = document.createElement('div');
                toool.style.padding = '20px'
                toool.style.textAlign = 'right'
                configContainer.appendChild(toool);
                let resetbtn = document.createElement('button');
                resetbtn.style.padding = '10px'
                resetbtn.style.background = 'transparent'
                resetbtn.style.border = '0px'
                resetbtn.style.color = 'rgba(255,255,255,0.7)'
                resetbtn.style.cursor = 'pointer'
                resetbtn.innerText = 'Reset Configuration'
                toool.appendChild(resetbtn);
                resetbtn.addEventListener('click', resetConfiguration);

            }

        }
    }
});