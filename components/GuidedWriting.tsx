import React, { useState, useEffect } from 'react';
import type { Student, WritingFeedback, LetterWritingFeedback, ActivityRecord, BrainstormCoherenceFeedback, PersonalNarrativeLevel, LetterWritingLevel, Curriculum } from '../types';
import { checkPersonalNarrative, checkLetterWriting, checkBrainstormCoherence, generateSpeech } from '../services/geminiService';
import { Spinner, CheckCircleIcon, WritingIcon, UploadIcon, LockIcon, KeyIcon, SpeakerIcon } from './common/Icons';
import { playAudio } from '../utils/audioUtils';

interface GuidedWritingProps {
    onComplete: () => void;
    curriculum: Curriculum;
}

// Helper function to get progress from localStorage
const getProgress = (studentName: string) => {
    const saved = localStorage.getItem(`guidedWritingProgress_${studentName}`);
    if (saved) {
        return JSON.parse(saved);
    }
    return { personalNarrative: 1, letterWriting: 1 }; // Default: level 1 is unlocked
};

// --- SUB-COMPONENTS ---
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const Milestone: React.FC<{ label: string, completed: boolean, hint?: string }> = ({ label, completed, hint }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-300">
        <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                {completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`font-semibold ${completed ? 'text-gray-800 line-through' : 'text-gray-500'}`}>{label}</span>
        </div>
        {!completed && hint && (
            <div className="relative group">
                <InfoIcon className="w-5 h-5 text-gray-400 cursor-pointer" />
                <div className="absolute bottom-full mb-2 -right-1/2 w-64 p-2 text-xs text-white bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {hint}
                    <div className="absolute top-full right-2 w-2 h-2 bg-gray-700 rotate-45"></div>
                </div>
            </div>
        )}
    </div>
);


const AnnotatedPart: React.FC<{ label: string, children: React.ReactNode, className?: string, isReading?: boolean }> = ({ label, children, className, isReading }) => (
  <div className={`mb-4 ${className}`}>
    <p className="text-sm font-bold text-blue-600 tracking-wide uppercase">{label}</p>
    <div className={`p-3 bg-blue-50/50 border border-blue-200 rounded-lg mt-1 whitespace-pre-wrap font-serif text-gray-700 text-lg leading-relaxed ${isReading ? 'ring-2 ring-yellow-400' : ''}`}>
      {children}
    </div>
  </div>
);

const CompletionModal: React.FC<{ nextLevelKey: { word: string; question: string; }, onContinue: () => void }> = ({ nextLevelKey, onContinue }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-bold text-gray-800">Level Complete!</h2>
            <p className="text-gray-600 mt-2">Amazing work! You've earned the key to the next level.</p>
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">The Secret Word for the next level is:</p>
                <p className="text-2xl font-bold text-indigo-600 tracking-widest mt-1">{nextLevelKey.word}</p>
                <p className="text-xs text-gray-500 mt-2">You will need this to unlock the next challenge!</p>
            </div>
            <button
                onClick={onContinue}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700"
            >
                Continue
            </button>
        </div>
    </div>
);

const UnlockLevelModal: React.FC<{ levelToUnlock: number, onUnlock: (key: string) => void, onClose: () => void, error: string }> = ({ levelToUnlock, onUnlock, onClose, error }) => {
    const [keyInput, setKeyInput] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUnlock(keyInput);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full">
                <KeyIcon className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
                <h2 className="text-2xl font-bold text-gray-800">Unlock Level {levelToUnlock}</h2>
                <p className="text-gray-600 mt-2 mb-4">Enter the Secret Word you earned from the last level.</p>
                <div>
                    <label htmlFor="secret-word-input" className="sr-only">Secret Word</label>
                    <input 
                        id="secret-word-input"
                        type="text"
                        value={keyInput}
                        onChange={e => setKeyInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-bold tracking-widest uppercase focus:ring-2 focus:ring-amber-400"
                        placeholder="SECRET WORD"
                        autoFocus
                    />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-amber-500 text-white font-bold rounded-lg shadow-md hover:bg-amber-600"
                    >
                        Unlock
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- SHARED HELPER FUNCTIONS ---

const isSentenceValid = (sentence: string | undefined): boolean => {
    if (!sentence) return false;
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/);
    if (words.length < 3) return false;
    if (!/[A-Z]/.test(trimmed[0])) return false;
    if (!/[.!?]$/.test(trimmed)) return false;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    return (uniqueWords.size / words.length) > 0.4;
};

const BrainstormInput: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void}> = ({label, value, onChange}) => (
    <div>
        <label className="block text-sm font-bold text-gray-700">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            rows={2}
            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

// --- TASK VIEWS ---

const LetterWritingTaskView: React.FC<{ level: LetterWritingLevel, onComplete: () => void, onLevelComplete: () => void, gradeLevel: string }> = ({ level, onComplete, onLevelComplete, gradeLevel }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [milestones, setMilestones] = useState([
        { group: 'Heading', part: 'Write the date.', completed: false, hint: "Write today's date at the top, like 'October 26, 2024'." },
        { group: 'Greeting', part: 'Write the greeting.', completed: false, hint: "Start your letter with 'Dear [Name],' and don't forget the comma." },
        { group: 'Body - Paragraph 1', part: 'Write your first sentence.', completed: false, hint: "Start your first paragraph with a complete sentence." },
        { group: 'Body - Paragraph 1', part: 'Write your second sentence.', completed: false, hint: "Add another sentence to your first paragraph." },
        { group: 'Body - Paragraph 2', part: 'Write your first sentence.', completed: false, hint: "Start your second paragraph with a complete sentence. Press Enter twice to start a new paragraph." },
        { group: 'Body - Paragraph 2', part: 'Write your second sentence.', completed: false, hint: "Add another sentence to your second paragraph." },
        { group: 'Closing', part: 'Write the closing.', completed: false, hint: "End with a closing like 'Your friend,'." },
        { group: 'Signature', part: 'Write your signature.', completed: false, hint: "Sign your name on the last line." }
    ]);
    const [audioLoading, setAudioLoading] = useState<string | null>(null);
    const [nowReading, setNowReading] = useState<string | null>(null);

    const handleReadAloud = async (textToRead: string, id: string) => {
        if (audioLoading) return;
        setAudioLoading(id);
        try {
            const audioB64 = await generateSpeech(textToRead);
            setNowReading(id);
            await playAudio(audioB64);
        } catch(e) {
            console.error("Audio generation failed", e);
        } finally {
            setAudioLoading(null);
            setNowReading(null);
        }
    };

    useEffect(() => {
        const newMilestones = JSON.parse(JSON.stringify(milestones));
        const getSentences = (p: string | undefined) => p ? p.match(/[^.!?]+[.!?]+/g) || [] : [];
        const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)/i;
        const dateRegex = /\d{1,2},? \d{4}/;
        const headingLine = text.split('\n')[0] || '';
        newMilestones[0].completed = monthRegex.test(headingLine) && dateRegex.test(headingLine);
        const greetingRegex = /dear .*,/i;
        newMilestones[1].completed = greetingRegex.test(text);
        const closingRegex = /(sincerely|your friend|love|best wishes|yours truly),/i;
        newMilestones[6].completed = closingRegex.test(text);
        const closingMatch = text.match(closingRegex);
        if (closingMatch) {
            const textAfterClosing = text.substring(text.indexOf(closingMatch[0]) + closingMatch[0].length);
            newMilestones[7].completed = textAfterClosing.trim().split(/\s+/).length >= 1;
        } else {
            newMilestones[7].completed = false;
        }
        let bodyText = text;
        const greetingMatch = text.match(greetingRegex);
        if (greetingMatch) {
            const startIndex = text.indexOf(greetingMatch[0]) + greetingMatch[0].length;
            bodyText = closingMatch ? text.substring(startIndex, text.indexOf(closingMatch[0])) : text.substring(startIndex);
        }
        const paragraphs = bodyText.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const para1Sentences = getSentences(paragraphs[0]);
        newMilestones[2].completed = isSentenceValid(para1Sentences[0]);
        newMilestones[3].completed = isSentenceValid(para1Sentences[1]);
        const para2Sentences = getSentences(paragraphs[1]);
        newMilestones[4].completed = isSentenceValid(para2Sentences[0]);
        newMilestones[5].completed = isSentenceValid(para2Sentences[1]);
        setMilestones(newMilestones);
    }, [text]);


    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await checkLetterWriting(text, gradeLevel);
            const score = result.partsFeedback.filter(p => p.status === 'Correct').length;
            if (score === 5) {
                onLevelComplete();
            } else {
                 setError(`Good try! You got ${score}/5. You need a perfect score to unlock the next level.`);
            }
        } catch (err) { setError('Could not get feedback. Please try again.'); } finally { setIsLoading(false); }
    };
    
    const milestoneGroups = [...new Set(milestones.map(m => m.group))];

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Example: {level.title}</h3>
                <div className="mb-6">
                    <AnnotatedPart label="Heading" isReading={nowReading === 'example_heading'}>{level.example.heading}</AnnotatedPart>
                    <AnnotatedPart label="Greeting" isReading={nowReading === 'example_greeting'}>{level.example.greeting}</AnnotatedPart>
                    <AnnotatedPart label="Body" isReading={nowReading === 'example_body'}>{level.example.body}</AnnotatedPart>
                    <AnnotatedPart label="Closing" isReading={nowReading === 'example_closing'}>{level.example.closing}</AnnotatedPart>
                    <AnnotatedPart label="Signature" isReading={nowReading === 'example_signature'}>{level.example.signature}</AnnotatedPart>
                </div>
                <div className={`p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg ${nowReading === 'prompt' ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-amber-800">Your Turn!</h4>
                        <button onClick={() => handleReadAloud(level.prompt, 'prompt')} disabled={!!audioLoading} className="text-amber-600 hover:text-amber-800 disabled:text-gray-300">
                            {audioLoading === 'prompt' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <p className="text-amber-700 mt-1 text-lg">{level.prompt}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Write Your Letter Here</h3>
                <div className="space-y-4 mb-4">
                    {milestoneGroups.map(group => (
                        <div key={group}>
                            <h4 className="font-bold text-gray-600">{group}</h4>
                            <div className="pl-4 border-l-2 space-y-2 mt-1">
                                {milestones.filter(m => m.group === group).map(m => (
                                    <Milestone key={m.part} label={m.part} completed={m.completed} hint={m.hint} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-4 border border-gray-300 rounded-lg h-80 focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed"/>
                <button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                    {isLoading ? <Spinner /> : "Check My Letter"}
                </button>
                {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
            </div>
        </div>
    );
};

const PersonalNarrativeTaskView: React.FC<{ level: PersonalNarrativeLevel, onComplete: () => void, onLevelComplete: () => void, gradeLevel: string }> = ({ level, onComplete, onLevelComplete, gradeLevel }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brainstorm, setBrainstorm] = useState({ who: '', where: '', what: '', feelings: '' });
    const [isBrainstormComplete, setIsBrainstormComplete] = useState(false);
    const [brainstormFeedback, setBrainstormFeedback] = useState<BrainstormCoherenceFeedback | null>(null);
    const [milestones, setMilestones] = useState([
        { group: 'Introduction', part: 'Write your first sentence.', completed: false, hint: "Start your story by telling who it is about and where it happened." },
        { group: 'Introduction', part: 'Write your second sentence.', completed: false, hint: "Add another sentence to set the scene. Make sure it ends with a period (.), question mark (?), or exclamation mark (!)." },
        { group: 'Body', part: 'Start the body with a time-order word.', completed: false, hint: "Use words like 'First,', 'Next,', or 'After that,' to help your reader follow the story." },
        { group: 'Body', part: 'Write what happened first.', completed: false, hint: "Describe the first event in your story in a full sentence." },
        { group: 'Body', part: 'Write what happened next.', completed: false, hint: "What happened after that? Write another full sentence." },
        { group: 'Body', part: 'Write one more event.', completed: false, hint: "What was the last thing that happened in the middle of your story?" },
        { group: 'Conclusion', part: 'Start the conclusion with a closing word.', completed: false, hint: "Use a word like 'Finally,' or 'In the end,' to show your story is finishing." },
        { group: 'Conclusion', part: 'Write your final sentence.', completed: false, hint: "Tell how you felt or what you learned to wrap up your story." }
    ]);
    const [audioLoading, setAudioLoading] = useState<string | null>(null);
    const [nowReading, setNowReading] = useState<string | null>(null);

    const handleReadAloud = async (textToRead: string, id: string) => {
        if (audioLoading) return;
        setAudioLoading(id);
        try {
            const audioB64 = await generateSpeech(textToRead);
            setNowReading(id);
            await playAudio(audioB64);
        } catch(e) {
            console.error("Audio generation failed", e);
        } finally {
            setAudioLoading(null);
            setNowReading(null);
        }
    };

    useEffect(() => {
        const paragraphs = text.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const newMilestones = JSON.parse(JSON.stringify(milestones));
        const getSentences = (p: string | undefined) => p ? p.match(/[^.!?]+[.!?]+/g) || [] : [];
        const introSentences = getSentences(paragraphs[0]);
        newMilestones[0].completed = isSentenceValid(introSentences[0]);
        newMilestones[1].completed = isSentenceValid(introSentences[1]);
        const bodyParagraph = paragraphs[1];
        const bodySentences = getSentences(bodyParagraph);
        const timeOrderWords = ['first', 'next', 'then', 'after that', 'later'];
        newMilestones[2].completed = bodyParagraph ? timeOrderWords.some(word => bodyParagraph.trim().toLowerCase().startsWith(word)) : false;
        newMilestones[3].completed = isSentenceValid(bodySentences[0]);
        newMilestones[4].completed = isSentenceValid(bodySentences[1]);
        newMilestones[5].completed = isSentenceValid(bodySentences[2]);
        const conclusionParagraph = paragraphs[2];
        const conclusionSentences = getSentences(conclusionParagraph);
        const closingWords = ['finally', 'in the end', 'at last', 'lastly'];
        newMilestones[6].completed = conclusionParagraph ? closingWords.some(word => conclusionParagraph.trim().toLowerCase().startsWith(word)) : false;
        newMilestones[7].completed = isSentenceValid(conclusionSentences[0]);
        setMilestones(newMilestones);
    }, [text]);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setBrainstormFeedback(null);
        try {
            const [writingResult, coherenceResult] = await Promise.all([
                checkPersonalNarrative(text, gradeLevel),
                checkBrainstormCoherence(brainstorm, text, gradeLevel)
            ]);
            setBrainstormFeedback(coherenceResult);
            const score = writingResult.scores.total;
            if (score === 20) {
                onLevelComplete();
            } else {
                setError(`Great effort! You scored ${score}/20. You need a perfect score to unlock the next level.`);
            }
        } catch (err) { setError('Could not get feedback. Please try again.'); } finally { setIsLoading(false); }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Example: {level.title}</h3>
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-700">Example Brainstorm Plan</h4>
                         <button onClick={() => handleReadAloud(Object.values(level.example.brainstorm).join('. '), 'brainstorm')} disabled={!!audioLoading} className="text-indigo-500 hover:text-indigo-700 disabled:text-gray-300">
                            {audioLoading === 'brainstorm' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <p className="text-sm text-indigo-700 mb-2">A good story starts with a plan!</p>
                    <p><b>Who:</b> {level.example.brainstorm.who}</p>
                    <p><b>Where:</b> {level.example.brainstorm.where}</p>
                    <p><b>What:</b> {level.example.brainstorm.what}</p>
                    <p><b>Feelings:</b> {level.example.brainstorm.feelings}</p>
                </div>
                 <div className={`p-4 bg-gray-100 rounded-lg whitespace-pre-wrap font-serif text-gray-700 border text-lg leading-relaxed ${nowReading === 'example' ? 'ring-2 ring-yellow-400' : ''}`}>
                    {level.example.narrative}
                </div>
                <div className={`mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg ${nowReading === 'prompt' ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-amber-800">Your Turn!</h4>
                        <button onClick={() => handleReadAloud(level.prompt, 'prompt')} disabled={!!audioLoading} className="text-amber-600 hover:text-amber-800 disabled:text-gray-300">
                            {audioLoading === 'prompt' ? <Spinner className="w-5 h-5"/> : <SpeakerIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <p className="text-amber-700 mt-1 text-lg">{level.prompt}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                 {!isBrainstormComplete ? (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Brainstorm Helper</h3>
                        <p className="text-gray-600 mb-4">First, plan your story. This will help you write a great narrative!</p>
                        <div className="space-y-4">
                           <BrainstormInput label="Who was in your story?" value={brainstorm.who} onChange={e => setBrainstorm(p => ({...p, who: e.target.value}))} />
                           <BrainstormInput label="Where did the story happen?" value={brainstorm.where} onChange={e => setBrainstorm(p => ({...p, where: e.target.value}))} />
                           <BrainstormInput label="What happened in the story?" value={brainstorm.what} onChange={e => setBrainstorm(p => ({...p, what: e.target.value}))} />
                           <BrainstormInput label="How did you feel?" value={brainstorm.feelings} onChange={e => setBrainstorm(p => ({...p, feelings: e.target.value}))} />
                        </div>
                        <button onClick={() => setIsBrainstormComplete(true)} 
disabled={Object.values(brainstorm).some((v: unknown) => !(v as string).trim())} className="mt-6 w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
                           Start Writing
                        </button>
                    </div>
                 ) : (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Write Your Story Here</h3>
                         <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                             <p className="text-sm font-bold text-indigo-700">Your Plan:</p>
                             <p className="text-sm text-gray-800"><b>Who:</b> {brainstorm.who} | <b>Where:</b> {brainstorm.where} | <b>What:</b> {brainstorm.what} | <b>Feelings:</b> {brainstorm.feelings}</p>
                        </div>
                        <div className="space-y-4 mb-4">
                            <div>
                                <h4 className="font-bold text-gray-600">Introduction</h4>
                                <div className="pl-4 border-l-2 space-y-2 mt-1">
                                    {milestones.filter(m => m.group === 'Introduction').map(m => <Milestone key={m.part} label={m.part} completed={m.completed} hint={m.hint} />)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-600">Body</h4>
                                <div className="pl-4 border-l-2 space-y-2 mt-1">
                                    {milestones.filter(m => m.group === 'Body').map(m => <Milestone key={m.part} label={m.part} completed={m.completed} hint={m.hint} />)}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-600">Conclusion</h4>
                                <div className="pl-4 border-l-2 space-y-2 mt-1">
                                    {milestones.filter(m => m.group === 'Conclusion').map(m => <Milestone key={m.part} label={m.part} completed={m.completed} hint={m.hint} />)}
                                </div>
                            </div>
                        </div>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-4 border border-gray-300 rounded-lg h-80 focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed" placeholder="Start writing your story..."/>
                        <button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center">
                            {isLoading ? <Spinner /> : "Check My Story"}
                        </button>
                        {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
                        {brainstormFeedback && (
                            <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                                <h4 className="font-bold text-purple-800">Brainstorm Check ({brainstormFeedback.coherenceScore}/5)</h4>
                                <p className="text-sm text-gray-700 mt-2">{brainstormFeedback.positiveFeedback}</p>
                                {brainstormFeedback.improvementSuggestion && (
                                    <p className="text-sm text-gray-700 mt-1"><b>Suggestion:</b> {brainstormFeedback.improvementSuggestion}</p>
                                )}
                            </div>
                        )}
                    </div>
                 )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const GuidedWriting: React.FC<GuidedWritingProps> = ({ onComplete, curriculum }) => {
    const gradeLevel = curriculum.gradeLevel;
    const { personalNarrativeLevels, letterWritingLevels } = curriculum.guidedWriting;
    const [view, setView] = useState<'menu' | 'levelSelection' | 'task'>('menu');
    const [writingType, setWritingType] = useState<'personalNarrative' | 'letterWriting' | null>(null);
    const [selectedLevelIndex, setSelectedLevelIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState({ personalNarrative: 1, letterWriting: 1 });
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    
    const [unlockModalState, setUnlockModalState] = useState<{isOpen: boolean; levelToUnlock: number | null}>({isOpen: false, levelToUnlock: null});
    const [unlockError, setUnlockError] = useState('');

    const [jumpKeyInput, setJumpKeyInput] = useState({ word: '', answer: '' });
    const [jumpKeyQuestion, setJumpKeyQuestion] = useState<string | null>(null);
    const [jumpKeyError, setJumpKeyError] = useState('');

    useEffect(() => {
        if (!writingType) return;
        const allLevels = writingType === 'personalNarrative' ? personalNarrativeLevels : letterWritingLevels;
        const matchedLevel = allLevels.find(l => l.secretKey.word.toLowerCase() === jumpKeyInput.word.toLowerCase().trim());
        if (matchedLevel) {
            setJumpKeyQuestion(matchedLevel.secretKey.question);
        } else {
            setJumpKeyQuestion(null);
        }
    }, [jumpKeyInput.word, writingType]);


    const handleSelectWritingType = (type: 'personalNarrative' | 'letterWriting') => {
        setWritingType(type);
        setView('levelSelection');
    };
    
    const handleLevelSelect = (levelIndex: number) => {
        setSelectedLevelIndex(levelIndex);
        setView('task');
    };

    const handleLevelComplete = () => {
        setShowCompletionModal(true);
    };
    
    const handleAttemptUnlock = (keyInput: string) => {
        if (!writingType || !unlockModalState.levelToUnlock) return;

        const levelToUnlock = unlockModalState.levelToUnlock;
        const levels = writingType === 'personalNarrative' ? personalNarrativeLevels : letterWritingLevels;
        const requiredKey = levels[levelToUnlock - 2].secretKey.word;

        if (keyInput.toLowerCase().trim() === requiredKey.toLowerCase().trim()) {
            setProgress(prev => ({...prev, [writingType]: levelToUnlock}));
            setUnlockModalState({isOpen: false, levelToUnlock: null});
            setUnlockError('');
        } else {
            setUnlockError('That secret word is not correct. Try again!');
        }
    };
    
    const handleJumpKeyUnlock = () => {
        if (!writingType || !jumpKeyQuestion || jumpKeyInput.answer.trim().length < 10) {
            setJumpKeyError('Please enter a valid secret word and a thoughtful answer (at least 10 characters).');
            return;
        }
    
        const levels = writingType === 'personalNarrative' ? personalNarrativeLevels : letterWritingLevels;
        const matchedLevel = levels.find(l => l.secretKey.word.toLowerCase() === jumpKeyInput.word.toLowerCase().trim());
        
        if (matchedLevel) {
            const currentMax = progress[writingType];
            const newMax = Math.max(currentMax, matchedLevel.level);
            setProgress(prev => ({...prev, [writingType]: newMax}));
            setJumpKeyInput({ word: '', answer: '' });
            setJumpKeyError('');
        } else {
            setJumpKeyError('That secret word was not found. Check your spelling!');
        }
    };
    
    const renderLevelSelection = () => {
        if (!writingType) return null;
        const levels = writingType === 'personalNarrative' ? personalNarrativeLevels : letterWritingLevels;
        const maxUnlocked = progress[writingType];
        const categoryName = writingType === 'personalNarrative' ? 'Personal Narrative' : 'Letter Writing';

        return (
            <div className="max-w-4xl mx-auto p-4">
                 <button onClick={() => setView('menu')} className="text-blue-600 hover:underline mb-4">&larr; Back to Menu</button>
                 <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">{categoryName}</h2>
                 <p className="text-gray-600 mb-8 text-center">Complete a level with a perfect score to earn the key for the next one!</p>
                 <div className="flex flex-wrap gap-5 p-4 bg-sky-100/60 rounded-lg justify-center">
                    {levels.map((level, index) => {
                        const isUnlocked = level.level <= maxUnlocked;
                        const isReadyToUnlock = level.level === maxUnlocked + 1;
                        
                        let buttonClasses = "flex flex-col items-center justify-center w-28 h-28 rounded-lg border-2 transition-all shadow-md ";
                        let content = null;
                        
                        if (isUnlocked) {
                             buttonClasses += "bg-white border-blue-400 text-blue-700 hover:bg-blue-50 hover:-translate-y-1";
                             content = <span className="text-3xl font-bold">{level.level}</span>;
                        } else if (isReadyToUnlock) {
                            buttonClasses += "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 hover:-translate-y-1 cursor-pointer";
                            content = <KeyIcon className="w-8 h-8 text-amber-500"/>
                        } else {
                            buttonClasses += "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed";
                            content = <LockIcon className="w-8 h-8 text-gray-400"/>;
                        }

                        return (
                            <button 
                                key={level.level} 
                                disabled={!isUnlocked && !isReadyToUnlock} 
                                onClick={() => {
                                    if (isUnlocked) handleLevelSelect(index);
                                    if (isReadyToUnlock) setUnlockModalState({isOpen: true, levelToUnlock: level.level});
                                }} 
                                className={buttonClasses}
                            >
                                {content}
                                <span className="text-sm font-semibold mt-1">Level {level.level}</span>
                            </button>
                        );
                    })}
                 </div>
                 <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-700">Jump to a Level</h3>
                    <p className="text-sm text-gray-500 mb-3">Already earned a Secret Word and want to practice again? Enter it here!</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Secret Word</label>
                            <input 
                                type="text" 
                                value={jumpKeyInput.word} 
                                onChange={e => setJumpKeyInput(p => ({ ...p, word: e.target.value }))} 
                                placeholder="e.g., KINDNESS" 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        {jumpKeyQuestion && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">{jumpKeyQuestion}</label>
                                <textarea
                                    value={jumpKeyInput.answer}
                                    onChange={e => setJumpKeyInput(p => ({ ...p, answer: e.target.value }))}
                                    placeholder="Write your thoughtful answer here..."
                                    rows={2}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                        )}
                    </div>
                    <button onClick={handleJumpKeyUnlock} className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
                        Unlock with My Answer
                    </button>
                    {jumpKeyError && <p className="text-red-500 text-sm mt-2">{jumpKeyError}</p>}
                 </div>
            </div>
        );
    };

    if (view === 'task' && writingType && selectedLevelIndex !== null) {
        const levels = writingType === 'personalNarrative' ? personalNarrativeLevels : letterWritingLevels;
        const currentLevel = levels[selectedLevelIndex];
        const nextLevel = levels[selectedLevelIndex + 1];
        return (
            <div>
                 <button onClick={() => setView('levelSelection')} className="text-blue-600 hover:underline mb-4 max-w-5xl mx-auto px-4">&larr; Back to Levels</button>
                 {writingType === 'personalNarrative' ? 
                    <PersonalNarrativeTaskView gradeLevel={gradeLevel} level={currentLevel as PersonalNarrativeLevel} onLevelComplete={handleLevelComplete} onComplete={onComplete as any} /> :
                    <LetterWritingTaskView gradeLevel={gradeLevel} level={currentLevel as LetterWritingLevel} onLevelComplete={handleLevelComplete} onComplete={onComplete as any} />
                 }
                 {showCompletionModal && nextLevel && (
                     <CompletionModal 
                        nextLevelKey={currentLevel.secretKey}
                        onContinue={() => {
                            setShowCompletionModal(false);
                            setView('levelSelection');
                        }}
                     />
                 )}
                 {showCompletionModal && !nextLevel && (
                     <CompletionModal
                        nextLevelKey={{word: "ALL DONE!", question: ""}}
                        onContinue={() => {
                            setShowCompletionModal(false);
                            setView('levelSelection');
                        }}
                     />
                 )}
            </div>
        );
    }
    
    if (view === 'levelSelection') {
        return (
            <>
                {renderLevelSelection()}
                {unlockModalState.isOpen && unlockModalState.levelToUnlock && (
                    <UnlockLevelModal 
                        levelToUnlock={unlockModalState.levelToUnlock}
                        onUnlock={handleAttemptUnlock}
                        onClose={() => {
                            setUnlockModalState({isOpen: false, levelToUnlock: null});
                            setUnlockError('');
                        }}
                        error={unlockError}
                    />
                )}
            </>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Guided Writing</h2>
            <p className="text-gray-600 mb-8">Choose a style and get interactive help as you write!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => handleSelectWritingType('personalNarrative')} className="p-8 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col">
                    <WritingIcon className="w-10 h-10 text-blue-500 mb-4" />
                    <h3 className="text-xl font-semibold text-blue-700">Personal Narrative</h3>
                    <p className="text-gray-500 mt-1">Write a story about yourself.</p>
                </button>
                 <button onClick={() => handleSelectWritingType('letterWriting')} className="p-8 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col">
                    <UploadIcon className="w-10 h-10 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-green-700">Informal Letter</h3>
                    <p className="text-gray-500 mt-1">Write a friendly letter.</p>
                </button>
            </div>
        </div>
    );
};