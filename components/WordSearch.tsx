import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon } from './common/Icons';

interface WordSearchProps {
  words: string[];
  onComplete: () => void;
}

const GRID_SIZE = 12;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

type Grid = (string | null)[][];
type Path = { row: number, col: number }[];

const generateGrid = (words: string[]): { grid: Grid, solutions: Record<string, Path> } => {
    const grid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const solutions: Record<string, Path> = {};
    const directions = [
        { row: 0, col: 1 },  // Horizontal
        { row: 1, col: 0 },  // Vertical
        { row: 1, col: 1 },  // Diagonal down-right
        { row: 1, col: -1 }, // Diagonal down-left
    ];

    for (const word of words) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);

            if (canPlaceWord(grid, word, row, col, dir)) {
                const path: Path = [];
                for (let i = 0; i < word.length; i++) {
                    const newRow = row + i * dir.row;
                    const newCol = col + i * dir.col;
                    grid[newRow][newCol] = word[i];
                    path.push({ row: newRow, col: newCol });
                }
                solutions[word] = path;
                placed = true;
            }
            attempts++;
        }
    }

    // Fill empty spots
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === null) {
                grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            }
        }
    }

    return { grid, solutions };
};

const canPlaceWord = (grid: Grid, word: string, row: number, col: number, dir: { row: number, col: number }): boolean => {
    for (let i = 0; i < word.length; i++) {
        const newRow = row + i * dir.row;
        const newCol = col + i * dir.col;
        if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
            return false; // Out of bounds
        }
        if (grid[newRow][newCol] !== null && grid[newRow][newCol] !== word[i]) {
            return false; // Overlaps with another word incorrectly
        }
    }
    return true;
};

export const WordSearch: React.FC<WordSearchProps> = ({ words, onComplete }) => {
    const { grid, solutions } = useMemo(() => generateGrid(words.map(w => w.toLowerCase())), [words]);
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [selection, setSelection] = useState<Path>([]);
    const [isMouseDown, setIsMouseDown] = useState(false);
    
    useEffect(() => {
        if(foundWords.size === words.length && words.length > 0) {
            setTimeout(onComplete, 1500);
        }
    }, [foundWords, words, onComplete]);

    const handleInteractionStart = (row: number, col: number) => {
        setIsMouseDown(true);
        setSelection([{ row, col }]);
    };
    
    const handleInteractionMove = (row: number, col: number) => {
        if (!isMouseDown || selection.some(p => p.row === row && p.col === col)) return;
        setSelection(prev => [...prev, { row, col }]);
    };

    const handleInteractionEnd = () => {
        setIsMouseDown(false);
        const selectedString = selection.map(p => grid[p.row][p.col]).join('');
        const reversedString = [...selectedString].reverse().join('');
        
        for (const word of words) {
            if (word.toLowerCase() === selectedString || word.toLowerCase() === reversedString) {
                const solutionPath = solutions[word.toLowerCase()];
                const isCorrectLength = selection.length === word.length;
                
                if (isCorrectLength) {
                    setFoundWords(prev => new Set(prev).add(word));
                }
            }
        }
        setSelection([]);
    };
    
    const isCellInFoundPath = (row: number, col: number) => {
        for (const word of foundWords) {
            const path = solutions[word.toLowerCase()];
            if (path?.some(p => p.row === row && p.col === col)) {
                return true;
            }
        }
        return false;
    };
    
    const isCellInSelection = (row: number, col: number) => selection.some(p => p.row === row && p.col === col);
    
    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-6">
            <div className="bg-white p-4 rounded-xl shadow-lg">
                 <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Word Search</h2>
                 <div
                     className="grid gap-1 bg-gray-200 p-2 rounded-lg touch-none"
                     style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                     onMouseUp={handleInteractionEnd}
                     onMouseLeave={handleInteractionEnd}
                     onTouchEnd={handleInteractionEnd}
                 >
                    {grid.map((row, rIndex) =>
                        row.map((cell, cIndex) => (
                            <div
                                key={`${rIndex}-${cIndex}`}
                                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-sm md:text-lg font-bold uppercase select-none cursor-pointer rounded-md transition-colors
                                    ${isCellInFoundPath(rIndex, cIndex) ? 'bg-green-400 text-white' : ''}
                                    ${isCellInSelection(rIndex, cIndex) ? 'bg-yellow-300' : ''}
                                    ${!isCellInFoundPath(rIndex, cIndex) && !isCellInSelection(rIndex, cIndex) ? 'bg-white' : ''}
                                `}
                                onMouseDown={() => handleInteractionStart(rIndex, cIndex)}
                                onMouseEnter={() => handleInteractionMove(rIndex, cIndex)}
                                onTouchStart={() => handleInteractionStart(rIndex, cIndex)}
                            >
                                {cell}
                            </div>
                        ))
                    )}
                 </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg flex-1">
                 <h3 className="font-bold text-xl mb-4">Words to Find</h3>
                 {foundWords.size === words.length && (
                      <div className="text-center mb-4">
                         <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-2"/>
                         <p className="font-bold text-green-600">All words found!</p>
                     </div>
                 )}
                 <div className="grid grid-cols-2 gap-2">
                    {words.map(word => (
                        <p key={word} className={`p-1 rounded text-gray-700 transition-all ${foundWords.has(word) ? 'line-through text-gray-400' : ''}`}>
                            {word}
                        </p>
                    ))}
                 </div>
            </div>
        </div>
    );
};
