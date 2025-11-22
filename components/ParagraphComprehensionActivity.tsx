import React, { useState, useEffect } from 'react';
import { generateKsaParagraphComprehension } from '../services/geminiService';
import type { Difficulty } from '../services/geminiService';
import type { ParagraphComprehensionContent, ActivityRecord, Student, Curriculum } from '../types';
import { Quiz } from './Quiz';
import { Spinner } from './common/Icons';

interface ParagraphComprehensionActivityProps {
  onComplete: () => void;
  session: number;
  category: string;
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const getSessionId = (category: string, session: number) => `${category} - Session ${session}`;

export const ParagraphComprehensionActivity: React.FC<ParagraphComprehensionActivityProps> = ({ onComplete, session, category, curriculum, activeStudent, logParticipation, logActivity }) => {
  const gradeLevel = curriculum.gradeLevel;
  const [passageData, setPassageData] = useState<ParagraphComprehensionContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const getDifficulty = (): Difficulty => {
      if (category.includes('Starter')) return 'starter';
      if (category.includes('Growing')) return 'growing';
      if (category.includes('Leaping')) return 'leaping';
      return 'starter';
  }

  useEffect(() => {
    const fetchPassage = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const difficulty = getDifficulty();
          const data = await generateKsaParagraphComprehension(difficulty, gradeLevel);
          setPassageData(data);
        } catch (err) {
          setError('Failed to load the reading passage. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
    };
    fetchPassage();
  }, [session, category]);

  const handleComplete = () => {
    onComplete();
    setIsCompleted(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Spinner />
        <p className="text-xl font-semibold text-gray-700 mt-4">Finding a great story for Session {session}...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (passageData) {
    const activityCategory = getSessionId(category, session);
    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{category} - Session {session}</h2>
            {!isCompleted && (
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-3">Read the passage:</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{passageData.passage}</p>
                </div>
            )}
            <Quiz
                questions={passageData.questions.map(q => ({ ...q, type: 'MULTIPLE_CHOICE' }))}
                activityType="Cover the Basics"
                category={activityCategory}
                onComplete={handleComplete}
                curriculum={curriculum}
                activeStudent={activeStudent}
                logParticipation={logParticipation}
                logActivity={logActivity}
            />
        </div>
    );
  }

  return null;
};