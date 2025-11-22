import React, { useState } from 'react';
import type { ActivityRecord, Curriculum } from '../types';
import { LockIcon, WritingIcon, GrammarIcon, ReadingIcon } from './common/Icons';
import type { ActivitySelection } from './CoverTheBasics';

interface CoverTheBasicsMenuProps {
  records: ActivityRecord[];
  setActivityView: (selection: ActivitySelection) => void;
  isAdmin: boolean;
  curriculum: Curriculum;
}

type CategoryName = 'CVC Words' | 'Sentence Scramble' | 'Paragraph Comprehension';

const getSessionId = (category: string, session: number) => `${category} - Session ${session}`;

const SessionButton: React.FC<{
    title: string;
    isLocked: boolean;
    isComplete: boolean;
    isAdmin: boolean;
    onClick: () => void;
}> = ({ title, isLocked, isComplete, isAdmin, onClick }) => {
    const unlocked = !isLocked || isAdmin;
    const buttonColor = isComplete ? 'bg-green-100 text-green-800' : unlocked ? 'bg-white' : 'bg-gray-100';
    const textColor = isComplete ? 'text-green-800' : unlocked ? 'text-blue-700' : 'text-gray-500';

    return (
        <button
            onClick={onClick}
            disabled={!unlocked}
            className={`w-full text-center py-4 px-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 ${buttonColor}`}
        >
            {!unlocked && <LockIcon className="w-5 h-5 text-gray-400" />}
            {isComplete && <span className="text-green-600">✔</span>}
            <span className={`text-lg font-semibold ${textColor}`}>{title}</span>
            {isAdmin && isLocked && <span className="text-xs text-orange-500">(Admin)</span>}
        </button>
    );
};

const MainCategoryCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-left flex items-center">
        <div className="mr-6">{icon}</div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="mt-1 text-gray-600">{description}</p>
        </div>
    </button>
);


export const CoverTheBasicsMenu: React.FC<CoverTheBasicsMenuProps> = ({ records, setActivityView, isAdmin, curriculum }) => {
    const [view, setView] = useState<'main' | CategoryName>('main');
    
    const visibleCategories = curriculum.coverTheBasics.filter(cat => cat.enabled);

    const categoryMap = curriculum.coverTheBasics.reduce((acc, cat) => {
        acc[cat.id] = cat;
        cat.levels.forEach(level => {
            acc[level.id] = level;
        });
        return acc;
    }, {} as any);

    const isSessionComplete = (sessionId: string) => {
        return records.some(r => r.category === sessionId && r.score === r.total && r.total > 0);
    }

    const areAllLevelSessionsComplete = (levelId: string) => {
        const level = categoryMap[levelId];
        if (!level) return false;
        
        const category = curriculum.coverTheBasics.find(cat => cat.levels.some(l => l.id === levelId));
        if (!category) return false;

        const categoryName = `${category.name} - ${level.name}`;
        for (let i = 1; i <= level.sessions; i++) {
            if (!isSessionComplete(getSessionId(categoryName, i))) {
                return false;
            }
        }
        return true;
    };
    
    const renderCategorySessions = (categoryName: string, levels: typeof curriculum.coverTheBasics[0]['levels']) => (
        <div className="space-y-10">
            {levels.filter(level => level.enabled).map(level => {
                const isLevelUnlocked = !level.dependency || areAllLevelSessionsComplete(level.dependency);
                const fullCategoryName = `${categoryName} - ${level.name}`;
                return (
                    <div key={level.id} className="p-6 bg-sky-100/60 rounded-xl shadow-md">
                        <h4 className={`text-xl font-bold mb-3 ${isLevelUnlocked || isAdmin ? 'text-gray-700' : 'text-gray-400'}`}>{level.name} Level</h4>
                        {!isLevelUnlocked && !isAdmin && <p className="text-gray-500 text-sm mb-3">Complete the previous category to unlock these sessions.</p>}
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from({ length: level.sessions }, (_, i) => i + 1).map(sessionNum => {
                                const currentSessionId = getSessionId(fullCategoryName, sessionNum);
                                const prevSessionId = getSessionId(fullCategoryName, sessionNum - 1);
                                const isFirstSession = sessionNum === 1;
                                const isSessionLocked = !isLevelUnlocked || (!isFirstSession && !isSessionComplete(prevSessionId));
                                return (
                                    <SessionButton
                                        key={sessionNum}
                                        title={`Session ${sessionNum}`}
                                        isLocked={isSessionLocked}
                                        isComplete={isSessionComplete(currentSessionId)}
                                        isAdmin={isAdmin}
                                        onClick={() => setActivityView({ type: fullCategoryName, session: sessionNum })}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
    
    if (view !== 'main') {
        const categoryConfig = curriculum.coverTheBasics.find(c => c.name === view);
        if (!categoryConfig) return null;
        
        return (
             <div className="max-w-5xl mx-auto p-4">
                <div className="mb-6">
                    <button onClick={() => setView('main')} className="text-blue-600 hover:underline">
                        &larr; Back to Basics Menu
                    </button>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">{view}</h2>
                <p className="text-gray-600 mb-8 text-center">Complete each session with a perfect score to unlock the next!</p>
                {renderCategorySessions(categoryConfig.name, categoryConfig.levels)}
            </div>
        );
    }

  const icons: { [key: string]: React.ReactNode } = {
        'CVC Words': <WritingIcon className="w-12 h-12 text-blue-500"/>,
        'Sentence Scramble': <GrammarIcon className="w-12 h-12 text-indigo-500"/>,
        'Paragraph Comprehension': <ReadingIcon className="w-12 h-12 text-teal-500"/>,
    };


  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Cover the Basics</h2>
      <p className="text-gray-600 mb-8 text-center">Choose a category to start practicing.</p>
      
      <div className="space-y-6">
        {visibleCategories.map(category => (
            <MainCategoryCard
                key={category.id}
                title={category.name}
                description={category.description}
                icon={icons[category.name] || <WritingIcon className="w-12 h-12 text-gray-500"/>}
                onClick={() => setView(category.name)}
            />
        ))}
      </div>
    </div>
  );
};