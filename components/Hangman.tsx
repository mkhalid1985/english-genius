import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon } from './common/Icons';

interface HangmanProps {
  words: string[];
  onComplete: () => void;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MAX_MISTAKES = 6;

const HangmanDrawing: React.FC<{ mistakes: number }> = ({ mistakes }) => (
    <svg viewBox="0 0 100 120" className="w-48 h-56 mx-auto">
        {/* Stand */}
        <line x1="10" y1="110" x2="90" y2="110" stroke="currentColor" strokeWidth="4" />
        <line x1="30" y1="110" x2="30" y2="10" stroke="currentColor" strokeWidth="4" />
        <line x1="30" y1="10" x2="70" y2="10" stroke="currentColor" strokeWidth="4" />
        <line x1="70" y1="10" x2="70" y2="20" stroke="currentColor" strokeWidth="4" />
        {/* Head */}
        {mistakes > 0 && <circle cx="70" cy="30" r="10" stroke="currentColor" strokeWidth="4" fill="none" />}
        {/* Body */}
        {mistakes > 1 && <line x1="70" y1="40" x2="70" y2="70" stroke="currentColor" strokeWidth="4" />}
        {/* Left Arm */}
        {mistakes > 2 && <line x1="70" y1="50" x2="55" y2="60" stroke="currentColor" strokeWidth="4" />}
        {/* Right Arm */}
        {mistakes > 3 && <line x1="70" y1="50" x2="85" y2="60" stroke="currentColor" strokeWidth="4" />}
        {/* Left Leg */}
        {mistakes > 4 && <line x1="70" y1="70" x2="55" y2="90" stroke="currentColor" strokeWidth="4" />}
        {/* Right Leg */}
        {mistakes > 5 && <line x1="70" y1="70" x2="85" y2="90" stroke="currentColor" strokeWidth="4" />}
    </svg>
);


export const Hangman: React.FC<HangmanProps> = ({ words, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    const currentWord = words[currentIndex]?.toLowerCase();
    
    const isWon = currentWord && currentWord.split('').every(letter => guessedLetters.has(letter));
    const isLost = mistakes >= MAX_MISTAKES;
    
    const handleGuess = (letter: string) => {
        if (guessedLetters.has(letter) || status !== 'playing') return;
        
        const newGuessed = new Set(guessedLetters).add(letter);
        setGuessedLetters(newGuessed);

        if (!currentWord.includes(letter)) {
            setMistakes(prev => prev + 1);
        }
    };

    const nextWord = useCallback(() => {
        if (isWon) {
            setScore(prev => prev + 1);
        }
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setGuessedLetters(new Set());
            setMistakes(0);
            setStatus('playing');
        } else {
             setTimeout(onComplete, 1000);
        }
    }, [currentIndex, words, isWon, onComplete]);
    
    useEffect(() => {
        if (isWon) {
            setStatus('won');
            setTimeout(nextWord, 1500);
        } else if (isLost) {
            setStatus('lost');
            setTimeout(nextWord, 2000);
        }
    }, [isWon, isLost, nextWord]);


    if (words.length === 0) {
        return <div className="text-center p-8">No words for this game.</div>;
    }
    
    if (currentIndex >= words.length) {
         return (
             <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                <h2 className="text-3xl font-bold text-gray-800">Game Over!</h2>
                <p className="text-5xl font-bold my-4 text-blue-600">{score} / {words.length}</p>
                 <p className="text-xl text-gray-600 mb-6">Great spelling!</p>
            </div>
        );
    }
    
    return (
         <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Hangman</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-center text-gray-500 mb-2">Word {currentIndex + 1} of {words.length} | Score: {score}</p>

                <HangmanDrawing mistakes={mistakes} />

                <div className="flex justify-center items-center gap-2 my-4">
                    {currentWord.split('').map((letter, index) => (
                        <span key={index} className="flex items-center justify-center w-10 h-12 bg-gray-200 rounded-md text-2xl font-bold uppercase">
                            {guessedLetters.has(letter) || status === 'lost' ? letter : ''}
                        </span>
                    ))}
                </div>
                
                {status === 'won' && <p className="text-center text-2xl font-bold text-green-500">You got it!</p>}
                {status === 'lost' && <p className="text-center text-2xl font-bold text-red-500">The word was: {currentWord}</p>}

                <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {ALPHABET.map(letter => {
                        const isGuessed = guessedLetters.has(letter);
                        const isCorrect = isGuessed && currentWord.includes(letter);
                        const isIncorrect = isGuessed && !currentWord.includes(letter);
                        
                        return (
                            <button
                                key={letter}
                                onClick={() => handleGuess(letter)}
                                disabled={isGuessed || status !== 'playing'}
                                className={`w-10 h-10 font-bold rounded-md transition-colors
                                    ${isCorrect ? 'bg-green-500 text-white' : ''}
                                    ${isIncorrect ? 'bg-red-500 text-white' : ''}
                                    ${!isGuessed ? 'bg-gray-100 hover:bg-gray-200' : ''}
                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {letter.toUpperCase()}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};