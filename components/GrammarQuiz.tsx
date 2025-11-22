import React, { useState, useEffect, useCallback } from 'react';
import { generateGrammarQuiz } from '../services/geminiService';
import { QuizQuestion, ActivityRecord, Student, Curriculum } from '../types';
import { Spinner } from './common/Icons';
import { Quiz } from './Quiz';

interface GrammarQuizProps {
  topic: string;
  onComplete: () => void;
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  records: ActivityRecord[];
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

export const GrammarQuiz: React.FC<GrammarQuizProps> = ({ topic, onComplete, curriculum, activeStudent, logParticipation, records, logActivity }) => {
    const gradeLevel = curriculum.gradeLevel;
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchQuiz = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const quizQuestions = await generateGrammarQuiz(topic, gradeLevel);
            setQuestions(quizQuestions);
          } catch (err) {
            setError('Failed to load the quiz. Please try again.');
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        };
        fetchQuiz();
    }, [topic, gradeLevel]);

    if (isLoading) return <div className="text-center p-8"><Spinner /><p>Creating quiz for "{topic}"...</p></div>;
    if (error) return <p className="text-red-500 text-center p-8">{error}</p>;
    if (questions.length === 0) return <p className="text-center p-8">No questions available for this topic.</p>;
    
    return (
        <Quiz 
            questions={questions}
            activityType="Grammar"
            category={topic}
            onComplete={onComplete}
            curriculum={curriculum}
            activeStudent={activeStudent}
            logParticipation={logParticipation}
            logActivity={logActivity}
        />
    );
};