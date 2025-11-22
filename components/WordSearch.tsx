import React, { useState, useEffect, useMemo, useRef } from 'react';
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
        if(foundWords.size === words.length) {
            setTimeout(onComplete, 1500);
        }
    }, [foundWords, words, onComplete]);

    const handleInteractionStart = (row: number, col: number) => {
        setIsMouseDown(true);