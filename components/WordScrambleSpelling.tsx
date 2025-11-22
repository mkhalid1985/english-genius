import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, DeleteIcon } from './common/Icons';

interface WordScrambleSpellingProps {
  words: string[];
  onComplete: () => void;
}

const shuffle = (word: string) => {
    const a = word.split("");
    const n = a.length;
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.join("");
};

export const WordScrambleSpelling: React.FC<WordScrambleSpellingProps> = ({ words, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [score, setScore] = useState(0);

    const scrambledWord = useMemo(() => {
        if (!words[currentIndex]) return '';
        let s = shuffle(words[currentIndex]);
        // Prevent infinite loop for single char words or if shuffle results in same word
        let attempts = 0;
        while (s === words[currentIndex] && words[currentIndex].length > 1 && attempts < 10) {
            s = shuffle(words[currentIndex]);
            attempts++;
        }
        return s;
    }, [words, currentIndex]);

    // Calculate which indices of the scrambled word have been "used" by the user input
    const usedIndices = useMemo(() => {
        const used = new Set<number>();
        const inputChars = userInput.toLowerCase().split('');
        const scrambledChars = scrambledWord.toLowerCase().split('');

        inputChars.forEach(char => {
            for (let i = 0; i < scrambledChars.length; i++) {
                if (scrambledChars[i] === char && !used.has(i)) {
                    used.add(i);
                    break; // Match found for this input char, stop looking for this specific instance
                }
            }
        });
        return used;
    }, [userInput, scrambledWord]);

    const handleLetterClick = (char: string) => {
        if (feedback) return; // Disable input during feedback
        setUserInput(prev => prev + char);
    };

    const handleBackspace = () => {
        if (feedback) return;
        setUserInput(prev => prev.slice(0, -1));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (userInput.toLowerCase().trim() === words[currentIndex].toLowerCase()) {
            setFeedback('correct');
            setScore(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setUserInput('');
                setFeedback(null);
            } else {
                // Game over, show summary for a moment before completing
                setTimeout(onComplete, 1000);
            }
        }, 1500);
    };

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
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Word Scramble</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg select-none">
                <p className="text-center text-gray-500 mb-4">Question {currentIndex + 1} of {words.length} | Score: {score}</p>
                <p className="text-center text-lg text-gray-700 mb-4">Tap letters to spell the word:</p>
                
                {/* Interactive Scrambled Letters Display */}
                <div className="bg-gray-100 p-4 rounded-lg text-center flex justify-center flex-wrap gap-2 min-h-[80px] items-center">
                     {scrambledWord.split('').map((char, index) => (
                        <button 
                            key={index} 
                            onClick={() => !usedIndices.has(index) && handleLetterClick(char)}
                            disabled={usedIndices.has(index) || !!feedback}
                            className={`text-4xl font-bold uppercase transition-all duration-300 w-12 h-14 flex items-center justify-center rounded-lg border-b-4 active:border-b-0 active:translate-y-1 ${
                                usedIndices.has(index) 
                                    ? 'text-gray-300 bg-gray-200 border-transparent opacity-30 scale-90 cursor-default' // Dimmed style when used
                                    : 'text-indigo-600 bg-white border-indigo-200 shadow-md hover:bg-indigo-50 cursor-pointer' // Active style
                            }`}
                        >
                            {char}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className={`w-full text-center text-3xl p-3 border-2 rounded-lg transition-colors tracking-widest ${
                                feedback === 'correct' ? 'border-green-500 bg-green-50' :
                                feedback === 'incorrect' ? 'border-red-500 bg-red-50' :
                                'border-gray-300 focus:ring-2 focus:ring-blue-500'
                            }`}
                            placeholder="Tap letters..."
                            readOnly // Mobile users should tap letters, prevents keyboard popping up automatically
                            disabled={!!feedback}
                        />
                        {userInput.length > 0 && !feedback && (
                            <button 
                                type="button" 
                                onClick={handleBackspace}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500"
                            >
                                <DeleteIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                    
                    {feedback === 'incorrect' && <p className="text-center text-red-500 mt-2">Correct answer: <span className="font-bold">{words[currentIndex]}</span></p>}
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                         <button 
                            type="button" 
                            onClick={handleBackspace} 
                            disabled={!userInput || !!feedback}
                            className="py-3 bg-gray-200 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-300 disabled:opacity-50"
                        >
                            Backspace
                        </button>
                        <button 
                            type="submit" 
                            disabled={!userInput.trim() || !!feedback} 
                            className="py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Check
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};