import { threeticks, threespaces, disableOra, limitline, annn, responseTokenRatio, preprocessing, traceError, contextWindows, colors, forignLanguage, greetings, howAreYou, whatAreYouDoing, langtable } from './constants.js'

window.addEventListener('load', async () => {
    // console.log
    // console.log(threeticks);
    let currentMode = 'waiting';
    let currdata;
    let currentInputViews;
    let counter = 0;
    let queue = {};
    function getUnique() { return ++counter; }
    async function reqAPI(mode, arg) {
        showLoading();
        if ('savestate' !== mode && 'getstatelist' !== mode) {
            if (false) console.log(mode, JSON.stringify(arg, undefined, 3));
        }
        let taskId = getUnique();
        let _resolve;
        let promise = new Promise(resolve => _resolve = resolve);
        queue[taskId] = _resolve;
        window.electronAPI.send('request', { mode, taskId, arg });

        let dt = await promise;
        removeLoading();
        return dt;
    }
    window.electronAPI.receive('response', (arg) => {
        let fn = queue[arg.taskId];
        delete queue[arg.taskId];
        fn(arg.arg);
    });
    //----------------------------------------------------
    const inputarea = document.querySelector('.input-container div');
    const button = document.querySelector('.input-container button');
    const chatMessages = document.querySelector('#chat-messages');
    const talklist = document.querySelector('#talklist');
    const majore = document.querySelector('#majore');
    function scrollSmoothToBottom(smooth = true) {
        chatMessages.scroll({
            top: chatMessages.scrollHeight * 1,
            behavior: smooth ? 'smooth' : undefined
        });
    }

    let loading = null;
    function showLoading() {
        removeLoading();
        let adf = `<span class="loader"></span>`;
        let oiadjsf = document.createElement('div');
        oiadjsf.style.textAlign = 'center';
        oiadjsf.innerHTML = adf;
        chatMessages.appendChild(oiadjsf);
        scrollSmoothToBottom();
        loading = oiadjsf;
    }
    function removeLoading() {
        loading?.remove();
        loading = null;
    }
    button.addEventListener('click', e => {
        entertir(chatEditor, chatEditor.getValue());
    })

    let chatEditor = makeEditor(inputarea, '', "text", !true, entertir, true);
    // chatEditor.setValue(`raise error don't catch just let it raise error`);
    let cline = [];
    window.cline = cline;
    async function entertir(cm, text) {
        if (loading) return;
        if (!text.trim()) return;
        cm.setValue('');
        if (true) {
            const line = createConversationLine({ text: text, type: 1, parent: chatMessages })
            cline.push(line);
            scrollSmoothToBottom();
            if (currentMode === 'waiting') {
                await requestAI(text);
            }
            else if (currentMode === 'choosing') {
                currentInputViews.remove();
                let resultAssignnewprompt = await reqAPI('assignnewprompt', { request: text, history: history_, promptSession, python_code: currdata.python_code });
                promptSession = resultAssignnewprompt.promptSession
                history_ = resultAssignnewprompt.history
                setAskForce(resultAssignnewprompt.askforce)
                await saveState();
                await requestAI(text);
            } else if (currentMode === 'run_code_causes_error') {
                currentInputViews.remove();
                setAskForce(currentMode)
                let resultErrorprompthandle = await reqAPI('errorprompthandle', { request: text, history: history_, askforce: getAskForce(), promptSession });
                history_ = resultErrorprompthandle.history
                setAskForce('');
                promptSession = resultErrorprompthandle.promptSession
                await saveState();
                await requestAI(text);
            }
        }
    }

    let first = true;
    let askforce = '';
    let history_ = [];
    let messages_ = [];
    let summary = '';
    let promptSession;
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
        let resultAireq = await reqAPI('aireq', { prompt, askforce: getAskForce(), summary, messages_, history: history_, first });
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
        let state = {
            environment: {
                promptSession,
                history: history_,
                messages: messages_,
                askforce: getAskForce(),
                summary,
                first
            },
            conversationLine
        }
        await reqAPI('savestate', { sessionDate, state });
        await refreshList();
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
            procResult.python_code = [`# GENERATED CODE`,
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
            conversationLine.classList.add('other')
        }
        conversationLine.classList.add('message')



        if (type === 4 || type === 1 || type === 3 || type === 5 || type === 6) { } else {
            if (text) {
                if (typeof text === 'string') {
                    conversationLine.innerText = text;
                } else {
                    conversationLine.appendChild(text);
                }
            }
        }
        if (type === 1) {
            parent.appendChild(conversationLine);
            const cm = makeEditor(conversationLine, text, "text", true, null, true);
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [cm] };
            };
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
            conversationLine[Symbol.for('toolBtn')] = toolBtn;
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [editors.stdout, editors.stderr], askforce };
            };
            if (!restore || last) {
                if (askforce === "run_code_causes_error") {
                    currentMode = askforce;
                    const execode = makeButton('Create of a revised code');
                    execode.addEventListener('click', async e => {
                        toolBtn.remove();
                        setAskForce('');
                        await saveState();
                        await requestAI(promptSession.prompt);
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
            title.style.color = 'rgba(255,255,255,0.4)';
            title.style.display = 'inline-block'
            title.innerText = `Missing Module Installataion`;
            title.style.marginBottom = '5px';
            conversationLine.appendChild(title);

            const message = document.createElement('div');
            message.style.color = 'rgba(255,255,255,0.4)';
            message.style.display = 'inline-block'
            message.innerText = `Here are the Python module packages that are required to execute the code but are currently missing from the virtual environment. Please select the packages you wish to install and proceed with the installation. Note that there might be mistakes in the package names due to AI errors, so please be cautious.`;
            message.style.fontSize = '0.8em';
            conversationLine.appendChild(message);

            const toolBtnd = document.createElement('button');
            Object.keys(modulelistOb).forEach(name => {

                let df = document.createElement('div');
                df.style.display = 'inline-block';
                df.style.padding = '5px';
                df.style.margin = '5px';
                df.style.cursor = 'pointer';
                df.innerText = modulelistOb[name];
                let toggle = false;
                df.addEventListener('click', e => {
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
                resolver(Object.keys(chosenList));
            })
            scrollSmoothToBottom();
            let resolver;
            let promise = new Promise(resolve => {
                resolver = resolve;
            });
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

            const choosebox = document.createElement('div');
            choosebox.style.display = 'block';
            choosebox.style.width = '100%'
            choosebox.style.textAlign = 'right'
            conversationLine[Symbol.for('choosebox')] = choosebox;


            // (!restore || last)
            // (restore&&!last)


            const cm = makeEditor(conversationLine, text, "python", (restore && !last))
            conversationLine.appendChild(choosebox);
            conversationLine[Symbol.for('state')] = () => {
                return { type, cm: [cm] };
            };

            if (!restore || last) {
                const execode = makeButton('Execute Code');
                choosebox.appendChild(execode);
                execode.addEventListener('click', async e => {
                    choosebox.remove();
                    let neededPackageListOfObject = await reqAPI('neededpackages', { python_code: cm.getValue() });
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
                    let result = await reqAPI('shell_exec', { "code": cm.getValue(), "b64": false });
                    let code = result.code
                    let stdout = result.stdout
                    let stderr = result.stderr
                    let resggd = await reqAPI('resultassigning', { python_code: cm.getValue(), result, messages_: messages_, history: history_ });
                    setAskForce(resggd.askforce);

                    history_ = resggd.history;
                    messages_ = resggd.messages;
                    const resultContainer = createConversationLine({ text: JSON.stringify({ stdout, stderr }), type: 3, askforce: getAskForce(), parent: parent });
                    cline.push(resultContainer);
                    await saveState();
                    if (getAskForce() === "ask_opinion") {
                        await requestAI(promptSession.prompt);
                        return;
                    }

                });
            }
            if (!restore || last) {
                const execode = makeButton('Re-Generate Code');
                execode.addEventListener('click', async e => {
                    choosebox.remove();
                    conversationLine.remove();
                    cline.pop();
                    setAskForce('re-generate');
                    await saveState();
                    await requestAI(promptSession.prompt);
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


    // majore

    {
        let menu = [
            {
                name: 'AI 제공사 선택', async trg() {
                    await reqAPI('disableVariable', { value: 'USE_LLM' });
                    await config(false);
                }
            },
            {
                name: 'AI 모델 선택', async trg() {
                    let kn = '';
                    const USE_LLM = await reqAPI('getconfig', { key: 'USE_LLM' });
                    if (USE_LLM === 'openai') kn = ('OPENAI_MODEL');
                    if (USE_LLM === 'groq') kn = ('GROQ_MODEL');
                    if (USE_LLM === 'gemini') kn = 'gemini-pro';
                    if (USE_LLM === 'anthropic') kn = ('ANTHROPIC_MODEL');
                    if (USE_LLM === 'ollama') kn = ('OLLAMA_MODEL');
                    await reqAPI('disableVariable', { value: kn });
                    await config(true);
                }
            },
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
                itm.trg();
            })
        })
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
            li.addEventListener('click', async e => {
                chatMessages.innerText = '';
                cline.splice(0, Infinity);
                if (!file) {
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
            });
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
        const { loadingContainer, loadingText, spinner } = initPage();
        let { result, pythoncheck } = await reqAPI('createVENV');
        console.log(result)
        console.log(pythoncheck)
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
    setTimeout(async () => {
        // 스타일 추가
        await prepareVENV();
        await config();
        // 컨테이너 생성

        // console.log(use_llm);

        // GSAP 애니메이션 적용
        // gsap.to(title, { duration: 2, opacity: 1, ease: 'power2.inOut' });



    }, 100);
    ;













    async function config(boot = true) {
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
                const value = await reqAPI('getconfig', { key: key });
                if (boot) if (value) continue;
                if (use_llm === llmname) {
                    const chosen = await selector(title, value, container);
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
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'OLLAMA_MODEL', value: chosen });
            }
        }
        {
            const UPDATE_CHECK = await reqAPI('getconfig', { key: 'UPDATE_CHECK' });
            if (!UPDATE_CHECK) {
                let title = 'Do you want to check for new updates every time you run the app?';
                let options = ['YES', 'NO'];
                const chosen = await selector(title, options, container);
                await reqAPI('setconfig', { key: 'UPDATE_CHECK', value: chosen.toLowerCase() });
            }
        }
        container.remove();

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
    if (els[0]) els[0]?.click()




});