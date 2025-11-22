import React, { useState } from 'react';
import { Student, ActivityRecord, Curriculum } from '../types';
import { GrammarQuiz } from './GrammarQuiz';
import { GrammarIcon } from './common/Icons';

interface GrammarPracticeProps {
  onComplete: () => void;
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  records: ActivityRecord[];
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

export const GrammarPractice: React.FC<GrammarPracticeProps> = ({ onComplete, curriculum, activeStudent, logParticipation, records, logActivity }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (selectedTopic) {
    return (
      <div>
        <div className="max-w-4xl mx-auto p-4">
            <button onClick={() => setSelectedTopic(null)} className="text-blue-600 hover:underline">
              &larr; Back to Grammar Topics
            </button>
        </div>
        <GrammarQuiz 
          topic={selectedTopic} 
          onComplete={onComplete}
          curriculum={curriculum} 
          activeStudent={activeStudent}
          logParticipation={logParticipation}
          records={records}
          logActivity={logActivity}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Grammar Practice</h2>
      <p className="text-gray-600 mb-8">Choose a topic to start a quiz!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {curriculum.grammarTopics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className="w-full p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center"
          >
            <GrammarIcon className="w-8 h-8 text-indigo-500 mr-4" />
            <h3 className="text-xl font-semibold text-indigo-700">{topic}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};