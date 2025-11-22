import React, { useState, useEffect } from 'react';
import { generateSentenceScramble, generateSpeech } from '../services/geminiService';
import type { Difficulty } from '../services/geminiService';
import type { ScrambledSentence, ActivityRecord, Student, Curriculum } from '../types';
import { Spinner, SpeakerIcon } from './common/Icons';
import { playAudio } from '../utils/audioUtils';


interface SentenceScrambleActivityProps {
  onComplete: () => void;
  session: number;
  category: string;
  curriculum: Curriculum;
  activeStudent: string | null;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const NUM_SENTENCES = 10;
const getSessionId = (category: string, session: number) => `${category} - Session ${session}`;

export const SentenceScrambleActivity: React.FC<SentenceScrambleActivityProps> = ({ onComplete, session, category, curriculum, activeStudent, logActivity }) => {
    const gradeLevel = curriculum.gradeLevel;
    const [sentences, setSentences] = useState<ScrambledSentence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    
    const getDifficulty = (): Difficulty => {
        if (category.includes('Starter')) return 'starter';
        if (category.includes('Growing')) return 'growing';
        if (category.includes('Leaping')) return 'leaping';
        return 'starter';
    }

    const fetchSentences = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const difficulty = getDifficulty();
            const data = await generateSentenceScramble(NUM_SENTENCES, difficulty, gradeLevel);
            setSentences(data);
            setCurrentIndex(0);
            setUserAnswer([]);
            setFeedback(null);
            setShowResults(false);
            setScore(0);
        } catch (err) {
            setError('Failed to load sentences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSentences();
    }, [session, category]);

    const currentSentence = sentences[currentIndex];

    const handleWordClick = (word: string, index: number) => {
        if (feedback) return;
        setUserAnswer(prev => [...prev, word]);
        const remainingWords = [...currentSentence.scrambled];
        remainingWords.splice(index, 1);
        sentences[currentIndex].scrambled = remainingWords; // This mutation is fine for this UI state
        setSentences([...sentences]);
    };

    const handleAnswerWordClick = (word: string, index: number) => {
        if (feedback) return;
        const newAnswer = [...userAnswer];
        newAnswer.splice(index, 1);
        setUserAnswer(newAnswer);
        currentSentence.scrambled.push(word);
        setSentences([...sentences]);
    };

    const handleSubmit = () => {
        const isCorrect = userAnswer.join(' ').toLowerCase() === currentSentence.correct.toLowerCase().replace(/[.!?]$/, '');
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentIndex < sentences.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setUserAnswer([]);
                setFeedback(null);
            } else {
                setShowResults(true);
            }
        }, 2000);
    };
    
    useEffect(() => {
        if (showResults && activeStudent) {
            logActivity({
                studentName: activeStudent,
                activityType: 'Cover the Basics',
                category: getSessionId(category, session),
                score: score,
                total: NUM_SENTENCES,
            });
        }
    }, [showResults, activeStudent, category, session, score, logActivity]);

    const handleAudio = async () => {
        if(currentSentence) {
            try {
                const audioContent = await generateSpeech(currentSentence.correct);
                playAudio(audioContent);
            } catch(e) {
                console.error("Audio generation failed", e);
            }
        }
    };
    
    const handleFinish = () => {
        onComplete();
    }

    if (isLoading) return <div className="text-center p-8"><Spinner /><p>Loading Session {session}...</p></div>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;

    if (showResults) {
        return (
            <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-gray-800">Activity Complete!</h2>
                <p className="text-5xl font-bold my-4 text-blue-600">{score} / {NUM_SENTENCES}</p>
                 <p className="text-xl text-gray-600 mb-6">Activity finished. You can try again or go back.</p>
                 {!activeStudent && <p className="text-xs text-red-500 mb-4">Note: Select a student in the tracker to save this score.</p>}
                 <div className="flex items-center justify-center space-x-4">
                     <button onClick={fetchSentences} className="px-8 py-3 text-white font-bold rounded-lg shadow-md bg-orange-500 hover:bg-orange-600">
                        Try Again
                    </button>
                    <button onClick={handleFinish} className="px-8 py-3 text-gray-700 font-bold rounded-lg bg-gray-200 hover:bg-gray-300">
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }
    
    if (!currentSentence) return null;

    return (
        <div className="max-w-2xl mx-auto p-4">
             <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{category} - Session {session}</h2>
             <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-center text-gray-500 mb-4">Question {currentIndex + 1} of {sentences.length}</p>
                <div className="flex justify-center items-center mb-6">
                    <p className="text-lg text-gray-700 font-medium">Unscramble the words to make a sentence.</p>
                </div>
                <div className={`bg-gray-100 p-4 rounded-lg min-h-[80px] border-2 border-dashed flex flex-wrap gap-2 items-center justify-center transition-colors ${
                    feedback === 'correct' ? 'border-green-400' : feedback === 'incorrect' ? 'border-red-400' : 'border-gray-300'
                }`}>
                    {userAnswer.map((word, index) => (
                         <button key={index} onClick={() => handleAnswerWordClick(word, index)} className="px-3 py-1 bg-blue-500 text-white rounded-md shadow-sm">{word}</button>
                    ))}
                     {feedback === 'incorrect' && (
                        <div className="w-full text-center mt-2">
                            <button onClick={handleAudio} className="text-sm flex items-center justify-center mx-auto space-x-1 text-green-700 hover:underline">
                                <SpeakerIcon className="w-4 h-4"/>
                                <span>Hear Correct Sentence</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 mt-4 flex flex-wrap gap-2 items-center justify-center min-h-[80px]">
                    {currentSentence.scrambled.map((word, index) => (
                        <button key={index} onClick={() => handleWordClick(word, index)} className="px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">{word}</button>
                    ))}
                </div>
                <div className="text-center mt-4 relative min-h-[60px]">
                     {feedback ? (
                        <div className={`text-xl font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                            {feedback === 'correct' ? 'Correct!' : `Not quite! The answer is: "${currentSentence.correct}"`}
                        </div>
                     ) : (
                        <button onClick={handleSubmit} disabled={userAnswer.length === 0 || userAnswer.length < 2 || !!feedback} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                            Check My Sentence
                        </button>
                     )}
                </div>
             </div>
        </div>
    );
};