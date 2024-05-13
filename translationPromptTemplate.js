export default {
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
            - Use a natural, gentle writing style and appropriate words, expressions, and vocabulary.
            - Translate everything as is, without leaving out any content from the original text.
            - Do not include any content other than translated result.`
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
            - N'incluez aucun contenu autre que le résultat traduit.`
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
            - 자연스럽고 부드러운 문체와 적절한 단어, 표현 및 어휘를 사용하세요.
            - 존댓말을 사용하세요.
            - 원문의 내용은 하나도 빼놓지 말고 모두 그대로 번역하세요.
            - 번역된 결과 이외의 내용은 포함하지 마세요.`
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
            - 自然で柔らかい文体と適切な単語、表現、語彙を使用してください。
            - 尊敬語を使用してください。
            - 原文の内容は一つも欠かさず、すべてそのまま翻訳してください。
            - 翻訳結果以外の内容は含めないでください。`
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
            - Sử dụng phong cách mềm mại và tự nhiên với các từ ngữ, biểu đạt và từ vựng phù hợp.
            - Hãy sử dụng ngôn ngữ tôn trọng.
            - Dịch chính xác từng từ trong bản gốc.
            - Không bao gồm bất kỳ nội dung nào ngoài kết quả đã dịch.`
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
            - No incluya ningún contenido que no sea el resultado traducido.`
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
            - Fügen Sie keine anderen Inhalte als das übersetzte Ergebnis ein.`
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
            - 使用自然、温和的写作风格以及适当的单词、表达和词汇。 
            - 按原样翻译所有内容，不要遗漏原文中的任何内容。 
            - 请勿包含翻译结果以外的任何内容。
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
            - Не включайте никакого контента, кроме переведенного результата.`
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
            - Non includere alcun contenuto diverso dal risultato tradotto.`
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
            - Não inclua nenhum conteúdo além do resultado traduzido.`
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
            - अनुवादित परिणाम के अलावा कोई भी सामग्री शामिल न करें।`
        }],
};