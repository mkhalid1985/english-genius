import React, { useState } from 'react';
import type { Curriculum, VocabularyLesson, Student, ActivityRecord } from '../types';
import { VocabularyIcon, SpeakerIcon, Spinner, LockIcon } from './common/Icons';
import { generateSpeech } from '../services/geminiService';
import { playAudio } from '../utils/audioUtils';
import { Quiz } from './Quiz';

interface VocabularyPracticeProps {
    curriculum: Curriculum;
    onComplete: () => void;
    activeStudent: string | null;
    logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
    logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const FlashcardView: React.FC<{ 
    lesson: VocabularyLesson; 
    onBack: () => void;
    onStartQuiz: () => void;
}> = ({ lesson, onBack, onStartQuiz }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [audioLoading, setAudioLoading] = useState<string | null>(null);

    const card = lesson.cards[currentIndex];

    const handleReadAloud = async (text: string, id: string) => {
        if (audioLoading || !text) return;
        setAudioLoading(id);
        try {
            const audioB64 = await generateSpeech(text);
            await playAudio(audioB64);
        } catch (e) {
            console.error("Audio generation failed", e);
        } finally {
            setAudioLoading(null);
        }
    };
    
    const isLastCard = currentIndex === lesson.cards.length - 1;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <button onClick={onBack} className="text-blue-600 hover:underline mb-4">&larr; Back to Lessons</button>
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-1">{lesson.title}</h2>
            {lesson.quiz && <p className="text-center text-gray-500 mb-4">Includes a {lesson.quiz.length}-question quiz.</p>}
            <div className="relative">
                <div className="bg-white p-8 rounded-2xl shadow-2xl min-h-[450px] flex flex-col justify-between">
                    <div>
                        {card.imageUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden shadow-inner bg-gray-100 h-48 flex items-center justify-center group">
                                <img 
                                    src={card.imageUrl} 
                                    alt={card.word} 
                                    className="w-full h-full object-contain p-2 transition-transform duration-500 ease-in-out group-hover:scale-110"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-baseline space-x-3">
                                <h3 className="text-5xl font-extrabold text-indigo-600">{card.word}</h3>
                                <p className="text-lg text-gray-500 italic">({card.form})</p>
                            </div>
                             <button onClick={() => handleReadAloud(card.word, 'word')} disabled={!!audioLoading} className="text-indigo-500 hover:text-indigo-700 disabled:text-gray-300">
                                {audioLoading === 'word' ? <Spinner className="w-8 h-8"/> : <SpeakerIcon className="w-8 h-8"/>}
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="p-4 bg-sky-50 rounded-lg">
                                <p className="font-bold text-sky-800">Meaning</p>
                                <p className="text-gray-700">{card.meaning}</p>
                            </div>
                            <div className="p-4 bg-lime-50 rounded-lg">
                                <p className="font-bold text-lime-800">Structure</p>
                                <p className="text-gray-700">{card.structure}</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-amber-800">Example Sentences</p>
                                    <button onClick={() => handleReadAloud(card.contextSentences.join(' '), 'sentences')} disabled={!!audioLoading} className="text-amber-600 hover:text-amber-800 disabled:text-gray-300">
                                        {audioLoading === 'sentences' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                                <ul className="list-disc list-inside text-gray-700 italic space-y-1 mt-1">
                                   {card.contextSentences.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center mt-6">
                         {isLastCard && lesson.quiz && (
                            <button onClick={onStartQuiz} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700">
                                Start Quiz!
                            </button>
                         )}
                    </div>
                     <p className="text-center text-gray-500 mt-6">Card {currentIndex + 1} of {lesson.cards.length}</p>
                </div>
                
                {currentIndex > 0 && (
                     <button onClick={() => setCurrentIndex(p => p - 1)} className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
                {currentIndex < lesson.cards.length - 1 && (
                     <button onClick={() => setCurrentIndex(p => p + 1)} className="absolute top-1/2 -right-6 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({ curriculum, onComplete, activeStudent, logParticipation, logActivity }) => {
    const [view, setView] = useState<'menu' | 'flashcards' | 'quiz'>('menu');
    const [selectedLesson, setSelectedLesson] = useState<VocabularyLesson | null>(null);
    
    // Access Control State
    const [lessonToUnlock, setLessonToUnlock] = useState<VocabularyLesson | null>(null);
    const [accessCodeInput, setAccessCodeInput] = useState('');
    const [accessCodeError, setAccessCodeError] = useState('');
    const [honorPledge, setHonorPledge] = useState(false);

    const lessons = curriculum.customVocabularyLessons;

    const checkAccess = (lesson: VocabularyLesson) => {
        const assignments = curriculum.assignments.filter(a => a.activityId === lesson.id);
        if (assignments.length === 0) return true; 
        if (!activeStudent) return false;
        const unlocked = sessionStorage.getItem(`unlocked_${lesson.id}_${activeStudent}`);
        if (unlocked) return true;
        return false;
    };

    const handleUnlock = () => {
        if (!lessonToUnlock || !activeStudent) return;

        if (!honorPledge) {
            setAccessCodeError("You must agree to the Honor Pledge first.");
            return;
        }
  
        const assignment = curriculum.assignments.find(a => 
            a.activityId === lessonToUnlock.id && 
            a.studentName === activeStudent && 
            a.accessCode === accessCodeInput
        );
  
        if (assignment) {
            sessionStorage.setItem(`unlocked_${lessonToUnlock.id}_${activeStudent}`, 'true');
            setLessonToUnlock(null);
            setAccessCodeInput('');
            setAccessCodeError('');
            setHonorPledge(false);
            // Handle open
            setSelectedLesson(lessonToUnlock);
            setView('flashcards');
        } else {
             const otherAssignment = curriculum.assignments.find(a => a.activityId === lessonToUnlock.id && a.accessCode === accessCodeInput);
            if (otherAssignment) {
                 setAccessCodeError(`⛔ This code belongs to ${otherAssignment.studentName}, but you are logged in as ${activeStudent}.`);
            } else {
                 setAccessCodeError("Invalid Access Code.");
            }
        }
    };


    const handleSelectLesson = (lesson: VocabularyLesson) => {
        const isUnlocked = checkAccess(lesson);
        const hasAssignments = curriculum.assignments.some(a => a.activityId === lesson.id);

        if (isUnlocked) {
            setSelectedLesson(lesson);
            setView('flashcards');
        } else if (hasAssignments) {
            if(!activeStudent) {
                alert("Please select a student from the tracker first.");
                return;
            }
            setLessonToUnlock(lesson);
            setAccessCodeError('');
            setHonorPledge(false);
        }
    };
    
    const handleQuizComplete = () => {
        onComplete();
        setView('menu');
        setSelectedLesson(null);
    };

    if (view === 'quiz' && selectedLesson?.quiz) {
         return (
             <Quiz
                questions={selectedLesson.quiz}
                activityType="Vocabulary"
                category={selectedLesson.title}
                onComplete={handleQuizComplete}
                curriculum={curriculum}
                activeStudent={activeStudent}
                logParticipation={logParticipation}
                logActivity={logActivity}
            />
         );
    }

    if (view === 'flashcards' && selectedLesson) {
        return <FlashcardView 
                    lesson={selectedLesson} 
                    onBack={() => {
                        setView('menu');
                        setSelectedLesson(null);
                    }}
                    onStartQuiz={() => setView('quiz')}
                />;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Vocabulary Practice</h2>
            <p className="text-gray-600 mb-8">Choose a lesson created by your teacher to start learning!</p>
            {lessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.map((lesson) => {
                         const isUnlocked = checkAccess(lesson);
                         const hasAssignments = curriculum.assignments.some(a => a.activityId === lesson.id);

                         return (
                            <button
                                key={lesson.id}
                                onClick={() => handleSelectLesson(lesson)}
                                className={`w-full p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center justify-between ${!isUnlocked && hasAssignments ? 'bg-gray-50' : 'bg-white'}`}
                            >
                                <div className="flex items-center">
                                    <VocabularyIcon className={`w-8 h-8 mr-4 ${!isUnlocked && hasAssignments ? 'text-gray-400' : 'text-cyan-500'}`} />
                                    <div>
                                        <h3 className={`text-xl font-semibold ${!isUnlocked && hasAssignments ? 'text-gray-600' : 'text-cyan-700'}`}>{lesson.title}</h3>
                                        <p className="text-sm text-gray-500">{lesson.cards.length} words {lesson.quiz ? `• Quiz` : ''}</p>
                                    </div>
                                </div>
                                {!isUnlocked && hasAssignments && <LockIcon className="w-6 h-6 text-gray-400"/>}
                            </button>
                         )
                    })}
                </div>
            ) : (
                <p className="text-gray-500 p-8 bg-gray-50 rounded-lg">Your teacher hasn't created any vocabulary lessons yet.</p>
            )}
            
            {lessonToUnlock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-left">
                        <h3 className="text-lg font-bold mb-2">Unlock {lessonToUnlock.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">Enter the code provided by your teacher for <b>{activeStudent}</b>.</p>
                        <input 
                            type="text" 
                            value={accessCodeInput}
                            onChange={e => setAccessCodeInput(e.target.value)}
                            className="w-full p-2 border rounded mb-2 text-center tracking-widest font-bold text-lg uppercase"
                            placeholder="CODE"
                        />

                        <div className="mb-4 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                             <label className="flex items-start space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={honorPledge}
                                    onChange={(e) => setHonorPledge(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700 leading-tight">
                                    I promise that I am <b>{activeStudent}</b> and I will do this work myself without help from parents or tutors. (Amanah/Trust)
                                </span>
                            </label>
                        </div>
                        
                        {accessCodeError && <p className="text-red-500 text-xs mb-2">{accessCodeError}</p>}
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => {setLessonToUnlock(null); setAccessCodeError(''); setHonorPledge(false)}} className="flex-1 py-2 bg-gray-200 rounded font-semibold">Cancel</button>
                            <button onClick={handleUnlock} className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold disabled:bg-gray-400" disabled={!honorPledge || !accessCodeInput}>Unlock</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};