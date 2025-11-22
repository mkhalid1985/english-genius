import React, { useState, useEffect, useCallback } from 'react';
import { generateCVCWords, generateSpeech, generateImageFromPrompt } from '../services/geminiService';
import type { CVCDifficulty } from '../services/geminiService';
import type { CVCWord, ActivityRecord, Student } from '../types';
import { Spinner, SpeakerIcon } from './common/Icons';
import { playAudio } from '../utils/audioUtils';

interface CVCActivityProps {
  onComplete: () => void;
  category: string;
  session: number;
  activeStudent: string | null;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const WORDS_PER_SESSION = 10;
const getSessionId = (category: string, session: number) => `${category} - Session ${session}`;

export const CVCActivity: React.FC<CVCActivityProps> = ({ onComplete, category, session, activeStudent, logActivity }) => {
    const [phase, setPhase] = useState<'study' | 'test' | 'summary'>('study');
    const [words, setWords] = useState<(CVCWord & { imageUrl?: string; audio?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [score, setScore] = useState(0);
    const [isMediaLoading, setIsMediaLoading] = useState(false);

    const getDifficulty = useCallback((): CVCDifficulty => {
        if (category.includes('Starter')) return 'simple';
        if (category.includes('Growing')) return 'medium';
        if (category.includes('Leaping')) return 'hard';
        return 'simple';
    }, [category]);
    
    const preloadMediaForWord = useCallback(async (word: CVCWord) => {
        try {
            const imagePrompt = `A simple, colorful, cartoon-style flashcard image for a child: ${word.image_prompt}. Clean white background.`;
            const [base64Image, audioContent] = await Promise.all([
                generateImageFromPrompt(imagePrompt),
                generateSpeech(word.word)
            ]);
            return {
                imageUrl: `data:image/png;base64,${base64Image}`,
                audio: audioContent
            };
        } catch (e) {
            console.error("Failed to preload media for", word.word, e);
            return {};
        }
    }, []);

    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const difficulty = getDifficulty();
            const newWords = await generateCVCWords(WORDS_PER_SESSION, difficulty);
            setWords(newWords);
            setPhase('study');
            setCurrentWordIndex(0);
            setScore(0);
            setUserInput('');
            setFeedback(null);
        } catch (err) {
            setError('Failed to load words. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [getDifficulty, session]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);
    
    useEffect(() => {
        if (words.length > 0 && !words[currentWordIndex]?.imageUrl) {
            const loadMedia = async () => {
                setIsMediaLoading(true);
                const media = await preloadMediaForWord(words[currentWordIndex]);
                setWords(current => {
                    const newWords = [...current];
                    newWords[currentWordIndex] = { ...newWords[currentWordIndex], ...media };
                    return newWords;
                });
                setIsMediaLoading(false);
                if (media.audio) playAudio(media.audio);
            }
            loadMedia();
        } else if (words.length > 0 && words[currentWordIndex]?.audio) {
            playAudio(words[currentWordIndex].audio!);
        }
    }, [words, currentWordIndex, preloadMediaForWord]);


    const handleNextStudy = () => {
        if (currentWordIndex < WORDS_PER_SESSION - 1) {
            setCurrentWordIndex(prev => prev + 1);
        } else {
            setCurrentWordIndex(0);
            setPhase('test');
        }
    }

    const handleSummary = useCallback(() => {
        if (activeStudent) {
            logActivity({
                studentName: activeStudent,
                activityType: 'Cover the Basics',
                category: getSessionId(category, session),
                score: score,
                total: WORDS_PER_SESSION,
            });
        }
        setPhase('summary');
    }, [activeStudent, category, session, score, logActivity]);


    const handleSubmitTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.toLowerCase().trim() === words[currentWordIndex].word.toLowerCase()) {
            setFeedback('correct');
            setScore(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            if (currentWordIndex < WORDS_PER_SESSION - 1) {
                setCurrentWordIndex(prev => prev + 1);
                setUserInput('');
                setFeedback(null);
            } else {
                handleSummary();
            }
        }, 1500);
    };
    
    // Update score and move to summary
    useEffect(() => {
        if (phase === 'test' && currentWordIndex === WORDS_PER_SESSION - 1 && feedback) {
           setTimeout(() => {
               handleSummary();
           }, 1500);
        }
    }, [phase, currentWordIndex, feedback, handleSummary]);
    
    const handleFinish = () => {
        onComplete();
    };

    const handleRetry = () => {
        fetchWords();
    }
    
    if (isLoading) return <div className="text-center p-8"><Spinner /> <p>Loading Session {session}...</p></div>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    if (words.length === 0) return <p className="text-center">No words found.</p>;

    const currentWord = words[currentWordIndex];
    const title = `${category} - Session ${session}`;

    if(phase === 'summary') {
        return (
            <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-gray-800">{title} Complete!</h2>
                <p className="text-5xl font-bold my-4 text-blue-600">{score} / {WORDS_PER_SESSION}</p>
                 <p className="text-xl text-gray-600 mb-6">Activity finished. You can try again or go back.</p>
                 {!activeStudent && <p className="text-xs text-red-500 mb-4">Note: Select a student in the tracker to save this score.</p>}
                <div className="flex items-center justify-center space-x-4">
                     <button onClick={handleRetry} className="px-8 py-3 text-white font-bold rounded-lg shadow-md bg-orange-500 hover:bg-orange-600">
                        Try Again
                    </button>
                    <button onClick={handleFinish} className="px-8 py-3 text-gray-700 font-bold rounded-lg bg-gray-200 hover:bg-gray-300">
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-md mx-auto p-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-500 mb-4">
                {phase === 'study' ? `Study Phase: Word ${currentWordIndex + 1}` : `Test Phase: Word ${currentWordIndex + 1}`} of {WORDS_PER_SESSION}
            </p>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="bg-gray-100 h-48 flex items-center justify-center rounded-lg mb-4 overflow-hidden">
                    {isMediaLoading ? <Spinner /> : currentWord.imageUrl ? <img src={currentWord.imageUrl} alt={currentWord.image_prompt} className="w-full h-full object-contain" /> : <p className="text-gray-600 italic px-4">{currentWord.image_prompt}</p>}
                </div>

                {phase === 'study' && (
                     <div className="min-h-[150px] flex flex-col items-center justify-center">
                        <h3 className="text-lg text-gray-600 mb-2">Listen and look...</h3>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => playAudio(currentWord.audio!)} disabled={!currentWord.audio}><SpeakerIcon className="w-8 h-8 text-blue-500"/></button>
                             <span className="text-4xl font-bold tracking-widest">{currentWord.word}</span>
                        </div>
                        <button onClick={handleNextStudy} className="mt-6 w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
                           {currentWordIndex < WORDS_PER_SESSION - 1 ? 'Next Word' : "Start Test"}
                        </button>
                    </div>
                )}
                
                {phase === 'test' && (
                    <form onSubmit={handleSubmitTest}>
                        <label htmlFor="word-input" className="text-lg text-gray-600 mb-2 block">Listen, then type the word:</label>
                        <button type="button" onClick={() => playAudio(currentWord.audio!)} disabled={!currentWord.audio} className="mb-2"><SpeakerIcon className="w-8 h-8 text-blue-500"/></button>
                        <input
                            id="word-input"
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className={`w-full text-center text-2xl p-3 border-2 rounded-lg ${
                                feedback === 'correct' ? 'border-green-500 bg-green-50' :
                                feedback === 'incorrect' ? 'border-red-500 bg-red-50' :
                                'border-gray-300'
                            }`}
                            placeholder="Type here"
                            autoFocus
                            disabled={!!feedback}
                        />
                         <button type="submit" disabled={!userInput || !!feedback} className="mt-4 w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                            Check
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};