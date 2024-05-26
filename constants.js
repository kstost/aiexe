export const threeticks = '`'.repeat(3);
export const threespaces = ' '.repeat(3);
export const disableOra = false;
export const limitline = 30; // 대화 기록이 이만큼에 닿게되면 요약을 시도한다.
export const annn = 3; // 요약을 할 때 이만큼에 해당하는 대화건은 요약에서 제외하고 원래 내용대로 유지한다. 만약 3이라고 하면 실제 메시지수는 이의 4배인 12개이다.
export const responseTokenRatio = 0.3; // 답변에 사용할 토큰 비율이다. 만약 이 값을 0.3으로 설정하면 컨텍스트 제공목적으로 사용하는 토큰을 0.7만큼 사용한다는것이다. 전체 컨텍스트윈도우가 1000이라면 700이 되는것이다.
export const preprocessing = `preprocessing`;
export const devmode = false;
export const traceError = false; // 배포시 false
export const contextWindows = {
    "llama3-8b-8192": 8192,
    "llama3-70b-8192": 8192,
    // "mixtral-8x7b-32768": 32768,
    "gemma-7b-it": 8192,
    "mixtral-8x7b-32768": 32768,
    "llama3:latest": 8192,
    "llama3:8b-instruct-q8_0": 8192,
    "llama3:70b": 8192,
    "gemini-pro": 1000000,
    "gpt-4o": 128000,
    "gpt-4-turbo": 128000,
    "gpt-4": 8192,
    "gpt-3.5-turbo": 16385,
    "claude-3-opus-20240229": 200000,
    "claude-3-sonnet-20240229": 200000,
    "claude-3-haiku-20240307": 200000,
};
export const llamaFamily = [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "llama3:latest",
    "llama3:8b-instruct-q8_0",
    "llama3:70b",
];
export const colors = {
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
export const forignLanguage = { "en": "foreign language", "fr": "langue étrangère", "ko": "외국어", "ja": "外国語", "vi": "ngoại ngữ", "es": "idioma extranjero", "de": "Fremdsprache", "zh": "外语", "ru": "иностранный язык", "it": "lingua straniera", "pt": "língua estrangeira", "hi": "विदेशी भाषा" };
export const greetings = { "en": "Hello", "fr": "Bonjour", "ko": "안녕하세요", "ja": "こんにちは", "vi": "Xin chào", "es": "Hola", "de": "Hallo", "zh": "你好", "ru": "Привет", "it": "Ciao", "pt": "Olá", "hi": "नमस्ते", };
export const howAreYou = { "en": "How are you?", "fr": "Comment allez-vous ?", "ko": "어떻게 지내세요?", "ja": "お元気ですか？", "vi": "Bạn khỏe không?", "es": "¿Cómo estás?", "de": "Wie geht es Ihnen?", "zh": "你好吗？", "ru": "Как дела?", "it": "Come stai?", "pt": "Como você está?", "hi": "आप कैसे हैं?", };
export const whatAreYouDoing = { "en": "What are you doing?", "fr": "Que faites-vous ?", "ko": "무엇을 하고 계세요?", "ja": "何をしていますか？", "vi": "Bạn đang làm gì?", "es": "¿Qué estás haciendo?", "de": "Was machst du?", "zh": "你在做什么？", "ru": "Что ты делаешь?", "it": "Cosa stai facendo?", "pt": "O que você está fazendo?", "hi": "तुम क्या कर रहे हो?", };
export const langtable = { "en": "English", "fr": "French", "ko": "Korean", "ja": "Japanese", "vi": "Vietnamese", "es": "Spanish", "de": "German", "zh": "Chinese", "ru": "Russian", "it": "Italian", "pt": "Portuguese", "hi": "Hindi", };
