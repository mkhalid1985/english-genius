export interface Student {
  name: string;
  section: string;
}

export type View = 'landing' | 'studentDashboard' | 'sessionSetup' | 'menu' | 'writing' | 'grammar' | 'reading' | 'participationReport' | 'coverTheBasics' | 'learnToWrite' | 'guidedWriting' | 'adminLogin' | 'adminConsole' | 'textLeveler' | 'vocabulary' | 'spellingStation' | 'diaryLog' | 'baselineTest';

export type ModuleId = 'writing' | 'grammar' | 'reading' | 'coverTheBasics' | 'learnToWrite' | 'guidedWriting' | 'textLeveler' | 'vocabulary' | 'spellingStation' | 'diaryLog';

export interface SessionInfo {
    date: string;
    day: string;
    period: number;
    grade: 'Grade 3 O' | 'Grade 3 P';
}

export interface ParticipationRecord {
    id: string; // ISO timestamp
    studentName: string;
    grade: 'Grade 3 O' | 'Grade 3 P';
    date: string; // YYYY-MM-DD
    day: string;
    period: number;
    timestamp: number;
    durationSeconds?: number;
    score?: number; // New field for calculated points
    isCorrect?: boolean;
}


export interface ImprovementItem {
  mistake: string;
  correction: string;
  explanation: string;
}

export interface AIDetectionResult {
  isAI: boolean;
  confidence: number; // e.g., 0.85 for 85%
  reason: string;
}

export interface PracticeWorksheet {
  guidelines: string[]; // Simple tips to show on the screen
  worksheetContent: string; // Pre-formatted text for the downloadable .txt file
}

export interface ActivityRecord {
  id: string;
  studentName: string;
  studentSection: string;
  date: string;
  activityType: 'Writing' | 'Grammar' | 'Reading' | 'Cover the Basics' | 'Learn to Write' | 'Guided Writing' | 'Vocabulary' | 'Spelling' | 'Baseline' | 'Cover the Basics' | 'Learn to Write';
  category: string;
  score: number;
  total: number;
  improvementArea?: ImprovementItem[];
  submittedText?: string;
  timeSpentSeconds?: number;
  skillScores?: { [key: string]: { correct: number; total: number } };
}

export interface WritingFeedback {
  scores: {
    paragraphs: { score: number; justification: string | null };
    grammar: { score: number; justification: string | null };
    sentenceStructure: { score: number; justification: string | null };
    spellingAndPunctuation: { score: number; justification: string | null };
    total: number;
  };
  goodPoints: string[];
  improvementArea: ImprovementItem[];
}

export interface BrainstormCoherenceFeedback {
  coherenceScore: number; // Score from 1-5 on how well the story matches the brainstorm
  positiveFeedback: string; // Encouraging message
  improvementSuggestion: string | null; // Suggestion for better alignment
}


export interface LetterPartFeedback {
    part: 'Heading' | 'Greeting' | 'Body' | 'Closing' | 'Signature';
    status: 'Correct' | 'Needs Improvement' | 'Missing';
    comment: string;
}

export interface LetterWritingFeedback {
    partsFeedback: LetterPartFeedback[];
    improvementArea: ImprovementItem[];
    overallComment: string;
}

export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  DRAG_AND_DROP = 'DRAG_AND_DROP',
  MATCHING = 'MATCHING',
}

export interface MatchSet {
  prompt: string;
  match: string;
}

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  choices?: string[];
  sentenceParts?: string[];
  matchSet?: MatchSet[];
  matchOptions?: string[];
  explanation?: string;
  skill?: string;
}

export type ReadingLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ReadingPassage {
  passage: string;
  questions: QuizQuestion[];
}

export interface CVCWord {
  word: string;
  image_prompt: string;
  imageUrl?: string;
  audio?: string;
}

export interface ScrambledSentence {
  scrambled: string[];
  correct: string;
}

export interface ParagraphComprehensionContent {
  passage: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export type LearnToWriteLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface WritingTask {
  title: string;
  exampleText: string;
  prompt: string;
  visualPrompt: string;
  guidingQuestions: string[];
  sentenceCount?: number;
}

export interface LearnToWriteFeedback {
  isPassing: boolean;
  encouragingMessage: string;
  improvement: ImprovementItem | null;
}

export interface PersonalNarrativeLevel {
    level: number;
    title: string;
    prompt: string;
    example: {
        brainstorm: {
            who: string;
            where: string;
            what: string;
            feelings: string;
        };
        narrative: string;
    };
    secretKey: {
        word: string;
        question: string;
    };
}

export interface LetterWritingLevel {
    level: number;
    title: string;
    prompt: string;
    example: {
        heading: string;
        greeting: string;
        body: string;
        closing: string;
        signature: string;
    };
    secretKey: {
        word: string;
        question: string;
    };
}

export interface LeveledText {
  low: string;
  medium: string;
  gradeSpecific: string;
}

export interface VocabularyItem {
    word: string;
    definition: string;
}

export interface LeveledTextWithVocabulary {
    leveledPassages: LeveledText;
    vocabulary: {
        low: VocabularyItem[];
        medium: VocabularyItem[];
        gradeSpecific: VocabularyItem[];
    };
}

export interface CustomReadingActivity {
  id: string;
  title: string;
  leveledPassages: LeveledText;
  vocabulary: {
    low: VocabularyItem[];
    medium: VocabularyItem[];
    gradeSpecific: VocabularyItem[];
  };
  quizzes: {
    low: QuizQuestion[];
    medium: QuizQuestion[];
    gradeSpecific: QuizQuestion[];
  };
}

export interface WordDefinition {
    word: string;
    definition: string;
    partOfSpeech: string;
}

export interface TranslatedText {
    translatedText: string;
}

export interface VocabularyLessonCard {
    word: string;
    meaning: string;
    form: string;
    structure: string;
    contextSentences: string[];
    imagePrompt: string;
    imageUrl?: string; // To be populated after generation
}

export interface VocabularyLesson {
    id: string;
    title: string;
    cards: VocabularyLessonCard[];
    quiz?: QuizQuestion[];
}

interface CoverTheBasicsLevel {
    id: string;
    name: string;
    sessions: number;
    dependency: string | null;
    enabled: boolean;
}

interface CoverTheBasicsCategory {
    id: string;
    name: 'CVC Words' | 'Sentence Scramble' | 'Paragraph Comprehension';
    description: string;
    enabled: boolean;
    levels: CoverTheBasicsLevel[];
}

export interface StudentProfile {
    name: string;
    needsSupport: boolean;
    isSpecialNeeds?: boolean; // New: for weighted selection
    primaryLanguage: string;
    baselineTaken?: boolean;
    masteryLevel?: 'Needs Support' | 'Developing' | 'Mastery';
}

export interface ContentAssignment {
    id: string;
    moduleId: string; // generic module ID or custom activity ID
    activityType: 'module' | 'custom-reading' | 'custom-vocabulary' | 'leveled-text';
    studentName: string;
    contentPayload?: string; // For leveled text specifically
    accessCode?: string; // Optional code
    dateAssigned: string;
    activityId?: string; // Link to specific CustomActivity ID
}

export interface Curriculum {
    gradeLevel: string;
    appName: string;
    grammarTopics: string[];
    readingSkills: string[];
    learnToWriteCategories: string[];
    coverTheBasics: CoverTheBasicsCategory[];
    guidedWriting: {
        personalNarrativeLevels: PersonalNarrativeLevel[];
        letterWritingLevels: LetterWritingLevel[];
    };
    featureToggles: {
        writingChecker: boolean;
        grammarPractice: boolean;
        readingComprehension: boolean;
        coverTheBasics: boolean;
        learnToWrite: boolean;
        guidedWriting: boolean;
        textLeveler: boolean;
        reportCard: boolean;
        vocabularyPractice: boolean;
        spellingStation: boolean;
        diaryLog: boolean;
    };
    classroomSettings: {
        enableLeaderboard: boolean;
    };
    customReadingActivities: CustomReadingActivity[];
    customVocabularyLessons: VocabularyLesson[];
    studentProfiles: StudentProfile[];
    assignments: ContentAssignment[];
}

export interface DiaryEntry {
  id: string;
  sessionInfo: SessionInfo;
  participationCount: number;
  totalStudents: number;
  participationPercentage: number;
  records: ParticipationRecord[];
}

export interface MasteryGroup {
    groupName: 'Mastery' | 'Developing' | 'Needs Support';
    students: string[];
    color: string;
}

export interface BaselineResult {
    level: 'Needs Support' | 'Developing' | 'Mastery';
    quizScore: number;
    writingText: string;
}