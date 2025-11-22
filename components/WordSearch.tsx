import React from 'react';

interface WordSearchProps {
  words: string[];
  onComplete: () => void;
}

export const WordSearch: React.FC<WordSearchProps> = ({ onComplete }) => {
    return (
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
             <h2 className="text-2xl font-bold text-gray-800 mb-4">Word Search</h2>
             <p className="text-gray-600 mb-6">This activity is under maintenance.</p>
             <button onClick={onComplete} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                Skip Activity
             </button>
        </div>
    );
};
