import React, { useState } from 'react';
import { Curriculum } from '../types';
import { spellingWords, SpellingLevel } from '../spellingData';
import { WordScrambleSpelling } from './WordScrambleSpelling';
import { Hangman } from './Hangman';
// REMOVED WordSearch import

interface SpellingStationProps {
  onComplete: () => void;
  curriculum: Curriculum;
}

type GameType = 'wordScramble' | 'hangman'; // Removed wordSearch

const GameCard: React.FC<{ title: string; description: string; selected: boolean; onClick: () => void; }> = ({ title, description, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${selected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
    >
        <h4 className="font-bold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
    </button>
);


export const SpellingStation: React.FC<SpellingStationProps> = ({ onComplete, curriculum }) => {
    const [level, setLevel] = useState<SpellingLevel | null>(null);
    const [gameType, setGameType] = useState<GameType>('wordScramble');
    const [wordCount, setWordCount] = useState(10);
    const [gameWords, setGameWords] = useState<string[]>([]);
    const [view, setView] = useState<'level' | 'setup' | 'game'>('level');

    const handleLevelSelect = (selectedLevel: SpellingLevel) => {
        setLevel(selectedLevel);
        setView('setup');
    };

    const handleStartGame = () => {
        if (!level) return;
        const allWords = spellingWords[level];
        const shuffled = [...allWords].sort(() => 0.5 - Math.random());
        setGameWords(shuffled.slice(0, wordCount));
        setView('game');
    };

    const handleGameComplete = () => {
        setView('level');
        setLevel(null);
        setGameWords([]);
    };

    if (view === 'game') {
        const gameProps = { words: gameWords, onComplete: handleGameComplete };
        if (gameType === 'wordScramble') return <WordScrambleSpelling {...gameProps} />;
        if (gameType === 'hangman') return <Hangman {...gameProps} />;
    }
    
    if (view === 'setup' && level) {
        const maxWords = spellingWords[level].length;
        return (
            <div className="max-w-2xl mx-auto p-4">
                 <button onClick={() => setView('level')} className="text-blue-600 hover:underline mb-4">&larr; Back to Levels</button>
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-800 text-center mb-1">Game Setup</h3>
                    <p className="text-center text-gray-500 mb-6">Level: <span className="font-semibold capitalize">{level}</span></p>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">1. Choose your game</h4>
                            <div className="space-y-2">
                                <GameCard title="Word Scramble" description="Unscramble the letters to spell the word." selected={gameType === 'wordScramble'} onClick={() => setGameType('wordScramble')} />
                                <GameCard title="Hangman" description="Guess the word one letter at a time." selected={gameType === 'hangman'} onClick={() => setGameType('hangman')} />
                            </div>
                        </div>

                         <div>
                            <h4 className="font-semibold text-gray-700 mb-2">2. How many words? ({wordCount})</h4>
                            <input
                                type="range"
                                min="5"
                                max={maxWords}
                                step="1"
                                value={wordCount}
                                onChange={(e) => setWordCount(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 px-1">
                                <span>5</span>
                                <span>{maxWords}</span>
                            </div>
                        </div>

                        <button onClick={handleStartGame} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700">
                            Start Game
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Spelling Station</h2>
            <p className="text-gray-600 mb-8">Choose a level to start practicing your spelling!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(spellingWords) as SpellingLevel[]).map(level => (
                    <button
                        key={level}
                        onClick={() => handleLevelSelect(level)}
                        className="p-8 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        <h3 className="text-2xl font-bold capitalize text-lime-700">{level}</h3>
                    </button>
                ))}
            </div>
        </div>
    );
};
