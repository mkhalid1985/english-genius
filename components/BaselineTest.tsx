import React, { useState } from 'react';
import { ActivityRecord, QuizQuestion, QuizQuestionType, BaselineResult } from '../types';
import { CheckCircleIcon } from './common/Icons';

interface BaselineTestProps {
    studentName: string;
    onComplete: (results: BaselineResult) => void;
    logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const BASELINE_QUESTIONS: QuizQuestion[] = [
    {
        type: QuizQuestionType.MULTIPLE_CHOICE,
        question: "Identify the noun in this sentence: 'The cat sleeps.'",
        options: ["The", "cat", "sleeps"],
        correctAnswer: "cat",
        skill: "Nouns",
        explanation: "A noun is a person, place, or thing."
    },
    {
        type: QuizQuestionType.MULTIPLE_CHOICE,
        question: "Which word is a verb? 'run', 'blue', 'happy'",
        options: ["run", "blue", "happy"],
        correctAnswer: "run",
        skill: "Verbs",
        explanation: "A verb is an action word."
    },
    {
        type: QuizQuestionType.MULTIPLE_CHOICE,
        question: "Which sentence is correct?",
        options: ["They is playing.", "They are playing.", "They am playing."],
        correctAnswer: "They are playing.",
        skill: "Subject-Verb Agreement",
        explanation: "'They' is plural, so we use 'are'."
    },
    {
        type: QuizQuestionType.MULTIPLE_CHOICE,
        question: "Read: 'Sam has a red hat.' What color is the hat?",
        options: ["Blue", "Red", "Green"],
        correctAnswer: "Red",
        skill: "Reading Detail",
        explanation: "The text says 'red hat'."
    },
    {
        type: QuizQuestionType.MULTIPLE_CHOICE,
        question: "Which is a proper noun?",
        options: ["city", "London", "school"],
        correctAnswer: "London",
        skill: "Proper Nouns",
        explanation: "Names of specific places start with a capital letter."
    }
];

export const BaselineTest: React.FC<BaselineTestProps> = ({ studentName, onComplete, logActivity }) => {
    const [step, setStep] = useState<'intro' | 'quiz' | 'writing' | 'finish'>('intro');
    const [writingText, setWritingText] = useState('');
    const [quizScore, setQuizScore] = useState(0);

    const handleStart = () => setStep('quiz');

    const handleQuizComplete = (score: number) => {
        setQuizScore(score);
        setStep('writing');
    };

    // Internal Quiz Wrapper to capture score locally before logging
    const InternalQuiz = () => {
        const [index, setIndex] = useState(0);
        const [answers, setAnswers] = useState<string[]>([]);

        const handleAnswer = (ans: string) => {
            const newAnswers = [...answers, ans];
            const nextIndex = index + 1;
            
            if (nextIndex < BASELINE_QUESTIONS.length) {
                setAnswers(newAnswers);
                setIndex(nextIndex);
            } else {
                // Calculate score
                const score = newAnswers.reduce((acc, val, idx) => {
                     // Compare the answer at this index with the correct answer
                     return val === BASELINE_QUESTIONS[idx].correctAnswer ? acc + 1 : acc;
                }, (ans === BASELINE_QUESTIONS[index].correctAnswer ? 1 : 0)); // Add the last answer immediately
                
                handleQuizComplete(score);
            }
        };

        const q = BASELINE_QUESTIONS[index];

        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Question {index + 1} of {BASELINE_QUESTIONS.length}</h3>
                <p className="text-lg mb-6 font-medium text-gray-800">{q.question}</p>
                <div className="space-y-3">
                    {q.options?.map(opt => (
                        <button key={opt} onClick={() => handleAnswer(opt)} className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 transition-colors font-medium text-gray-700">
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const handleWritingSubmit = () => {
        if (writingText.length < 20) {
            alert("Please write a little more!");
            return;
        }
        
        // Determine Level based on quiz and writing length (simple heuristic)
        let level: 'Needs Support' | 'Developing' | 'Mastery' = 'Developing';
        
        if (quizScore >= 4 && writingText.length > 80) level = 'Mastery';
        else if (quizScore <= 2) level = 'Needs Support';

        logActivity({
            studentName,
            activityType: 'Baseline',
            category: 'Start of Year Assessment',
            score: quizScore,
            total: BASELINE_QUESTIONS.length,
            submittedText: writingText
        });

        onComplete({ level, quizScore, writingText });
        setStep('finish');
    };

    if (step === 'intro') {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center mt-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {studentName}!</h2>
                <p className="text-gray-600 mb-6">We want to know what you already know! This short activity helps your teacher pick the best lessons for you.</p>
                <button onClick={handleStart} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
                    Start Activity
                </button>
            </div>
        );
    }

    if (step === 'quiz') {
        return <InternalQuiz />;
    }

    if (step === 'writing') {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Writing Check</h3>
                <p className="text-gray-600 mb-4">Write 3-4 sentences about your favorite animal.</p>
                <textarea 
                    value={writingText} 
                    onChange={e => setWritingText(e.target.value)}
                    className="w-full p-4 border rounded-lg h-40 focus:ring-2 focus:ring-blue-500"
                    placeholder="My favorite animal is..."
                />
                <button onClick={handleWritingSubmit} className="mt-4 w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700">
                    Finish
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center mt-10">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4"/>
            <h2 className="text-3xl font-bold text-gray-800">All Done!</h2>
            <p className="text-gray-600 mt-2">Great job! You can now start using your dashboard.</p>
        </div>
    );
};