import React, { useState, useRef, useEffect } from 'react';
import type { LeveledText, WordDefinition, TranslatedText, Curriculum, ContentAssignment } from '../types';
import { generateLeveledText, getWordDefinition, translateText, generateSpeech } from '../services/geminiService';
import { Spinner, CheckCircleIcon, CopyIcon, SpeakerIcon, TranslateIcon, CloseIcon, UsersIcon } from './common/Icons';
import { playAudio } from '../utils/audioUtils';

interface TextLevelerProps {
    curriculum: Curriculum;
    onUpdateAssignments?: (newAssignments: ContentAssignment[]) => void;
}

const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'ur', name: 'Urdu' }
];

type LevelKey = 'low' | 'medium' | 'gradeSpecific';

export const TextLeveler: React.FC<TextLevelerProps> = ({ curriculum, onUpdateAssignments }) => {
    const [originalText, setOriginalText] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [leveledText, setLeveledText] = useState<LeveledText | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [definition, setDefinition] = useState<{ data: WordDefinition, position: { top: number, left: number } } | null>(null);
    const [isDefining, setIsDefining] = useState(false);
    const [audioState, setAudioState] = useState<{ playing: LevelKey | null, loading: LevelKey | null }>({ playing: null, loading: null });
    const [translations, setTranslations] = useState<Record<LevelKey, TranslatedText | null>>({ low: null, medium: null, gradeSpecific: null });
    const [isTranslating, setIsTranslating] = useState<LevelKey | null>(null);
    const [showTranslated, setShowTranslated] = useState<Record<LevelKey, boolean>>({ low: false, medium: false, gradeSpecific: false });
    const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
    
    const definitionRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (definitionRef.current && !definitionRef.current.contains(event.target as Node)) {
                setDefinition(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async () => {
        if (!originalText.trim()) {
            setError('Please enter some text to level.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLeveledText(null);
        setDefinition(null);
        setTranslations({ low: null, medium: null, gradeSpecific: null });
        setShowTranslated({ low: false, medium: false, gradeSpecific: false });
        try {
            const result = await generateLeveledText(originalText, curriculum.gradeLevel, suggestions);
            setLeveledText(result.leveledPassages);
        } catch (e) {
            console.error(e);
            setError('Failed to generate text versions. The AI may be busy, please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = (levelKey: LevelKey, targetGroup: 'Needs Support' | 'Developing' | 'Mastery' | 'All') => {
        if (!leveledText || !onUpdateAssignments) return;
        
        const textContent = leveledText[levelKey];
        // Filter students based on group
        const allStudents = curriculum.studentProfiles.map(p => p.name); // Get all profiled students
        // Note: if no profiles exist for students, we might need to pull from roster. 
        // For now, assume Admin has visited console or students have logged in.
        
        let studentsToAssign: string[] = [];
        if (targetGroup === 'All') {
             studentsToAssign = allStudents.length > 0 ? allStudents : ['(All Students - Setup Profiles First)'];
        } else {
             studentsToAssign = curriculum.studentProfiles.filter(p => p.masteryLevel === targetGroup).map(p => p.name);
        }
            
        if (studentsToAssign.length === 0 && targetGroup !== 'All') {
            alert(`No students found in '${targetGroup}'. Go to Admin Console > Mastery Groups to sort students.`);
            return;
        }

        const newAssignments: ContentAssignment[] = studentsToAssign.map(name => ({
            id: `leveled-${Date.now()}-${name}`,
            moduleId: 'textLeveler',
            activityType: 'leveled-text',
            studentName: name,
            contentPayload: textContent,
            dateAssigned: new Date().toISOString().split('T')[0]
        }));

        onUpdateAssignments([...curriculum.assignments, ...newAssignments]);
        setAssignmentStatus(`Assigned ${levelKey} version to ${targetGroup} (${newAssignments.length} students)!`);
        setTimeout(() => setAssignmentStatus(null), 3000);
    };

    const handleWordClick = async (e: React.MouseEvent<HTMLParagraphElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'SPAN') return;

        const word = target.innerText.replace(/[.,!?;:"']/g, '').trim();
        if (!word || word.length < 2) return;

        const rect = target.getBoundingClientRect();
        setDefinition({ data: {word: '', definition: '', partOfSpeech: ''}, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX } });
        setIsDefining(true);

        try {
            const result = await getWordDefinition(word, curriculum.gradeLevel);
            setDefinition(prev => prev ? { ...prev, data: result } : null);
        } catch (err) {
            setDefinition(null);
            console.error("Definition failed:", err);
        } finally {
            setIsDefining(false);
        }
    };

    const handlePlayAudio = async (level: LevelKey) => {
        if (!leveledText || audioState.loading || audioState.playing) return;
        setAudioState({ playing: null, loading: level });
        try {
            const textToRead = (showTranslated[level] && translations[level]) ? translations[level]!.translatedText : leveledText[level];
            const audioB64 = await generateSpeech(textToRead);
            setAudioState({ playing: level, loading: null });
            await playAudio(audioB64);
        } catch (e) {
            console.error("Audio playback failed:", e);
        } finally {
            setAudioState({ playing: null, loading: null });
        }
    };
    
    const handleTranslate = async (level: LevelKey, languageCode: string) => {
        if(!leveledText) return;
        setIsTranslating(level);
        try {
            const result = await translateText(leveledText[level], languageCode);
            setTranslations(prev => ({...prev, [level]: result}));
            setShowTranslated(prev => ({...prev, [level]: true}));
        } catch (e) {
            console.error("Translation failed:", e);
        } finally {
            setIsTranslating(null);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
             <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800">Interactive Text Tool</h2>
                <p className="text-gray-600 mt-2">Generate leveled reading, translate it, and assign it to students.</p>
            </div>
            {assignmentStatus && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-pulse text-center">
                    {assignmentStatus}
                </div>
            )}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste any text here from a book, website, or your own writing..."
                />
                <textarea
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    rows={2}
                    className="mt-2 w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400"
                    placeholder="Optional: Give the AI suggestions (e.g., 'make it a poem', 'add the word magnificent')..."
                />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? <Spinner /> : 'Level Text'}
                </button>
                {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
            </div>

            {isLoading && (
                 <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <div className="flex justify-center"><Spinner className="h-8 w-8 text-blue-500" /></div>
                    <p className="mt-2 text-gray-600">AI is rewriting the text for you...</p>
                </div>
            )}
            
            {definition && (
                <div ref={definitionRef} style={{ top: `${definition.position.top}px`, left: `${definition.position.left}px` }} className="absolute z-20 w-64 bg-white p-4 rounded-lg shadow-xl border">
                    {isDefining ? <div className="flex justify-center"><Spinner className="h-5 w-5 text-gray-600"/></div> : (
                        <>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h5 className="font-bold text-gray-800">{definition.data.word}</h5>
                                    <p className="text-xs italic text-gray-500">{definition.data.partOfSpeech}</p>
                                </div>
                                <button onClick={() => setDefinition(null)}><CloseIcon className="w-5 h-5 text-gray-400 hover:text-gray-700"/></button>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{definition.data.definition}</p>
                        </>
                    )}
                </div>
            )}


            {leveledText && (
                <div className="grid md:grid-cols-3 gap-6">
                    {(Object.keys(leveledText) as LevelKey[]).map(key => (
                        <TextCard
                            key={key}
                            levelKey={key}
                            title={key === 'low' ? 'Easier' : key === 'medium' ? 'Standard' : curriculum.gradeLevel}
                            titleColor={key === 'low' ? 'text-green-700' : key === 'medium' ? 'text-blue-700' : 'text-purple-700'}
                            text={leveledText[key]}
                            onWordClick={handleWordClick}
                            audioState={audioState}
                            onPlayAudio={handlePlayAudio}
                            translation={translations[key]}
                            isTranslating={isTranslating === key}
                            showTranslated={showTranslated[key]}
                            onTranslate={handleTranslate}
                            onToggleTranslate={() => setShowTranslated(p => ({...p, [key]: !p[key]}))}
                            onAssign={(group) => handleAssign(key, group)}
                            showAssign={!!onUpdateAssignments}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface TextCardProps {
    levelKey: LevelKey;
    title: string;
    titleColor: string;
    text: string;
    onWordClick: (e: React.MouseEvent<HTMLParagraphElement>) => void;
    audioState: { playing: LevelKey | null, loading: LevelKey | null };
    onPlayAudio: (level: LevelKey) => void;
    translation: TranslatedText | null;
    isTranslating: boolean;
    showTranslated: boolean;
    onTranslate: (level: LevelKey, lang: string) => void;
    onToggleTranslate: () => void;
    onAssign: (group: 'Needs Support' | 'Developing' | 'Mastery' | 'All') => void;
    showAssign: boolean;
}

const TextCard: React.FC<TextCardProps> = ({ levelKey, title, titleColor, text, onWordClick, audioState, onPlayAudio, translation, isTranslating, showTranslated, onTranslate, onToggleTranslate, onAssign, showAssign }) => {
    const [copyStatus, setCopyStatus] = useState(false);
    const [showTranslateMenu, setShowTranslateMenu] = useState(false);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const textToShow = (showTranslated && translation) ? translation.translatedText : text;

    const handleCopy = () => {
        navigator.clipboard.writeText(textToShow).then(() => {
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        });
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col relative">
            <div className="flex justify-between items-center mb-2">
                <h4 className={`text-lg font-bold ${titleColor}`}>{title} Version</h4>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onPlayAudio(levelKey)} disabled={!!audioState.loading || !!audioState.playing} className="text-gray-400 hover:text-gray-700 disabled:text-gray-300">
                        {audioState.loading === levelKey ? <Spinner className="w-5 h-5 text-gray-500" /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowTranslateMenu(!showTranslateMenu)} className="text-gray-400 hover:text-gray-700">
                            <TranslateIcon className="w-5 h-5" />
                        </button>
                         {showTranslateMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                                {languages.map(lang => (
                                    <button key={lang.code} onClick={() => { onTranslate(levelKey, lang.name); setShowTranslateMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`text-base leading-relaxed text-gray-700 whitespace-pre-wrap mb-4 flex-grow min-h-[150px] p-2 rounded-md transition-all ${audioState.playing === levelKey ? 'bg-yellow-100 ring-2 ring-yellow-300' : 'bg-gray-50'}`}>
                {isTranslating ? (
                    <div className="flex items-center justify-center h-full"><Spinner className="w-6 h-6 text-gray-500" /></div>
                ) : (
                    <p onClick={onWordClick} className="cursor-pointer">
                        {textToShow.split(/(\s+)/).map((segment, i) =>
                            /\s+/.test(segment) ? segment : <span key={i} className="hover:bg-yellow-200 rounded">{segment}</span>
                        )}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto gap-2">
                 <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex items-center justify-center text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                        {copyStatus ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                        {copyStatus ? 'Copied!' : 'Copy'}
                    </button>
                    {translation && (
                        <button onClick={onToggleTranslate} className="text-xs font-semibold text-blue-600 hover:underline">
                            {showTranslated ? 'Show Original' : 'Show Translation'}
                        </button>
                    )}
                 </div>
                 {showAssign && (
                     <div className="relative">
                        <button onClick={() => setShowAssignMenu(!showAssignMenu)} className="flex items-center justify-center text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 font-semibold">
                            <UsersIcon className="w-3 h-3 mr-1"/> Assign
                        </button>
                        {showAssignMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                                <p className="text-xs text-gray-500 p-2 border-b">Assign to Group:</p>
                                <button onClick={() => {onAssign('All'); setShowAssignMenu(false)}} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">All Students</button>
                                <button onClick={() => {onAssign('Needs Support'); setShowAssignMenu(false)}} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Needs Support</button>
                                <button onClick={() => {onAssign('Developing'); setShowAssignMenu(false)}} className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50">Developing</button>
                                <button onClick={() => {onAssign('Mastery'); setShowAssignMenu(false)}} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50">Mastery</button>
                            </div>
                        )}
                     </div>
                 )}
            </div>
        </div>
    );
};