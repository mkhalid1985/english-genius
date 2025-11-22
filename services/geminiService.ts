import { GoogleGenAI, Type, Modality } from "@google/genai";
import {
  WritingFeedback,
  QuizQuestion,
  ReadingPassage,
  ReadingLevel,
  CVCWord,
  ScrambledSentence,
  ParagraphComprehensionContent,
  LearnToWriteLevel,
  WritingTask,
  LearnToWriteFeedback,
  QuizQuestionType,
  LetterWritingFeedback,
  BrainstormCoherenceFeedback,
  ImprovementItem,
  AIDetectionResult,
  PracticeWorksheet,
  LeveledText,
  WordDefinition,
  TranslatedText,
  LeveledTextWithVocabulary,
  VocabularyLessonCard
} from "../types";

// Note: API_KEY should be set in environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper to parse JSON responses safely
const parseJsonResponse = <T>(jsonString: string, context: string): T => {
    try {
        // The API might return the JSON string enclosed in ```json ... ```, so we extract it.
        const match = jsonString.match(/```json\n([\s\S]*)\n```/);
        const cleanString = match ? match[1] : jsonString;
        return JSON.parse(cleanString);
    } catch (error) {
        console.error(`Error parsing JSON for ${context}:`, error);
        console.error("Original string:", jsonString);
        throw new Error(`Failed to parse response from AI for ${context}.`);
    }
};

export const getTextFromImage = async (imageData: { data: string; mimeType: string }): Promise<string> => {
    const prompt = "Extract all handwritten text from this image. Return only the text content, preserving paragraphs if possible.";
    
    const imagePart = {
        inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data,
        },
    };
    const textPart = {
        text: prompt
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text || "";
};

export const checkPersonalNarrative = async (text: string, gradeLevel: string): Promise<WritingFeedback> => {
    const prompt = `
        Analyze the following text written by a ${gradeLevel} student for a personal narrative activity.
        A personal narrative for this age level requires at least 60 words and should be structured into paragraphs with a clear beginning, middle, and end.

        **EVALUATION RUBRIC:**
        Evaluate on a scale of 1-5 for each category:

        1.  **Paragraphs & Structure:**
            *   This is the MOST important category. A standard three-paragraph structure is expected, but well-structured essays with more paragraphs (like a five-paragraph essay) should be **rewarded, not penalized**.
            *   1/5: The text is under 60 words OR is not in paragraph form at all.
            *   2/5: The text is over 60 words but is written as one single block of text (one paragraph) OR it has only two paragraphs.
            *   3/5: The text attempts at least three paragraphs, but they are not clearly separated, are very underdeveloped, or lack a clear beginning, middle, and end.
            *   4/5: The text has three or more paragraphs that are clearly separated and mostly well-structured with a discernible introduction, body, and conclusion.
            *   5/5: The text has at least three well-defined, well-structured paragraphs with a clear introduction, body, and conclusion. An excellent five-paragraph essay should receive a 5/5.

        2.  **Grammar:** (Correct usage of nouns, verbs, tenses, etc.)
        3.  **Sentence Structure:** (Variety, completeness, avoids run-on sentences.)
        4.  **Spelling and Punctuation:** (Accuracy of spelling and use of periods, capitals, etc.)
        
        **CRITICAL: If the 'Paragraphs & Structure' score is 1 or 2, the total score MUST be heavily penalized and cannot exceed 8/20.**

        **OUTPUT FORMAT (JSON):**
        Provide feedback in a strict JSON format.
        1.  A 'scores' object. For each category ('paragraphs', 'grammar', 'sentenceStructure', 'spellingAndPunctuation'), provide:
            *   'score': The score from 1-5 based on the rubric.
            *   'justification': If the score is less than 5, provide a simple, one-sentence explanation for why points were deducted based on the rubric. If the score is 5, this value should be null.
            *   Also include a 'total' score out of 20, which is the sum of the individual scores.
        2.  A 'goodPoints' array of 2-3 short, encouraging bullet points about what the student did well.
        3.  An 'improvementArea' array of objects for specific mistakes. For each, provide the 'mistake', 'correction', and a simple 'explanation'. If no mistakes, return an empty array.

        Text to analyze:
        "${text}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scores: {
                        type: Type.OBJECT,
                        properties: {
                            paragraphs: { 
                                type: Type.OBJECT,
                                properties: {
                                    score: { type: Type.INTEGER },
                                    justification: { type: Type.STRING, nullable: true }
                                },
                                required: ["score", "justification"]
                             },
                            grammar: { 
                                type: Type.OBJECT,
                                properties: {
                                    score: { type: Type.INTEGER },
                                    justification: { type: Type.STRING, nullable: true }
                                },
                                required: ["score", "justification"]
                            },
                            sentenceStructure: {
                                type: Type.OBJECT,
                                properties: {
                                    score: { type: Type.INTEGER },
                                    justification: { type: Type.STRING, nullable: true }
                                },
                                required: ["score", "justification"]
                            },
                            spellingAndPunctuation: {
                                type: Type.OBJECT,
                                properties: {
                                    score: { type: Type.INTEGER },
                                    justification: { type: Type.STRING, nullable: true }
                                },
                                required: ["score", "justification"]
                             },
                            total: { type: Type.INTEGER }
                        },
                        required: ["paragraphs", "grammar", "sentenceStructure", "spellingAndPunctuation", "total"]
                    },
                    goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvementArea: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                mistake: { type: Type.STRING },
                                correction: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                             required: ["mistake", "correction", "explanation"]
                        }
                    }
                },
                required: ["scores", "goodPoints", "improvementArea"]
            }
        }
    });
    return parseJsonResponse<WritingFeedback>(response.text!, 'Writing Feedback');
};

export const checkBrainstormCoherence = async (brainstorm: { who: string; where: string; what: string; feelings: string; }, narrative: string, gradeLevel: string): Promise<BrainstormCoherenceFeedback> => {
    const prompt = `
        Analyze if a student's personal narrative aligns with their initial brainstorm.
        The student is in ${gradeLevel}. Feedback should be simple, encouraging, and specific.

        **Brainstorm Details:**
        - Who was there? "${brainstorm.who}"
        - Where did it happen? "${brainstorm.where}"
        - What happened? "${brainstorm.what}"
        - How did you feel? "${brainstorm.feelings}"

        **Student's Narrative:**
        "${narrative}"

        **Evaluation Rubric:**
        1.  **Coherence Score (1-5):**
            *   5: All brainstorm points are clearly and explicitly included in the narrative.
            *   4: Most brainstorm points are included. One might be missing or vague.
            *   3: Some key points are included, but others are missing or the connection is weak.
            *   2: Only one or two points from the brainstorm are loosely connected.
            *   1: The narrative does not seem to follow the brainstorm at all.

        **OUTPUT FORMAT (JSON):**
        Provide feedback in a strict JSON format:
        1.  'coherenceScore': A score from 1-5 based on the rubric.
        2.  'positiveFeedback': A short, encouraging sentence about what they did well. (e.g., "Great job including the part about the park!").
        3.  'improvementSuggestion': If the score is below 5, provide a simple suggestion. (e.g., "It's a wonderful story! Maybe you could also write about how you felt happy at the end?"). If the score is 5, this should be null.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    coherenceScore: { type: Type.INTEGER },
                    positiveFeedback: { type: Type.STRING },
                    improvementSuggestion: { type: Type.STRING, nullable: true }
                },
                required: ["coherenceScore", "positiveFeedback", "improvementSuggestion"]
            }
        }
    });
    return parseJsonResponse<BrainstormCoherenceFeedback>(response.text!, 'Brainstorm Coherence Feedback');
};

export const checkLetterWriting = async (text: string, gradeLevel: string): Promise<LetterWritingFeedback> => {
    const prompt = `
        Analyze the following text, which is supposed to be a friendly letter from a ${gradeLevel} student. Evaluate it based on the standard 5 parts of a letter, paying close attention to their **content, placement, and most importantly, their sequence**. Your feedback should be simple, encouraging, and clear.

        **EVALUATION CRITERIA (Strictly follow this structure):**
        The 5 parts of a friendly letter MUST appear in this exact order:
        1.  **Heading** (Date)
        2.  **Greeting** (e.g., "Dear Mom,")
        3.  **Body** (The main message)
        4.  **Closing** (e.g., "Your friend,")
        5.  **Signature** (Your name)

        Now, evaluate each part:

        1.  **Heading:**
            *   **Sequence & Placement:** Must be at the very beginning of the text.
            *   **Content:** Must contain a date (e.g., "October 26, 2024").

        2.  **Greeting:**
            *   **Sequence & Placement:** Must come *directly after* the heading, usually separated by a blank line.
            *   **Content:** Must be a proper salutation like "Dear [Name]," and MUST end with a comma.

        3.  **Body:**
            *   **Sequence & Placement:** Must be the main block of text *after* the greeting and *before* the closing.
            *   **Content:** Must contain the main message of the letter.

        4.  **Closing:**
            *   **Sequence & Placement:** Must come *after* the body, on its own line.
            *   **Content:** Must be a standard closing like "Your friend," or "Sincerely,". It must be capitalized and end with a comma.

        5.  **Signature:**
            *   **Sequence & Placement:** Must be the very last part of the letter, on the line *after* the closing.
            *   **Content:** It must be a person's name (the writer's name). It should NOT be the literal word "Signature".

        **OUTPUT FORMAT (JSON):**
        Provide feedback in a strict JSON format.

        1.  'partsFeedback': An array of 5 objects, one for each letter part ('Heading', 'Greeting', 'Body', 'Closing', 'Signature'). For each part, provide:
            *   'part': The name of the part.
            *   'status': 'Correct', 'Needs Improvement', 'or 'Missing'.
            *   'comment': A simple, one-sentence feedback comment. For 'Needs Improvement', specify exactly what is wrong. **If a part is in the wrong place, the comment MUST state that.** For example: "The closing should come after the body of the letter." or "The heading should be at the very top."

        2.  'improvementArea': An array of specific mistakes found anywhere in the letter (spelling, punctuation, capitalization). For each mistake, provide:
            *   'mistake': The incorrect word or phrase.
            *   'correction': The corrected version.
            *   'explanation': A simple reason for the change. If no mistakes, return an empty array.

        3.  'overallComment': A single, encouraging summary sentence for the student.

        Text to analyze:
        "${text}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    partsFeedback: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                part: { type: Type.STRING, enum: ['Heading', 'Greeting', 'Body', 'Closing', 'Signature'] },
                                status: { type: Type.STRING, enum: ['Correct', 'Needs Improvement', 'Missing'] },
                                comment: { type: Type.STRING }
                            },
                            required: ["part", "status", "comment"]
                        }
                    },
                    improvementArea: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                mistake: { type: Type.STRING },
                                correction: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                             required: ["mistake", "correction", "explanation"]
                        }
                    },
                    overallComment: { type: Type.STRING }
                },
                required: ["partsFeedback", "improvementArea", "overallComment"]
            }
        }
    });
    return parseJsonResponse<LetterWritingFeedback>(response.text!, 'Letter Writing Feedback');
};


export const generateReadingPassage = async (skill: string, level: ReadingLevel, gradeLevel: string): Promise<ReadingPassage> => {
  let passageLength = '';
  let questionCount = 0;

  switch (level) {
    case 'Beginner':
      passageLength = '2-3 sentences';
      questionCount = 2;
      break;
    case 'Intermediate':
      passageLength = '4-6 sentences';
      questionCount = 3;
      break;
    case 'Advanced':
      passageLength = '7-9 sentences';
      questionCount = 4;
      break;
  }

  const prompt = `
    Create a short, engaging reading passage for a ${gradeLevel} student.
    The passage must be culturally and contextually appropriate for a young student living in the Middle East, specifically Saudi Arabia. You can include themes like desert landscapes, camels, traditional foods like dates, family gatherings, or simple references to cities like Riyadh or Jeddah. The tone should be positive and relatable.

    The passage should be around ${passageLength} long.

    After the passage, create exactly ${questionCount} multiple-choice questions to test the reading skill: "${skill}".
    Each question must have 3 or 4 options and only one clearly correct answer.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                passage: { type: Type.STRING },
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: {type: Type.STRING, enum: [QuizQuestionType.MULTIPLE_CHOICE]},
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswer: { type: Type.STRING }
                        },
                        required: ["type", "question", "options", "correctAnswer"]
                    }
                }
            },
            required: ["passage", "questions"]
        }
    }
  });
  return parseJsonResponse<ReadingPassage>(response.text!, 'Reading Passage');
};

export const generateGrammarQuiz = async (topic: string, gradeLevel: string): Promise<QuizQuestion[]> => {
    const prompt = `
        You are an expert at creating educational quizzes in a strict JSON format.
        Your task is to generate a 10-question, multiple-choice quiz for a ${gradeLevel} student on the grammar topic: "${topic}".

        **CRITICAL INSTRUCTIONS:**
        1.  Your output MUST be a single, valid JSON array containing exactly 10 question objects.
        2.  Do NOT add any text or markdown (like \`\`\`json) before or after the JSON array.
        3.  Every single question must be a multiple-choice question.
        4.  Each question should have 3 or 4 options.
        5.  **NO AMBIGUITY:** Each question must have only ONE clearly correct answer. Avoid questions where multiple options could be considered correct. For example, if asking to identify a plural noun in a sentence like "The girls played with their toys," do not create a situation where both "girls" and "toys" are possible correct answers but only one is accepted. Ensure all incorrect options are definitively wrong.
        6.  For each question, provide a simple 'explanation' for why the correct answer is correct. This should be easy for a young student to understand.
        7.  Pay close attention to JSON syntax, especially commas, quotes, and brackets.

        Here is the required JSON object structure. Follow it precisely for all 10 questions:

        {
          "type": "MULTIPLE_CHOICE",
          "question": "Which sentence is correct?",
          "options": ["She run fast.", "She runs fast.", "She running fast."],
          "correctAnswer": "She runs fast.",
          "explanation": "The subject 'She' is singular, so the verb needs an '-s' ending in the present tense."
        }

        Now, generate the JSON array for the topic "${topic}".
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: [QuizQuestionType.MULTIPLE_CHOICE] },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["type", "question", "options", "correctAnswer", "explanation"]
                }
            }
        }
    });

    return parseJsonResponse<QuizQuestion[]>(response.text!, 'Grammar Quiz');
};

export type CVCDifficulty = 'simple' | 'medium' | 'hard';

export const generateCVCWords = async (count: number, difficulty: CVCDifficulty): Promise<CVCWord[]> => {
    const prompt = `
        Generate ${count} CVC (consonant-vowel-consonant) words for a child learning to read.
        Difficulty: ${difficulty}.
        'simple': common words like cat, dog, sun.
        'medium': slightly less common words like "bib", "fog".
        'hard': include blends or digraphs if possible like "chip" or "shop" but still simple.
        For each word, provide a simple 'image_prompt' for an AI image generator (e.g., for 'cat', the prompt could be 'A happy cartoon cat').
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    words: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                image_prompt: { type: Type.STRING }
                            },
                            required: ["word", "image_prompt"]
                        }
                    }
                },
                required: ["words"]
            }
        }
    });
    const result = parseJsonResponse<{words: CVCWord[]}>(response.text!, 'CVC Words');
    return result.words;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error('No image was generated.');
};

export const generateSpeech = async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
        console.warn("generateSpeech called with empty text.");
        return ""; // Return empty string to prevent API error
    }
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio content generated.");
    }
    return base64Audio;
};


export type Difficulty = 'starter' | 'growing' | 'leaping';

export const generateSentenceScramble = async (count: number, difficulty: Difficulty, gradeLevel: string): Promise<ScrambledSentence[]> => {
    const prompt = `
        Create ${count} sentence scramble puzzles for a ${gradeLevel} student.
        Difficulty: ${difficulty}.
        'starter': 3-4 word sentences.
        'growing': 4-6 word sentences.
        'leaping': 6-8 word sentences with more complex structure.
        For each, provide the 'scrambled' words in an array and the 'correct' sentence as a string.
        The correct sentence should have proper capitalization and punctuation.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sentences: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scrambled: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correct: { type: Type.STRING }
                            },
                            required: ["scrambled", "correct"]
                        }
                    }
                },
                required: ["sentences"]
            }
        }
    });
    const result = parseJsonResponse<{sentences: ScrambledSentence[]}>(response.text!, 'Sentence Scramble');
    return result.sentences;
};

export const generateKsaParagraphComprehension = async (difficulty: Difficulty, gradeLevel: string): Promise<ParagraphComprehensionContent> => {
    const prompt = `
        Create a single, short paragraph for a ${gradeLevel} student to read.
        Difficulty: ${difficulty}.
        'starter': 2-3 simple sentences.
        'growing': 3-4 sentences with slightly more complex vocabulary.
        'leaping': 4-5 sentences, might include a slightly more abstract concept.
        After the paragraph, create 3 multiple-choice questions about it. Each question should have 4 options.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    passage: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswer"]
                        }
                    }
                },
                required: ["passage", "questions"]
            }
        }
    });
    return parseJsonResponse<ParagraphComprehensionContent>(response.text!, 'Paragraph Comprehension');
};

export const checkForProfanity = async (text: string): Promise<boolean> => {
    const prompt = `
        Does the following text contain any profane, inappropriate, or hateful content for a young child?
        Respond with only "true" or "false".

        Text: "${text}"
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text?.trim().toLowerCase() === 'true';
};

export const checkLearnToWrite = async (
    text: string,
    prompt: string,
    sentenceCount: number | undefined,
    category: string,
    gradeLevel: string,
): Promise<LearnToWriteFeedback> => {
    const promptForAI = `
        You are an AI teacher evaluating a ${gradeLevel} student's writing.
        The student was given this prompt: "${prompt}".
        The writing category is: "${category}".
        The target sentence count for the body was: ${sentenceCount || 'not specified'}.

        Evaluate the student's text based on these criteria:
        1.  **Relevance:** Does the text follow the prompt?
        2.  **Completeness:** Does it meet the target sentence count?
        3.  **Basic Grammar/Spelling:** Are there any glaring errors for this age level?

        **Evaluation:**
        -   'isPassing': This should be 'true' only if the text is clearly relevant to the prompt AND meets the sentence count. Otherwise, 'false'.
        -   'encouragingMessage': A short, positive message. If it's passing, congratulate them. If not, encourage them to try again.
        -   'improvement': If it's NOT passing, provide ONE specific 'ImprovementItem' object with a 'mistake', 'correction', and 'explanation'. If it IS passing, this should be 'null'. The improvement should be the MOST important thing for the student to fix.

        **Student's Text:**
        "${text}"

        **Output Format (Strict JSON):**
        Provide your feedback in a strict JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptForAI,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isPassing: { type: Type.BOOLEAN },
                    encouragingMessage: { type: Type.STRING },
                    improvement: {
                        type: Type.OBJECT,
                        properties: {
                            mistake: { type: Type.STRING },
                            correction: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        },
                        required: ["mistake", "correction", "explanation"],
                        nullable: true
                    }
                },
                required: ["isPassing", "encouragingMessage", "improvement"]
            }
        }
    });

    return parseJsonResponse<LearnToWriteFeedback>(response.text!, 'Learn to Write Feedback');
};

export const generateWritingTask = async (category: string, level: LearnToWriteLevel, taskNumber: number, totalTasks: number, gradeLevel: string): Promise<WritingTask> => {
  const letterWritingInstruction = category === 'Letter Writing'
    ? `IMPORTANT: For 'exampleText', you MUST generate a complete, properly formatted letter. It must include a date in the top-left corner (e.g., 'October 26, 2024'), a salutation, body, closing, and signature, each separated by newline characters. Use double newlines for paragraph breaks. For example: "October 26, 2024\\n\\nDear Sam,\\n\\nI went to the zoo today. I saw a big lion!\\n\\nYour friend,\\nMaria"`
    : `For 'exampleText', generate a short, simple, well-written example of the writing style.`;

  const prompt = `
    Generate a structured writing task for a ${gradeLevel} student who is learning English. The content should be culturally neutral and globally relatable.
    Category: "${category}"
    Level: "${level}"
    This is task ${taskNumber} out of ${totalTasks} for this level. The tasks should progressively get slightly more challenging.
    
    Provide:
    1. 'title': A fun, short title for the task.
    2. 'exampleText': ${letterWritingInstruction} This example should be a model answer for a similar, but not identical, prompt.
    3. 'prompt': A clear, simple prompt for what the student should write.
    4. 'visualPrompt': A simple phrase for an AI image generator to create a helpful, friendly sketch (e.g., "A happy dog playing with a red ball").
    5. 'guidingQuestions': An array of 3 simple questions to help the student think about what to write.
    6. 'sentenceCount': A target number of sentences the student should aim to write for the body of the text. For 'Beginner' level, this should be 2-3. For 'Intermediate', 3-4. For 'Advanced', 4-5. The body of the 'exampleText' should also contain this number of sentences.
  `;
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  title: { type: Type.STRING },
                  exampleText: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  guidingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sentenceCount: { type: Type.INTEGER }
              },
              required: ["title", "exampleText", "prompt", "visualPrompt", "guidingQuestions", "sentenceCount"]
          }
      }
  });
  return parseJsonResponse<WritingTask>(response.text!, 'Writing Task');
};

export const generatePracticeWorksheet = async (text: string, feedback: WritingFeedback, gradeLevel: string): Promise<PracticeWorksheet> => {
    const prompt = `
        You are an encouraging and helpful AI teacher for a ${gradeLevel} student.
        The student has just written a personal narrative and scored poorly. Their writing and the detailed feedback are provided below.
        Your task is to generate a simple, personalized practice worksheet in a strict JSON format to help them improve.

        **Student's Text:**
        "${text}"

        **Detailed Feedback Received by Student:**
        ${JSON.stringify(feedback, null, 2)}

        **INSTRUCTIONS FOR WORKSHEET GENERATION:**
        1.  Analyze the 'scores' object in the feedback.
        2.  For **each category** ('paragraphs', 'grammar', 'sentenceStructure', 'spellingAndPunctuation') where the score is less than 4 out of 5, you MUST create a small, targeted practice exercise.
        3.  **The content MUST be very simple, brief, and suitable for the student's grade level. Do not use too many words. Be concise.**
        4.  Each practice section must have:
            - A very short note (one sentence).
            - A single example of the student's mistake and the correction.
            - **ONE** fun, **numbered** practice question. The numbering should be sequential across the whole worksheet (1., 2., 3., etc.).
        5.  The generated content should be clean, well-structured, and print-friendly, suitable for a .doc file.

        **OUTPUT FORMAT (Strict JSON):**
        Provide your response in a strict JSON format with two keys:

        1.  **"guidelines"**: An array of 2-3 simple, encouraging sentences summarizing the main areas to focus on. These will be shown on the screen.
            Example: ["Let's work on making our paragraphs clearer.", "We can also practice using capital letters correctly."]

        2.  **"worksheetContent"**: A single string containing the full text for a downloadable, print-friendly practice worksheet.
            **CRITICAL FORMATTING RULES:**
            - **ABSOLUTELY NO MARKDOWN:** Do not use asterisks (*), hashes (#), or any other markdown formatting. Use plain text for everything.
            - **DOUBLE SPACING:** Use double newlines (\\n\\n) to separate all paragraphs, headings, and sections for a clean, readable layout.
            - **HEADINGS:** The main heading 'My Writing Practice Sheet' should be left-aligned. Use simple text-based separators for section headings, like "--- Practice: [Topic] ---".
            - **WRITING LINES:** For practice questions where the student needs to write, provide a long, solid underline like this: "____________________".
            - **FINAL NOTE:** At the very end of the worksheet, you MUST add a new section titled "--- Next Steps ---" that contains the note: "After you finish your practice, rewrite your story and give it to your teacher. Great job!".

        **Example for "worksheetContent" string (follow these rules exactly):**
        "My Writing Practice Sheet\\n\\n================================\\n\\nHi there! Let's practice a few things to make your next story amazing!\\n\\n--- Practice: Paragraphs ---\\n\\nA good story needs a clear beginning, middle, and end.\\n\\nYour mistake: All the sentences were in one big block.\\n\\nLet's try: Separate your ideas into at least three paragraphs.\\n\\n1. Write one sentence that could start a story.\\n\\n____________________\\n\\n--- Practice: Spelling ---\\n\\nRemember to check your spelling for tricky words.\\n\\nYou wrote: \\"My dog is funy.\\"\\n\\nCorrection: \\"My dog is funny.\\"\\n\\n2. Write a sentence using the word 'funny'.\\n\\n____________________\\n\\n--- Next Steps ---\\n\\nAfter you finish your practice, rewrite your story and give it to your teacher. Great job!"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    guidelines: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    worksheetContent: { type: Type.STRING }
                },
                required: ["guidelines", "worksheetContent"]
            }
        }
    });
    return parseJsonResponse<PracticeWorksheet>(response.text!, 'Practice Worksheet');
};

export const detectAIGeneratedText = async (text: string, gradeLevel: string): Promise<AIDetectionResult> => {
    const prompt = `
        Analyze the following text written by a student to determine if it was generated by an AI.
        The student is in ${gradeLevel}, so their writing should be simple. Look for overly complex vocabulary, perfect sentence structures, and a lack of common childhood errors.

        **Evaluation Criteria:**
        1.  **isAI (boolean):** 'true' if you are reasonably confident it's AI-generated, otherwise 'false'.
        2.  **confidence (number):** A score from 0.0 to 1.0 representing your confidence in the 'isAI' conclusion.
        3.  **reason (string):** A single, simple sentence explaining your reasoning. For example: "The text uses complex words like 'subsequently' and 'eloquent' which are unusual for a third grader." or "The writing style and simple mistakes are consistent with a human learner."

        **Text to Analyze:**
        "${text}"

        **OUTPUT FORMAT (Strict JSON):**
        Provide your feedback in a strict JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isAI: { type: Type.BOOLEAN },
                    confidence: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                },
                required: ["isAI", "confidence", "reason"]
            }
        }
    });
    return parseJsonResponse<AIDetectionResult>(response.text!, 'AI Detection Result');
};

export const generateLeveledText = async (text: string, gradeLevel: string, suggestions?: string): Promise<LeveledTextWithVocabulary> => {
    const prompt = `
        You are an expert in educational content for a ${gradeLevel} student.
        A teacher has provided the following text.
        
        **Your task is two-fold:**
        1.  Rewrite the original text into three distinct versions: "low", "medium", and "gradeSpecific".
        2.  For each of those three new versions, extract an array of 3-5 key vocabulary words and provide a simple, one-sentence definition for each word, suitable for a young learner.

        **Rewriting Instructions:**
        -   **low:** Simplify vocabulary and sentence structure significantly. Use very short sentences.
        -   **medium:** Rewrite the text to be clear and straightforward. Use common vocabulary.
        -   **gradeSpecific:** Rewrite the text to be appropriate for a typical ${gradeLevel} student.
        ${suggestions ? `The user has provided the following suggestions, which you must follow: "${suggestions}"` : ''}

        **Original Text:**
        "${text}"

        **OUTPUT FORMAT (Strict JSON):**
        Provide your response in a strict JSON format. The top-level object must have two keys: "leveledPassages" and "vocabulary".
        -   "leveledPassages" should be an object with keys "low", "medium", and "gradeSpecific", containing the rewritten text.
        -   "vocabulary" should be an object with keys "low", "medium", and "gradeSpecific", where each contains an array of objects. Each object in the array should have a "word" and a "definition".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    leveledPassages: {
                        type: Type.OBJECT,
                        properties: {
                            low: { type: Type.STRING },
                            medium: { type: Type.STRING },
                            gradeSpecific: { type: Type.STRING }
                        },
                        required: ["low", "medium", "gradeSpecific"]
                    },
                    vocabulary: {
                        type: Type.OBJECT,
                        properties: {
                            low: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        definition: { type: Type.STRING }
                                    },
                                    required: ["word", "definition"]
                                }
                            },
                            medium: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        definition: { type: Type.STRING }
                                    },
                                    required: ["word", "definition"]
                                }
                            },
                            gradeSpecific: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        word: { type: Type.STRING },
                                        definition: { type: Type.STRING }
                                    },
                                    required: ["word", "definition"]
                                }
                            }
                        },
                        required: ["low", "medium", "gradeSpecific"]
                    }
                },
                required: ["leveledPassages", "vocabulary"]
            }
        }
    });
    return parseJsonResponse<LeveledTextWithVocabulary>(response.text!, 'Leveled Text with Vocabulary');
};

export const generateQuizForPassage = async (passage: string, gradeLevel: string): Promise<QuizQuestion[]> => {
    const prompt = `
        You are an expert at creating reading comprehension quizzes for a ${gradeLevel} student.
        Based on the following passage, generate exactly 6 multiple-choice questions.

        **CRITICAL INSTRUCTIONS:**
        1. Your output MUST be a single, valid JSON array containing exactly 6 question objects.
        2. Do NOT add any text or markdown (like \`\`\`json) before or after the JSON array.
        3. Every question must be a multiple-choice question.
        4. Each question must have 3 or 4 options.
        5. Each question must have only ONE clearly correct answer directly supported by the passage.
        6. **Crucially, for each question, you MUST add a "skill" property.** The value of "skill" must be one of the following strings: "Main Idea", "Detail", "Vocabulary in Context", or "Inference".
        7. The questions should test comprehension of the passage, not general knowledge.

        **Passage to Analyze:**
        "${passage}"

        **Required JSON object structure (for each of the 6 questions):**
        {
          "type": "MULTIPLE_CHOICE",
          "skill": "Main Idea",
          "question": "What is the main idea of the passage?",
          "options": ["Option A", "Option B", "Option C"],
          "correctAnswer": "Option B"
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: [QuizQuestionType.MULTIPLE_CHOICE] },
                        skill: { type: Type.STRING, enum: ["Main Idea", "Detail", "Vocabulary in Context", "Inference"] },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING }
                    },
                    required: ["type", "skill", "question", "options", "correctAnswer"]
                }
            }
        }
    });

    return parseJsonResponse<QuizQuestion[]>(response.text!, 'Quiz for Passage');
};

export const getWordDefinition = async (word: string, gradeLevel: string): Promise<WordDefinition> => {
    const prompt = `
        Provide a simple definition for the word "${word}" that a ${gradeLevel} student can easily understand.

        **OUTPUT FORMAT (Strict JSON):**
        Provide your response in a strict JSON format with three keys:
        1. "word": The original word.
        2. "partOfSpeech": The part of speech (e.g., "Noun", "Verb", "Adjective").
        3. "definition": A very simple, one-sentence definition suitable for a child.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    definition: { type: Type.STRING }
                },
                required: ["word", "partOfSpeech", "definition"]
            }
        }
    });
    return parseJsonResponse<WordDefinition>(response.text!, 'Word Definition');
};

export const translateText = async (text: string, targetLanguage: string): Promise<TranslatedText> => {
    const prompt = `
        Translate the following English text into ${targetLanguage}.
        Provide only the translated text in your response.

        **Text to Translate:**
        "${text}"
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translatedText: { type: Type.STRING },
                },
                required: ["translatedText"]
            }
        }
    });
    return parseJsonResponse<TranslatedText>(response.text!, 'Translated Text');
};

export const generateRichVocabularyCard = async (word: string, gradeLevel: string): Promise<Omit<VocabularyLessonCard, 'imageUrl'>> => {
    const prompt = `
        You are an expert curriculum designer for young English language learners (${gradeLevel}).
        Your task is to create a rich, clear "teaching card" for a single vocabulary word.

        **Word:** "${word}"

        **CRITICAL INSTRUCTIONS:**
        1.  **meaning:** Provide a very simple, one-sentence definition a child can easily understand.
        2.  **form:** State the word type (e.g., "Noun", "Verb", "Adjective").
        3.  **structure:** Provide a simple, one-sentence explanation of how the word is typically used in a sentence. For a noun: "You can see a [word] or have a [word]." For a verb: "You can [word] something." For an adjective: "Something can be [word]."
        4.  **contextSentences:** Provide an array of TWO distinct, simple sentences using the word in a clear context.
        5.  **imagePrompt:** Provide a simple but descriptive prompt for an AI image generator to create a relevant, kid-friendly cartoon image. Example: "A cute, cartoon camel walking in the desert with a happy smile."

        **OUTPUT FORMAT (Strict JSON):**
        Provide your response in a strict JSON format. Do not add any text or markdown before or after the JSON object.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    form: { type: Type.STRING },
                    structure: { type: Type.STRING },
                    contextSentences: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                },
                required: ["word", "meaning", "form", "structure", "contextSentences", "imagePrompt"]
            }
        }
    });
    return parseJsonResponse<Omit<VocabularyLessonCard, 'imageUrl'>>(response.text!, 'Rich Vocabulary Card');
};

export const generateVocabularyQuiz = async (cards: VocabularyLessonCard[], gradeLevel: string, numQuestions: number, questionTypes: QuizQuestionType[]): Promise<QuizQuestion[]> => {
    const wordList = cards.map(card => `"${card.word}": ${card.meaning}`).join(', ');
    const availableTypes = questionTypes.join(', ');

    const prompt = `
        You are an expert quiz creator for ${gradeLevel} students.
        Based on the following list of vocabulary words and their meanings, create a quiz with exactly ${numQuestions} questions.

        **Vocabulary List:**
        {${wordList}}

        **CRITICAL INSTRUCTIONS:**
        1.  Your output MUST be a valid JSON array of question objects.
        2.  You must generate exactly ${numQuestions} questions.
        3.  The question types should be a mix of the following: [${availableTypes}].
        4.  Each question must test the meaning or usage of one word from the list.
        5.  For 'MULTIPLE_CHOICE' questions, provide 4 plausible options, with only one being correct. The 'options' property is required.
        6.  For 'TRUE_FALSE' questions, the 'correctAnswer' must be either "True" or "False". The 'options' property must NOT be included.
        7.  Do not include an 'explanation' field.

        **Required JSON object structures:**
        For MULTIPLE_CHOICE:
        {
          "type": "MULTIPLE_CHOICE",
          "question": "What does the word 'brave' mean?",
          "options": ["Being scared", "Not afraid of danger", "Feeling tired", "Being very smart"],
          "correctAnswer": "Not afraid of danger"
        }
        For TRUE_FALSE:
        {
          "type": "TRUE_FALSE",
          "question": "True or False: The word 'huge' means very small.",
          "correctAnswer": "False"
        }

        Now, generate the JSON array for the provided vocabulary list with ${numQuestions} questions.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: Object.values(QuizQuestionType) },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                        correctAnswer: { type: Type.STRING }
                    },
                    required: ["type", "question", "correctAnswer"]
                }
            }
        }
    });

    return parseJsonResponse<QuizQuestion[]>(response.text!, 'Vocabulary Quiz');
};

export const generateSupportPhrase = async (language: string, context: string = "classroom participation"): Promise<string> => {
    const prompt = `
        You are a helpful teaching assistant.
        Generate a short, encouraging phrase or simple instruction in ${language} for a Grade 3 student.
        Context: ${context}.
        Provide ONLY the phrase in ${language}, followed by the English pronunciation in parentheses, and then the English meaning.
        Example format: "Phrase in Language (Pronunciation) - English Meaning"
    `;
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || "";
}