import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { ActivityRecord, Student, PersonalNarrativeLevel, LetterWritingLevel, LeveledText, CustomReadingActivity, QuizQuestion, LeveledTextWithVocabulary, VocabularyLesson, VocabularyLessonCard, StudentProfile, ContentAssignment, ModuleId, MasteryGroup } from '../types';
import { QuizQuestionType } from '../types';
import { defaultCurriculum, Curriculum, studentsByGrade } from '../curriculum';
import { EditIcon } from './common/Icons';

const EditableTagList: React.FC<{
    title: string;
    items: string[];
    onItemsChange: (newItems: string[]) => void;
}> = ({ title, items, onItemsChange }) => {
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (newItem && !items.includes(newItem)) {
            onItemsChange([...items, newItem]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (itemToRemove: string) => {
        onItemsChange(items.filter(item => item !== itemToRemove));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {items.map(item => (
                    <span key={item} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {item}
                        <button onClick={() => handleRemoveItem(item)} className="ml-2 text-blue-600 hover:text-blue-800">
                            &times;
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    className="flex-grow p-2 border border-gray-300 rounded-lg"
                    placeholder="Add new item..."
                />
                <button onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg">
                    Add
                </button>
            </div>
        </div>
    );
};

const FeatureToggle: React.FC<{ label: string; enabled: boolean; onToggle: (enabled: boolean) => void }> = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="font-semibold text-gray-700">{label}</span>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => onToggle(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
        </div>
        <style>{`.toggle-checkbox:checked { right: 0; border-color: #48bb78; } .toggle-checkbox:checked + .toggle-label { background-color: #48bb78; }`}</style>
    </div>
);

const MasteryGroupManager: React.FC<{
    curriculum: Curriculum;
    onUpdateProfiles: (profiles: StudentProfile[]) => void;
}> = ({ curriculum, onUpdateProfiles }) => {
    
    const students = Object.values(studentsByGrade).flat();
    
    const getGroup = (level: string | undefined) => level || 'Developing'; // Default to developing

    const groups = useMemo(() => {
        const g: Record<string, string[]> = { 'Needs Support': [], 'Developing': [], 'Mastery': [] };
        students.forEach(s => {
            const profile = curriculum.studentProfiles.find(p => p.name === s);
            const level = getGroup(profile?.masteryLevel);
            if (g[level]) g[level].push(s);
        });
        return g;
    }, [students, curriculum.studentProfiles]);

    const handleMove = (studentName: string, newLevel: 'Needs Support' | 'Developing' | 'Mastery') => {
        let newProfiles = [...curriculum.studentProfiles];
        const existingIndex = newProfiles.findIndex(p => p.name === studentName);
        
        if (existingIndex >= 0) {
            newProfiles[existingIndex] = { ...newProfiles[existingIndex], masteryLevel: newLevel };
        } else {
            newProfiles.push({ name: studentName, needsSupport: false, primaryLanguage: '', masteryLevel: newLevel });
        }
        onUpdateProfiles(newProfiles);
    };

    const toggleSpecialNeeds = (studentName: string) => {
        let newProfiles = [...curriculum.studentProfiles];
        const existingIndex = newProfiles.findIndex(p => p.name === studentName);
        
        if (existingIndex >= 0) {
            const current = newProfiles[existingIndex].isSpecialNeeds;
            newProfiles[existingIndex] = { ...newProfiles[existingIndex], isSpecialNeeds: !current };
        } else {
            newProfiles.push({ name: studentName, needsSupport: false, primaryLanguage: '', isSpecialNeeds: true });
        }
        onUpdateProfiles(newProfiles);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Mastery Groups & Special Support</h3>
            <p className="text-gray-500 text-sm">Categorize students. Use "Special Needs / High Freq" to make a student appear 3x more often in the picker.</p>
            <div className="grid md:grid-cols-3 gap-6">
                {(['Needs Support', 'Developing', 'Mastery'] as const).map(group => (
                    <div key={group} className={`rounded-xl shadow-lg overflow-hidden border-t-4 ${group === 'Needs Support' ? 'border-red-500' : group === 'Mastery' ? 'border-green-500' : 'border-yellow-500'}`}>
                        <div className="bg-white p-4 border-b">
                            <h4 className="font-bold text-lg">{group}</h4>
                            <p className="text-sm text-gray-500">{groups[group].length} students</p>
                        </div>
                        <div className="bg-gray-50 p-4 max-h-96 overflow-y-auto">
                            {groups[group].map(student => {
                                const profile = curriculum.studentProfiles.find(p => p.name === student);
                                return (
                                <div key={student} className="bg-white p-3 rounded shadow-sm mb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">{student}</span>
                                        <div className="flex space-x-1">
                                            {group !== 'Needs Support' && <button onClick={() => handleMove(student, 'Needs Support')} className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-600" title="Move to Support"></button>}
                                            {group !== 'Developing' && <button onClick={() => handleMove(student, 'Developing')} className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-600" title="Move to Developing"></button>}
                                            {group !== 'Mastery' && <button onClick={() => handleMove(student, 'Mastery')} className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-600" title="Move to Mastery"></button>}
                                        </div>
                                    </div>
                                    <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={!!profile?.isSpecialNeeds}
                                            onChange={() => toggleSpecialNeeds(student)}
                                        />
                                        <span>Special Needs / High Freq (3x)</span>
                                    </label>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ModuleAssigner: React.FC<{
    curriculum: Curriculum;
    onUpdateAssignments: (assignments: ContentAssignment[]) => void;
}> = ({ curriculum, onUpdateAssignments }) => {
    const [selectedModule, setSelectedModule] = useState<ModuleId | ''>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    
    const modules: {id: ModuleId, label: string}[] = [
        { id: 'writing', label: 'Writing Checker' },
        { id: 'grammar', label: 'Grammar Practice' },
        { id: 'reading', label: 'Reading Comprehension' },
        { id: 'coverTheBasics', label: 'Cover The Basics' },
        { id: 'learnToWrite', label: 'Learn To Write' },
        { id: 'guidedWriting', label: 'Guided Writing' },
        { id: 'vocabulary', label: 'Vocabulary' },
        { id: 'spellingStation', label: 'Spelling Station' },
        { id: 'textLeveler', label: 'Text Leveler Tool' },
        { id: 'diaryLog', label: 'Diary Log' }
    ];

    const handleAssign = () => {
        if (!selectedModule || selectedStudents.length === 0) return;
        const newAssignments: ContentAssignment[] = selectedStudents.map(s => ({
            id: `${selectedModule}-${s}-${Date.now()}`,
            moduleId: selectedModule,
            activityType: 'module',
            studentName: s,
            dateAssigned: new Date().toISOString().split('T')[0]
        }));
        onUpdateAssignments([...curriculum.assignments, ...newAssignments]);
        setSelectedStudents([]);
        alert(`Module assigned to ${selectedStudents.length} students!`);
    };
    
    const handleSelectGroup = (group: 'Needs Support' | 'Developing' | 'Mastery') => {
        const students = Object.values(studentsByGrade).flat().filter(s => {
            const p = curriculum.studentProfiles.find(pro => pro.name === s);
            // Default to 'Developing' if no profile exists yet
            return (p?.masteryLevel || 'Developing') === group;
        });
        setSelectedStudents(students);
    };
    
    const handleClearAssignments = () => {
        if(confirm("Clear ALL module assignments? Students will no longer see assigned modules on their dashboard.")) {
             onUpdateAssignments(curriculum.assignments.filter(a => a.activityType !== 'module'));
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Classroom Manager & Assignments</h3>
                <button onClick={handleClearAssignments} className="text-xs text-red-600 hover:underline">Reset All Assignments</button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block font-bold text-gray-700 mb-2">1. Select Module to Unlock</label>
                    <select className="w-full p-3 border rounded-lg" value={selectedModule} onChange={e => setSelectedModule(e.target.value as ModuleId)}>
                        <option value="">-- Select Module --</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block font-bold text-gray-700 mb-2">2. Select Students</label>
                    <div className="flex gap-2 mb-2">
                        <button onClick={() => handleSelectGroup('Needs Support')} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Support Group</button>
                        <button onClick={() => handleSelectGroup('Developing')} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Dev Group</button>
                        <button onClick={() => handleSelectGroup('Mastery')} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Mastery Group</button>
                    </div>
                    <div className="border rounded-lg h-40 overflow-y-auto p-2 bg-gray-50">
                        {Object.values(studentsByGrade).flat().sort().map(s => (
                            <label key={s} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                                <input type="checkbox" checked={selectedStudents.includes(s)} onChange={() => {
                                    setSelectedStudents(prev => prev.includes(s) ? prev.filter(n => n !== s) : [...prev, s]);
                                }} />
                                <span className="text-sm text-gray-700">{s}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={handleAssign} disabled={!selectedModule || selectedStudents.length === 0} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">
                Assign Access
            </button>
        </div>
    );
};

const CurriculumManager: React.FC<{
    curriculum: Curriculum;
    onUpdate: (newCurriculum: Curriculum) => void;
}> = ({ curriculum, onUpdate }) => {
    
    const toggleFeature = (feature: keyof typeof curriculum.featureToggles, enabled: boolean) => {
        const updated = {
            ...curriculum,
            featureToggles: {
                ...curriculum.featureToggles,
                [feature]: enabled
            }
        };
        onUpdate(updated);
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">App Modules</h3>
                    <p className="text-sm text-gray-500 mb-4">Turn features on or off for the entire class.</p>
                    <div className="space-y-2">
                        {Object.keys(curriculum.featureToggles).map(key => (
                             <FeatureToggle 
                                key={key}
                                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                                enabled={curriculum.featureToggles[key as keyof typeof curriculum.featureToggles]} 
                                onToggle={v => toggleFeature(key as keyof typeof curriculum.featureToggles, v)} 
                             />
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <EditableTagList 
                    title="Grammar Topics" 
                    items={curriculum.grammarTopics} 
                    onItemsChange={newItems => onUpdate({...curriculum, grammarTopics: newItems})}
                />
                <EditableTagList 
                    title="Reading Skills" 
                    items={curriculum.readingSkills} 
                    onItemsChange={newItems => onUpdate({...curriculum, readingSkills: newItems})}
                />
                 <EditableTagList 
                    title="Learn To Write Categories" 
                    items={curriculum.learnToWriteCategories} 
                    onItemsChange={newItems => onUpdate({...curriculum, learnToWriteCategories: newItems})}
                />
            </div>
        </div>
    );
};

export const AdminConsole: React.FC<{ curriculum: Curriculum, onCurriculumUpdate: (newCurriculum: Curriculum) => void }> = ({ curriculum, onCurriculumUpdate }) => {
    const [view, setView] = useState<'dashboard' | 'curriculum' | 'groups' | 'assignments'>('dashboard');

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-center space-x-4 print:hidden flex-wrap gap-y-2">
                <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg font-bold ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Dashboard</button>
                <button onClick={() => setView('groups')} className={`px-4 py-2 rounded-lg font-bold ${view === 'groups' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Groups & Special Needs</button>
                <button onClick={() => setView('assignments')} className={`px-4 py-2 rounded-lg font-bold ${view === 'assignments' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Assignments</button>
                <button onClick={() => setView('curriculum')} className={`px-4 py-2 rounded-lg font-bold ${view === 'curriculum' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Curriculum</button>
            </div>
            
            {view === 'dashboard' && (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Welcome to the Admin Console</h3>
                        <p className="text-gray-600 mb-6">Manage your classroom, assignments, and app settings from here.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button onClick={() => setView('curriculum')} className="p-6 border-2 border-blue-100 rounded-xl hover:bg-blue-50 transition text-blue-800 font-bold">
                                📚 Manage Curriculum
                            </button>
                             <button onClick={() => setView('assignments')} className="p-6 border-2 border-indigo-100 rounded-xl hover:bg-indigo-50 transition text-indigo-800 font-bold">
                                ✍️ Assign Work
                            </button>
                             <button onClick={() => setView('groups')} className="p-6 border-2 border-green-100 rounded-xl hover:bg-green-50 transition text-green-800 font-bold">
                                👥 Mastery & Needs
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {view === 'groups' && (
                <MasteryGroupManager 
                    curriculum={curriculum} 
                    onUpdateProfiles={p => onCurriculumUpdate({...curriculum, studentProfiles: p})} 
                />
            )}
            {view === 'assignments' && (
                <ModuleAssigner 
                    curriculum={curriculum} 
                    onUpdateAssignments={a => onCurriculumUpdate({...curriculum, assignments: a})} 
                />
            )}
            {view === 'curriculum' && (
                <CurriculumManager 
                    curriculum={curriculum}
                    onUpdate={onCurriculumUpdate}
                />
            )}
        </div>
    );
};