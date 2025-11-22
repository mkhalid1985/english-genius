import React, { useState, useMemo, useEffect } from 'react';
import { QuizQuestion, ActivityRecord, Student, Curriculum, QuizQuestionType } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  activityType: ActivityRecord['activityType'];
  category: string;
  onComplete: () => void;
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, activityType, category, onComplete, curriculum, activeStudent, logParticipation, logActivity }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: string) => {
    setSelectedOption(answer);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const durationSeconds = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedOption === questions[currentQuestionIndex].correctAnswer;

    if (activeStudent) {
      logParticipation(activeStudent, durationSeconds, isCorrect);
    }
    
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = useMemo(() => userAnswers.reduce((acc, answer, index) => {
    return answer === questions[index].correctAnswer ? acc + 1 : acc;
  }, 0), [userAnswers, questions]);
  
  const skillAnalysis = useMemo(() => {
    if (!showResults || !questions.some(q => q.skill)) return null;

    const skillScores: { [key: string]: { correct: number; total: number } } = {};

    questions.forEach((q, index) => {
        if (q.skill) {
            if (!skillScores[q.skill]) {
                skillScores[q.skill] = { correct: 0, total: 0 };
            }
            skillScores[q.skill].total++;
            if (userAnswers[index] === q.correctAnswer) {
                skillScores[q.skill].correct++;
            }
        }
    });
    
    let weakestSkill: string | null = null;
    let lowestPercentage = 101;

    for (const skill of Object.keys(skillScores)) {
        const scores = skillScores[skill];
        const percentage = scores.total > 0 ? (scores.correct / scores.total) * 100 : 0;
        if (percentage < lowestPercentage) {
            lowestPercentage = percentage;
            weakestSkill = skill;
        }
    }

    return { skillScores, weakestSkill };
  }, [showResults, questions, userAnswers]);

  useEffect(() => {
    if (showResults && activeStudent) {
        logActivity({
            studentName: activeStudent,
            activityType,
            category,
            score: score,
            total: questions.length,
            skillScores: skillAnalysis?.skillScores,
        });
    }
  }, [showResults, activeStudent, activityType, category, score, questions.length, skillAnalysis, logActivity]);


  if (showResults) {
    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800">Quiz Complete!</h2>
        <p className="text-5xl font-bold my-4 text-blue-600">
          {score} / {questions.length}
        </p>
        <p className="text-xl text-gray-600 mb-6">
          Score: {((score / questions.length) * 100).toFixed(0)}%
        </p>

        {skillAnalysis && (
            <div className="my-8 p-6 bg-sky-50 rounded-xl border-t-4 border-sky-300 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-sky-800 mb-4">Skills Breakdown</h3>
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                    {Object.keys(skillAnalysis.skillScores).map((skill) => {
                        const scores = skillAnalysis.skillScores[skill];
                        return (
                            <div key={skill} className="bg-white p-3 rounded-lg shadow-sm text-center">
                                <p className="font-semibold text-gray-700">{skill}</p>
                                <p className="font-bold text-lg text-sky-700">{scores.correct}/{scores.total}</p>
                            </div>
                        );
                    })}
                </div>
                {skillAnalysis.weakestSkill && score < questions.length && (
                    <p className="text-gray-600">
                        The area to focus on is <strong className="text-sky-900">{skillAnalysis.weakestSkill}</strong>.
                    </p>
                )}
                 {score === questions.length && (
                    <p className="font-semibold text-green-600">
                        Perfect score! Master of all skills!
                    </p>
                )}
            </div>
        )}

        <div className="text-left max-w-2xl mx-auto space-y-4">
          {questions.map((q, index) => (
            <div key={index} className={`p-4 rounded-lg ${userAnswers[index] === q.correctAnswer ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="font-semibold text-gray-800">{index + 1}. {q.question} {q.skill && <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-2">{q.skill}</span>}</p>
              <p className="text-sm mt-1">Your answer: <span className="font-bold">{userAnswers[index]}</span></p>
              {userAnswers[index] !== q.correctAnswer && (
                <p className="text-sm text-green-700">Correct answer: <span className="font-bold">{q.correctAnswer}</span></p>
              )}
            </div>
          ))}
        </div>
         <button onClick={onComplete} className="mt-8 px-8 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700">Back to Menu</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-700">{category}</h2>
        <p className="text-gray-600 font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>
      <div className="h-1 bg-gray-200 rounded-full mb-6">
        <div className="h-1 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
      </div>

      <p className="text-lg text-gray-800 mb-2 min-h-[60px]">{currentQuestion.question}</p>
      {currentQuestion.skill && <span className="inline-block text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full mb-4">{currentQuestion.skill}</span>}


      <div className="space-y-3">
        {currentQuestion.type === QuizQuestionType.TRUE_FALSE ? (
            (['True', 'False']).map(option => (
                <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOption === option
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                    {option}
                </button>
            ))
        ) : (
            currentQuestion.options?.map((option) => (
                <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOption === option
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                    {option}
                </button>
            ))
        )}
      </div>
      <div className="text-right mt-8">
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
};