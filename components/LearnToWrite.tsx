import React, { useState, useEffect } from 'react';
import type { Student, ActivityRecord, LearnToWriteLevel, WritingTask, LearnToWriteFeedback, Curriculum } from '../types';
import { generateWritingTask, checkForProfanity, checkLearnToWrite, generateImageFromPrompt, generateSpeech } from '../services/geminiService';
import { Spinner, CheckCircleIcon, LockIcon, SpeakerIcon } from './common/Icons';
import { playAudio } from '../utils/audioUtils';

interface LearnToWriteProps {
    records: ActivityRecord[];
    onComplete: () => void;
    curriculum: Curriculum;
    activeStudent: string | null;
    logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const levels: LearnToWriteLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const TASKS_PER_LEVEL = 5;

const TaskButton: React.FC<{
    isLocked: boolean;
    isComplete: boolean;
    onClick: () => void;
    taskNumber: number;
}> = ({ isLocked, isComplete, onClick, taskNumber }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 transition-all
                ${isComplete ? 'bg-green-100 border-green-500 text-green-700' :
                  isLocked ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' :
                  'bg-white border-blue-500 text-blue-700 hover:bg-blue-50'}`}
        >
            {isLocked && <LockIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
            {isComplete && <CheckCircleIcon className="w-8 h-8" />}
            {!isComplete && <span className="text-2xl font-bold">{taskNumber}</span>}
            <span className="text-xs font-semibold mt-1">Task {taskNumber}</span>
        </button>
    );
};

export const LearnToWrite: React.FC<LearnToWriteProps> = ({ records, onComplete, curriculum, activeStudent, logActivity }) => {
    const gradeLevel = curriculum.gradeLevel;
    const categories = curriculum.learnToWriteCategories;
    const [view, setView] = useState<'menu' | 'level' | 'task'>('menu');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<LearnToWriteLevel | null>(null);
    const [selectedTaskNum, setSelectedTaskNum] = useState<number | null>(null);

    const [task, setTask] = useState<WritingTask | null>(null);
    const [taskImage, setTaskImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [userText, setUserText] = useState('');
    const [feedback, setFeedback] = useState<LearnToWriteFeedback | null>(null);
    
    const [audioLoading, setAudioLoading] = useState<string | null>(null);
    const [nowReading, setNowReading] = useState<string | null>(null);

    const isTaskComplete = (category: string, level: LearnToWriteLevel, taskNum: number) => {
        const categoryId = `${category} - ${level} - Task ${taskNum}`;
        return records.some(r => r.category === categoryId && r.score === 1);
    };

    const fetchTask = async (category: string, level: LearnToWriteLevel, taskNum: number) => {
        setIsLoading(true);
        setError(null);
        setTask(null);
        setTaskImage(null);
        setUserText('');
        setFeedback(null);
        try {
            const writingTask = await generateWritingTask(category, level, taskNum, TASKS_PER_LEVEL, gradeLevel);
            setTask(writingTask);
            const imageUrl = await generateImageFromPrompt(writingTask.visualPrompt);
            setTaskImage(`data:image/png;base64,${imageUrl}`);
        } catch (err) {
            setError("Failed to load the writing task. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReadAloud = async (text: string, id: string) => {
        if (audioLoading) return;
        setAudioLoading(id);
        try {
            const audioB64 = await generateSpeech(text);
            setNowReading(id);
            await playAudio(audioB64);
        } catch(e) {
            console.error("Audio generation failed", e);
        } finally {
            setAudioLoading(null);
            setNowReading(null);
        }
    };

    const handleSubmitWriting = async () => {
        if (!task || !selectedCategory || !selectedLevel || !selectedTaskNum || !activeStudent) {
            setError("Cannot submit without an active student selected.");
            return;
        };
        setIsLoading(true);
        setError(null);
        setFeedback(null);
        try {
            const isProfane = await checkForProfanity(userText);
            if (isProfane) {
                setError("Your writing contains inappropriate language. Please revise it.");
                setIsLoading(false);
                return;
            }
            const result = await checkLearnToWrite(userText, task.prompt, task.sentenceCount, selectedCategory, gradeLevel);
            setFeedback(result);
            if (result.isPassing) {
                 logActivity({
                    studentName: activeStudent,
                    activityType: 'Learn to Write',
                    category: `${selectedCategory} - ${selectedLevel} - Task ${selectedTaskNum}`,
                    score: 1,
                    total: 1,
                    submittedText: userText,
                    improvementArea: result.improvement ? [result.improvement] : [],
                });
            }
        } catch (err) {
            setError("Could not get feedback. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (view === 'task' && selectedCategory && selectedLevel && selectedTaskNum) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <button onClick={() => { setView('level'); setTask(null); }} className="text-blue-600 hover:underline mb-4">&larr; Back to Level Map</button>
                {isLoading && !task && <div className="text-center p-8"><Spinner /><p>Loading task...</p></div>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {task && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800">{task.title}</h2>
                        <p className="text-gray-500 mb-4">{selectedCategory} - {selectedLevel} - Task {selectedTaskNum}</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">Example</h3>
                                    <button onClick={() => handleReadAloud(task.exampleText, 'example')} disabled={!!audioLoading} className="text-blue-500 hover:text-blue-700 disabled:text-gray-300">
                                        {audioLoading === 'example' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                                <div className={`bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-serif text-gray-700 italic border text-lg leading-relaxed ${nowReading === 'example' ? 'ring-2 ring-yellow-400' : ''}`}>
                                    {task.exampleText}
                                </div>
                                <h3 className="font-semibold text-lg mt-4 mb-2">Helpful Questions</h3>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                    {task.guidingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">Your Prompt</h3>
                                     <button onClick={() => handleReadAloud(task.prompt, 'prompt')} disabled={!!audioLoading} className="text-blue-500 hover:text-blue-700 disabled:text-gray-300">
                                        {audioLoading === 'prompt' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                                {taskImage ? 
                                    <img src={taskImage} alt={task.visualPrompt} className="w-full h-40 object-cover rounded-lg mb-2" /> :
                                    <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-2"><Spinner /></div>
                                }
                                <p className={`p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg text-lg ${nowReading === 'prompt' ? 'ring-2 ring-yellow-400' : ''}`}>{task.prompt}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                             <textarea
                                value={userText}
                                onChange={(e) => setUserText(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-lg h-48 focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed"
                                placeholder={`Write about ${task.sentenceCount} sentences here...`}
                                disabled={feedback?.isPassing}
                            />
                            <button onClick={handleSubmitWriting} disabled={isLoading || !userText.trim() || feedback?.isPassing || !activeStudent} className="mt-2 w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                                {isLoading ? <Spinner /> : "Check My Writing"}
                            </button>
                            {!activeStudent && <p className="text-xs text-center text-red-500 mt-1">Please select a student in the tracker to log this activity.</p>}
                        </div>

                        {feedback && (
                            <div className={`mt-4 p-4 rounded-lg ${feedback.isPassing ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'} border-l-4`}>
                                <p className="font-semibold text-lg">{feedback.encouragingMessage}</p>
                                {feedback.improvement && (
                                    <div className="mt-2 text-sm">
                                        <p><span className="font-semibold">Mistake:</span> <span className="text-red-700">"{feedback.improvement.mistake}"</span></p>
                                        <p><span className="font-semibold">Correction:</span> <span className="text-green-700">"{feedback.improvement.correction}"</span></p>
                                        <p className="text-gray-600 mt-1">{feedback.improvement.explanation}</p>
                                    </div>
                                )}
                                {feedback.isPassing && <p className="mt-2 font-bold">Great job! You can now go back to the level map.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
    
    if (view === 'level' && selectedCategory) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <button onClick={() => setView('menu')} className="text-blue-600 hover:underline mb-4">&larr; Back to Categories</button>
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">{selectedCategory}</h2>
                <p className="text-gray-600 mb-8 text-center">Complete the tasks in order to unlock the next level.</p>

                <div className="space-y-8">
                    {levels.map((level, levelIndex) => {
                        const isLevelUnlocked = levelIndex === 0 || Array.from({length: TASKS_PER_LEVEL}, (_, i) => i + 1).every(taskNum => isTaskComplete(selectedCategory, levels[levelIndex - 1], taskNum));
                        
                        return (
                            <div key={level}>
                                <h3 className={`text-2xl font-bold mb-4 ${isLevelUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>{level}</h3>
                                <div className="flex flex-wrap gap-4 p-4 bg-gray-100 rounded-lg justify-center">
                                    {Array.from({length: TASKS_PER_LEVEL}, (_, i) => i + 1).map(taskNum => {
                                        const isUnlocked = isLevelUnlocked && (taskNum === 1 || isTaskComplete(selectedCategory, level, taskNum - 1));
                                        return (
                                            <TaskButton 
                                                key={taskNum}
                                                taskNumber={taskNum}
                                                isComplete={isTaskComplete(selectedCategory, level, taskNum)}
                                                isLocked={!isUnlocked}
                                                onClick={() => {
                                                    setSelectedLevel(level);
                                                    setSelectedTaskNum(taskNum);
                                                    fetchTask(selectedCategory, level, taskNum);
                                                    setView('task');
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Default view: 'menu'
    return (
        <div className="max-w-2xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Learn to Write</h2>
            <p className="text-gray-600 mb-8">Choose a writing style to begin your journey!</p>
            <div className="space-y-4">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => {
                            setSelectedCategory(category);
                            setView('level');
                        }}
                        className="w-full p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                    >
                        <h3 className="text-xl font-semibold text-orange-700">{category}</h3>
                    </button>
                ))}
            </div>
        </div>
    );
};