import React from 'react';

interface WordSearchProps {
  words: string[];
  onComplete: () => void;
}

export const WordSearch: React.FC<WordSearchProps> = ({ onComplete }) => {
    return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
             <h2 className="text-2xl font-bold text-gray-800 mb-4">Word Search</h2>
             <p className="text-gray-600 mb-6">This activity is currently under maintenance.</p>
             <button 
                onClick={onComplete} 
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
             >
                Skip Activity
             </button>
        </div>
    );
};
