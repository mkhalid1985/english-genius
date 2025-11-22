import React, { useState } from 'react';
import { generateReadingPassage } from '../services/geminiService';
import { ReadingLevel, CustomReadingActivity, LeveledText, VocabularyItem, Curriculum } from '../types';
import type { ReadingPassage, ActivityRecord, Student } from '../types';
import { Quiz } from './Quiz';
import { Spinner, LockIcon, CheckCircleIcon } from './common/Icons';

interface ReadingComprehensionProps {
  onComplete: () => void;
  records: ActivityRecord[];
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

const levels: ReadingLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const PASSAGES_PER_LEVEL: Record<ReadingLevel, number> = {
    'Beginner': 6,
    'Intermediate': 8,
    'Advanced': 10,
};

const levelInfo: Record<ReadingLevel, string> = {
    'Beginner': `${PASSAGES_PER_LEVEL['Beginner']} passages`,
    'Intermediate': `${PASSAGES_PER_LEVEL['Intermediate']} passages`,
    'Advanced': `${PASSAGES_PER_LEVEL['Advanced']} passages`
};

const LevelButton: React.FC<{
    level: ReadingLevel;
    isLocked: boolean;
    isComplete: boolean;
    onClick: () => void;
}> = ({ level, isLocked, isComplete, onClick }) => {
    
    const baseClasses = "w-full p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center justify-between";
    let stateClasses = "bg-white";
    if (isLocked) {
        stateClasses = "bg-gray-100 text-gray-400 cursor-not-allowed transform-none shadow-sm";
    } else if (isComplete) {
        stateClasses = "bg-green-50 border-2 border-green-200";
    }

    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            className={`${baseClasses} ${stateClasses}`}
        >
            <div>
                <h3 className={`text-xl font-semibold ${isLocked ? '' : 'text-teal-700'}`}>{level}</h3>
                <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>{levelInfo[level]}</p>
            </div>
            {isLocked && <LockIcon className="w-8 h-8 text-gray-400" />}
            {isComplete && <CheckCircleIcon className="w-8 h-8 text-green-500" />}
        </button>
    );
};

const PassageButton: React.FC<{
    passageNumber: number;
    isLocked: boolean;
    isComplete: boolean;
    onClick: () => void;
}> = ({ passageNumber, isLocked, isComplete, onClick }) => {
    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-lg border-2 transition-all shadow-md
                ${isComplete ? 'bg-green-100 border-green-400 text-green-700' :
                  isLocked ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' :
                  'bg-white border-blue-400 text-blue-700 hover:bg-blue-50 hover:-translate-y-1'}`}
        >
            {isLocked && <LockIcon className="w-8 h-8 text-gray-400" />}
            {!isLocked && (isComplete ? <CheckCircleIcon className="w-10 h-10" /> : <span className="text-3xl font-bold">{passageNumber}</span>)}
            <span className="text-sm font-semibold mt-1 absolute bottom-2">Passage {passageNumber}</span>
        </button>
    );
};


export const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({ onComplete, records, curriculum, activeStudent, logParticipation, logActivity }) => {
  const gradeLevel = curriculum.gradeLevel;
  const [view, setView] = useState<'skillSelection' | 'levelSelection' | 'passageSelection' | 'passage' | 'customPassageSelection'>('skillSelection');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel | 'low' | 'medium' | 'gradeSpecific' | null>(null);
  const [selectedPassageNum, setSelectedPassageNum] = useState<number | null>(null);
  const [passageData, setPassageData] = useState<ReadingPassage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomActivity, setSelectedCustomActivity] = useState<CustomReadingActivity | null>(null);
  const [selectedVocabulary, setSelectedVocabulary] = useState<VocabularyItem[] | null>(null);
  
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [honorPledge, setHonorPledge] = useState(false);
  const [activityToUnlock, setActivityToUnlock] = useState<CustomReadingActivity | null>(null);


  const isPassageComplete = (skill: string, level: ReadingLevel, passageNum: number) => {
    const categoryId = `${skill} - ${level} - Passage ${passageNum}`;
    return records.some(r => r.category === categoryId && r.score === r.total && r.total > 0);
  };

  const areAllLevelPassagesComplete = (skill: string, level: ReadingLevel) => {
    const numPassages = PASSAGES_PER_LEVEL[level];
    for (let i = 1; i <= numPassages; i++) {
        if (!isPassageComplete(skill, level, i)) {
            return false;
        }
    }
    return true;
  };

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
    setView('levelSelection');
  };

  const handleLevelClick = (level: ReadingLevel) => {
    setSelectedLevel(level);
    setView('passageSelection');
  };

  const handlePassageSelect = async (passageNum: number) => {
    if (!selectedSkill || !selectedLevel) return;
    setSelectedPassageNum(passageNum);
    setIsLoading(true);
    setError(null);
    setPassageData(null);
    setView('passage');
    try {
      const data = await generateReadingPassage(selectedSkill, selectedLevel as ReadingLevel, gradeLevel);
      setPassageData(data);
    } catch (err) {
      setError('Failed to load the reading passage. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = () => {
      onComplete();
      setPassageData(null);
      if (selectedCustomActivity) {
        setView('customPassageSelection');
        setSelectedCustomActivity(null);
        setSelectedVocabulary(null);
      } else {
        setView('passageSelection');
      }
  }
  
  const checkAccess = (activity: CustomReadingActivity) => {
        // Check if ANY assignments exist for this activity
        const assignments = curriculum.assignments.filter(a => a.activityId === activity.id);
        if (assignments.length === 0) return true; // Unlocked for everyone

        if (!activeStudent) return false; // Must have student selected to verify

        // Check if active student has an unlocked access code in session
        const unlocked = sessionStorage.getItem(`unlocked_${activity.id}_${activeStudent}`);
        if (unlocked) return true;

        return false; // Locked
  };

  const handleUnlock = () => {
      if (!activityToUnlock || !activeStudent) return;

      if (!honorPledge) {
          setAccessCodeError("You must agree to the Honor Pledge first.");
          return;
      }

      const assignment = curriculum.assignments.find(a => 
          a.activityId === activityToUnlock.id && 
          a.studentName === activeStudent && 
          a.accessCode === accessCodeInput
      );

      if (assignment) {
          sessionStorage.setItem(`unlocked_${activityToUnlock.id}_${activeStudent}`, 'true');
          setActivityToUnlock(null);
          setAccessCodeInput('');
          setAccessCodeError('');
          setHonorPledge(false);
      } else {
          // Check if code belongs to someone else
          const otherAssignment = curriculum.assignments.find(a => a.activityId === activityToUnlock.id && a.accessCode === accessCodeInput);
          if (otherAssignment) {
               setAccessCodeError(`⛔ This code belongs to ${otherAssignment.studentName}, but you are logged in as ${activeStudent}.`);
          } else {
               setAccessCodeError("Invalid Access Code.");
          }
      }
  };

  if (view === 'passage') {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Spinner />
            <p className="text-xl font-semibold text-gray-700 mt-4">Finding a great story for "{selectedSkill || selectedCustomActivity?.title} - {selectedLevel}"...</p>
          </div>
        );
      }
    
      if (error) {
        return <p className="text-red-500 text-center">{error}</p>;
      }

      if (passageData) {
        let categoryForQuiz: string;
        let title: string;

        if (selectedCustomActivity && selectedLevel) {
            const levelName = selectedLevel === 'low' ? 'Easier' : selectedLevel === 'medium' ? 'Standard' : `${gradeLevel}`;
            categoryForQuiz = `Custom: ${selectedCustomActivity.title} (${levelName})`;
            title = `Reading: ${selectedCustomActivity.title}`;
        } else if (selectedSkill && selectedLevel && selectedPassageNum) {
            categoryForQuiz = `${selectedSkill} - ${selectedLevel} - Passage ${selectedPassageNum}`;
            title = `Reading: ${selectedSkill} - ${selectedLevel} (Passage ${selectedPassageNum})`;
        } else {
            return <p>An unexpected error occurred.</p>;
        }

        return (
            <div className="max-w-4xl mx-auto p-4">
                <button onClick={() => { 
                    if (selectedCustomActivity) {
                        setView('customPassageSelection');
                        setSelectedCustomActivity(null);
                        setSelectedVocabulary(null);
                    } else {
                        setView('passageSelection');
                    }
                    setPassageData(null);
                }} className="text-blue-600 hover:underline mb-4">
                  &larr; Back to Passages
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                {selectedVocabulary && selectedVocabulary.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                        <h3 className="text-xl font-bold text-gray-700 mb-3">Key Vocabulary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedVocabulary.map(item => (
                                <div key={item.word} className="bg-amber-50 p-3 rounded-lg">
                                    <p className="font-bold text-amber-800">{item.word}</p>
                                    <p className="text-sm text-gray-600">{item.definition}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                    <p className={`text-gray-700 whitespace-pre-line ${selectedCustomActivity ? 'text-[13px] leading-loose' : 'leading-relaxed'}`}>{passageData.passage}</p>
                </div>
                <Quiz
                    questions={passageData.questions}
                    activityType="Reading"
                    category={categoryForQuiz}
                    onComplete={handleQuizComplete}
                    curriculum={curriculum}
                    activeStudent={activeStudent}
                    logParticipation={logParticipation}
                    logActivity={logActivity}
                />
            </div>
        );
      }
  }

  if (view === 'customPassageSelection') {
    return (
         <div className="max-w-2xl mx-auto p-4">
            <button onClick={() => setView('skillSelection')} className="text-blue-600 hover:underline mb-4">
                &larr; Back to Skills
            </button>
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Teacher's Custom Passages</h2>
            <div className="space-y-4 mt-8">
                {curriculum.customReadingActivities.map(activity => {
                    const isUnlocked = checkAccess(activity);
                    const hasAssignments = curriculum.assignments.some(a => a.activityId === activity.id);
                    
                    return (
                        <div key={activity.id} className={`p-4 bg-white rounded-lg shadow-md relative ${!isUnlocked && hasAssignments ? 'opacity-90 bg-gray-50' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-semibold text-purple-700">{activity.title}</h3>
                                {!isUnlocked && hasAssignments && (
                                    <div className="bg-gray-200 p-2 rounded-full">
                                        <LockIcon className="w-5 h-5 text-gray-500"/>
                                    </div>
                                )}
                            </div>
                            
                            {!isUnlocked && hasAssignments ? (
                                <button 
                                    onClick={() => {
                                        if(!activeStudent) {
                                            alert("Please select a student from the tracker first.");
                                            return;
                                        }
                                        setActivityToUnlock(activity);
                                        setAccessCodeError('');
                                        setHonorPledge(false);
                                    }}
                                    className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900"
                                >
                                    Enter Access Code to Unlock
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {(Object.keys(activity.leveledPassages) as Array<keyof LeveledText>).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                const passage = activity.leveledPassages[level];
                                                const questions = activity.quizzes[level];
                                                const vocabulary = activity.vocabulary[level];
                                                setPassageData({ passage, questions });
                                                setSelectedVocabulary(vocabulary);
                                                setSelectedCustomActivity(activity);
                                                setSelectedLevel(level);
                                                setView('passage');
                                            }}
                                            className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                        >
                                            {level === 'low' ? 'Easier' : level === 'medium' ? 'Standard' : `${gradeLevel}`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {activityToUnlock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Unlock {activityToUnlock.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">Enter the code provided by your teacher for <b>{activeStudent}</b>.</p>
                        <input 
                            type="text" 
                            value={accessCodeInput}
                            onChange={e => setAccessCodeInput(e.target.value)}
                            className="w-full p-2 border rounded mb-2 text-center tracking-widest font-bold text-lg uppercase"
                            placeholder="CODE"
                        />
                        
                        <div className="mb-4 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                             <label className="flex items-start space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={honorPledge}
                                    onChange={(e) => setHonorPledge(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700 leading-tight">
                                    I promise that I am <b>{activeStudent}</b> and I will do this work myself without help from parents or tutors. (Amanah/Trust)
                                </span>
                            </label>
                        </div>

                        {accessCodeError && <p className="text-red-500 text-xs mb-2">{accessCodeError}</p>}
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => {setActivityToUnlock(null); setAccessCodeError(''); setHonorPledge(false)}} className="flex-1 py-2 bg-gray-200 rounded font-semibold">Cancel</button>
                            <button onClick={handleUnlock} className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold disabled:bg-gray-400" disabled={!honorPledge || !accessCodeInput}>Unlock</button>
                        </div>
                    </div>
                </div>
            )}
         </div>
    );
  }

  if (view === 'passageSelection' && selectedSkill && selectedLevel) {
    const numPassages = PASSAGES_PER_LEVEL[selectedLevel as ReadingLevel];
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <button onClick={() => setView('levelSelection')} className="text-blue-600 hover:underline">
              &larr; Back to Levels
          </button>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">{selectedSkill} - {selectedLevel}</h2>
        <p className="text-gray-600 mb-8 text-center">Complete a passage with a perfect score to unlock the next!</p>
        <div className="flex flex-wrap gap-4 p-4 bg-sky-100/60 rounded-lg justify-center">
            {Array.from({ length: numPassages }, (_, i) => i + 1).map(passageNum => {
                const isComplete = isPassageComplete(selectedSkill, selectedLevel as ReadingLevel, passageNum);
                const isLocked = passageNum > 1 && !isPassageComplete(selectedSkill, selectedLevel as ReadingLevel, passageNum - 1);
                return (
                    <PassageButton
                        key={passageNum}
                        passageNumber={passageNum}
                        isLocked={isLocked}
                        isComplete={isComplete}
                        onClick={() => handlePassageSelect(passageNum)}
                    />
                );
            })}
        </div>
      </div>
    );
  }

  if (view === 'levelSelection' && selectedSkill) {
      const isBeginnerComplete = areAllLevelPassagesComplete(selectedSkill, 'Beginner');
      const isIntermediateComplete = areAllLevelPassagesComplete(selectedSkill, 'Intermediate');

      return (
        <div className="max-w-2xl mx-auto p-4">
          <div className="mb-6">
            <button onClick={() => setView('skillSelection')} className="text-blue-600 hover:underline">
                &larr; Back to Skills
            </button>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Reading Practice: {selectedSkill}</h2>
          <p className="text-gray-600 mb-8 text-center">Complete all passages in a level with a perfect score to unlock the next!</p>
          <div className="space-y-4">
              <LevelButton 
                level="Beginner"
                isLocked={false}
                isComplete={isBeginnerComplete}
                onClick={() => handleLevelClick('Beginner')}
              />
              <LevelButton 
                level="Intermediate"
                isLocked={!isBeginnerComplete}
                isComplete={isIntermediateComplete}
                onClick={() => handleLevelClick('Intermediate')}
              />
              <LevelButton 
                level="Advanced"
                isLocked={!isIntermediateComplete}
                isComplete={areAllLevelPassagesComplete(selectedSkill, 'Advanced')}
                onClick={() => handleLevelClick('Advanced')}
              />
          </div>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Reading Practice</h2>
      <p className="text-gray-600 mb-8">Choose a skill to practice!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {curriculum.customReadingActivities.length > 0 && (
             <button
                onClick={() => setView('customPassageSelection')}
                className="w-full p-6 bg-purple-50 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left md:col-span-2"
              >
                <h3 className="text-xl font-semibold text-purple-700">Teacher's Custom Passages</h3>
                <p className="text-gray-500 mt-1">Practice with materials prepared by your teacher.</p>
             </button>
        )}
        {curriculum.readingSkills.map((skill) => (
          <button
            key={skill}
            onClick={() => handleSkillClick(skill)}
            className="w-full p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-left"
          >
            <h3 className="text-xl font-semibold text-teal-600">{skill}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};