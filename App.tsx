import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { View, ActivityRecord, SessionInfo, ParticipationRecord, Curriculum, ModuleId, Student, BaselineResult } from './types';
import { WritingChecker } from './components/WritingChecker';
import { GrammarPractice } from './components/GrammarPractice';
import { ReadingComprehension } from './components/ReadingComprehension';
import { ReportCard } from './components/ReportCard';
import { CoverTheBasics } from './components/CoverTheBasics';
import { AdminLogin } from './components/AdminLogin';
import { AdminConsole } from './components/AdminConsole';
import { LearnToWrite } from './components/LearnToWrite';
import { GuidedWriting } from './components/GuidedWriting';
import { TextLeveler } from './components/TextLeveler';
import { VocabularyPractice } from './components/VocabularyPractice';
import { SpellingStation } from './components/SpellingStation';
import { DiaryLog } from './components/DiaryLog';
import { BaselineTest } from './components/BaselineTest';
import { WritingIcon, GrammarIcon, ReadingIcon, ReportIcon, CoverBasicsIcon, LearnToWriteIcon, GuidedWritingIcon, Spinner, TextLevelerIcon, VocabularyIcon, SpellingStationIcon, DiaryIcon, CheckCircleIcon, CloseIcon, DeleteIcon, UploadIcon, DataIcon, EditIcon } from './components/common/Icons';
import { getCurriculum, saveCurriculum, studentsByGrade } from './curriculum';
import { initFirebase, getCurriculumFromCloud, saveCurriculumToCloud, getAllParticipationFromCloud, saveParticipationToCloud, getAllActivityRecordsFromCloud, saveActivityRecordToCloud, checkDatabaseAccess, uploadLocalDataToCloud } from './services/firebase';

// --- LOCALSTORAGE HELPER FUNCTIONS ---
function safeJSONParse<T>(item: string | null, fallback: T): T {
    if (!item) return fallback;
    try {
        return JSON.parse(item);
    } catch (e) {
        console.warn('Failed to parse JSON from storage, returning fallback.', item, e);
        return fallback;
    }
};

const getParticipationRecordsFromStorage = (): ParticipationRecord[] => {
    return safeJSONParse<ParticipationRecord[]>(localStorage.getItem('participationRecords'), []);
};

const saveParticipationRecordsToStorage = (records: ParticipationRecord[]) => {
    localStorage.setItem('participationRecords', JSON.stringify(records));
};

const getActivityRecordsFromStorage = (): ActivityRecord[] => {
    return safeJSONParse<ActivityRecord[]>(localStorage.getItem('activityRecords'), []);
};

const saveActivityRecordsToStorage = (records: ActivityRecord[]) => {
    localStorage.setItem('activityRecords', JSON.stringify(records));
};

// --- COMPONENTS ---

const LandingPage: React.FC<{ onTeacherSelect: () => void, onStudentSelect: () => void }> = ({ onTeacherSelect, onStudentSelect }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-lg w-full">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">English Genius</h1>
            <p className="text-gray-500 mb-8">Welcome! Who are you?</p>
            <div className="grid grid-cols-2 gap-6">
                <button onClick={onStudentSelect} className="p-6 border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🧑‍🎓</div>
                    <h3 className="text-xl font-bold text-blue-700">Student</h3>
                </button>
                <button onClick={onTeacherSelect} className="p-6 border-2 border-purple-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🧑‍🏫</div>
                    <h3 className="text-xl font-bold text-purple-700">Teacher</h3>
                </button>
            </div>
        </div>
    </div>
);

const StudentLogin: React.FC<{ 
    onBack: () => void; 
    onLogin: (name: string) => void; 
}> = ({ onBack, onLogin }) => {
    const [step, setStep] = useState<'grade' | 'name'>('grade');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

    const grades = Object.keys(studentsByGrade);

    if (step === 'grade') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-sky-50">
                <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Class</h2>
                    <div className="space-y-4">
                        {grades.map(grade => (
                            <button 
                                key={grade} 
                                onClick={() => { setSelectedGrade(grade); setStep('name'); }}
                                className="w-full p-4 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-xl font-bold text-blue-700 transition-all"
                            >
                                {grade}
                            </button>
                        ))}
                    </div>
                    <button onClick={onBack} className="mt-8 text-gray-500 hover:text-gray-700">Back</button>
                </div>
            </div>
        );
    }

    const students = selectedGrade ? studentsByGrade[selectedGrade as keyof typeof studentsByGrade] : [];

    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-50 p-4">
            <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-xl text-center max-h-[90vh] overflow-hidden flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Find Your Name</h2>
                <p className="text-gray-500 mb-6">Class: {selectedGrade}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-2">
                    {students.map(name => (
                        <button 
                            key={name}
                            onClick={() => onLogin(name)}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-blue-100 hover:text-blue-800 text-gray-700 font-medium transition-colors text-sm"
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                    <button onClick={() => setStep('grade')} className="text-blue-600 hover:underline mr-6">Change Class</button>
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const StudentDashboard: React.FC<{ 
    studentName: string, 
    curriculum: Curriculum, 
    setView: (v: View) => void,
    activityRecords: ActivityRecord[]
}> = ({ studentName, curriculum, setView, activityRecords }) => {
    
    const profile = curriculum.studentProfiles.find(p => p.name === studentName);
    const needsBaseline = !profile?.baselineTaken;
    const myAssignments = curriculum.assignments.filter(a => a.studentName === studentName && a.activityType === 'module');
    
    // If student has explicit assignments, filter modules. Otherwise show all (legacy behavior/default)
    const hasAssignments = myAssignments.length > 0;
    
    const isModuleUnlocked = (moduleId: ModuleId) => {
        // Check feature toggle first
        if (!curriculum.featureToggles[moduleId as keyof typeof curriculum.featureToggles]) return false;
        
        if (!hasAssignments) return true; // If nothing assigned, show all (default mode)
        return myAssignments.some(a => a.moduleId === moduleId);
    };

    const modules = [
        { id: 'writing', title: 'Writing Checker', icon: <WritingIcon className="w-8 h-8 text-blue-500" /> },
        { id: 'grammar', title: 'Grammar Practice', icon: <GrammarIcon className="w-8 h-8 text-indigo-500" /> },
        { id: 'reading', title: 'Reading Comprehension', icon: <ReadingIcon className="w-8 h-8 text-teal-500" /> },
        { id: 'coverTheBasics', title: 'Cover Basics', icon: <CoverBasicsIcon className="w-8 h-8 text-green-500" /> },
        { id: 'learnToWrite', title: 'Learn to Write', icon: <LearnToWriteIcon className="w-8 h-8 text-orange-500" /> },
        { id: 'guidedWriting', title: 'Guided Writing', icon: <GuidedWritingIcon className="w-8 h-8 text-purple-500" /> },
        { id: 'vocabulary', title: 'Vocabulary', icon: <VocabularyIcon className="w-8 h-8 text-cyan-500" /> },
        { id: 'textLeveler', title: 'Text Leveler', icon: <TextLevelerIcon className="w-8 h-8 text-red-500" /> },
        { id: 'spellingStation', title: 'Spelling Station', icon: <SpellingStationIcon className="w-8 h-8 text-lime-500" /> },
        { id: 'diaryLog', title: 'My Diary', icon: <DiaryIcon className="w-8 h-8 text-amber-500" /> },
    ];

    if (needsBaseline) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500">
                    <h2 className="text-2xl font-bold mb-4">Hello, {studentName}!</h2>
                    <p className="text-gray-600 mb-6">Before we start, let's do a quick check-in activity.</p>
                    <button onClick={() => setView('baselineTest')} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 animate-bounce">
                        Start Activity
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">My Dashboard: {studentName}</h2>
            
            {/* Only show customized message if assignments exist */}
            {hasAssignments && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <p className="text-blue-800 font-medium">⭐ Your teacher has assigned specific activities for you!</p>
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-600 mb-3">Learning Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {modules.filter(m => isModuleUnlocked(m.id as ModuleId)).map(m => (
                    <button key={m.id} onClick={() => setView(m.id as View)} className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center">
                        <div className="mb-3">{m.icon}</div>
                        <span className="font-bold text-gray-700">{m.title}</span>
                    </button>
                ))}
            </div>
            
            {modules.filter(m => isModuleUnlocked(m.id as ModuleId)).length === 0 && (
                <div className="text-center p-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No activities assigned yet. Ask your teacher!</p>
                </div>
            )}
        </div>
    );
};

// Session Setup (Renamed/Refactored for Teacher Projector Mode)
function SessionSetup({ onSessionStart, onAdminClick }: { onSessionStart: (info: SessionInfo) => void; onAdminClick: () => void; }) {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const [date, setDate] = useState(formatDate(today));
    const [day, setDay] = useState(today.toLocaleDateString('en-US', { weekday: 'long' }));
    const [period, setPeriod] = useState(1);
    const [grade, setGrade] = useState<'Grade 3 O' | 'Grade 3 P'>('Grade 3 O');
    const [error, setError] = useState('');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateStr = e.target.value;
        if (!newDateStr) return;
        const newDate = new Date(newDateStr + 'T00:00:00Z');
        const dayOfWeek = newDate.getUTCDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) {
            setError('School days are Sunday to Thursday.');
        } else {
            setError('');
            setDate(newDateStr);
            setDay(newDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (error) return; 
        onSessionStart({ date, day, period, grade });
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-50">
             <div className="absolute top-4 right-4">
                <button onClick={onAdminClick} className="text-gray-600 font-semibold hover:text-blue-600">Admin Console</button>
            </div>
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Classroom Projector Mode</h1>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Date</label>
                        <input type="date" value={date} onChange={handleDateChange} className="w-full mt-1 p-2 border rounded-lg" />
                        <p className="text-center text-gray-500 text-sm mt-1">{day}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Period</label>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(p => (
                                <button key={p} type="button" onClick={() => setPeriod(p)} className={`flex-1 p-2 rounded-lg text-sm font-bold ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Grade</label>
                        <select value={grade} onChange={(e) => setGrade(e.target.value as any)} className="w-full mt-1 p-2 border rounded-lg bg-white">
                            <option value="Grade 3 O">Grade 3 O</option>
                            <option value="Grade 3 P">Grade 3 P</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Start Class Session</button>
                </form>
            </div>
        </div>
    );
};

// Mini Pop-up (Bottom Right Toast style)
const MiniStudentPopup: React.FC<{
    studentName: string;
    isSpecialNeeds: boolean;
    onClose: () => void;
    onLog: (isCorrect: boolean, seconds: number, points: number) => void;
}> = ({ studentName, isSpecialNeeds, onClose, onLog }) => {
    const [started, setStarted] = useState(false);
    const [msElapsed, setMsElapsed] = useState(0);
    const [scoreDisplay, setScoreDisplay] = useState(1000);
    const [finalResult, setFinalResult] = useState<{base: number, bonus: number, total: number} | 'incorrect' | null>(null);

    // Timer Logic: 
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (started && !finalResult) {
            interval = setInterval(() => {
                setMsElapsed(prev => prev + 100);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [started, finalResult]);

    // Calculate Current Score with Grace Period and Linear Decay
    useEffect(() => {
        if (!started) return;
        const totalDecayTime = 180 * 1000; // 3 minutes
        const gracePeriod = 3 * 1000; // 3 seconds

        if (msElapsed <= gracePeriod) {
            setScoreDisplay(1000);
        } else {
            // Linear decay from 3s to 180s
            // At 3s, score is 1000. At 180s, score is 0.
            const timeInDecay = msElapsed - gracePeriod;
            const decayWindow = totalDecayTime - gracePeriod;
            const fractionLost = timeInDecay / decayWindow;
            const newScore = Math.max(0, Math.floor(1000 * (1 - fractionLost)));
            setScoreDisplay(newScore);
        }
    }, [msElapsed, started]);

    const formattedTime = (msElapsed / 1000).toFixed(1);

    const handleCorrect = () => {
        setStarted(false); // Pause timer
        const bonus = Math.floor(scoreDisplay * 0.10); // 10% Bonus
        const total = scoreDisplay + bonus;
        
        setFinalResult({ base: scoreDisplay, bonus, total });

        // Show result for 2 seconds then save
        setTimeout(() => {
            onLog(true, msElapsed / 1000, total);
        }, 2000);
    };

    const handleIncorrect = () => {
        setStarted(false);
        // Visual feedback for incorrect
        setFinalResult('incorrect');
        
        // Show for 1.5s then close, logging 0
        setTimeout(() => {
            onLog(false, msElapsed / 1000, 0);
        }, 1500);
    };
    
    const handleAbsent = () => {
        // Just close, logic in parent handles pool (removed from current round)
        onClose();
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border-4 border-blue-500 z-50 animate-slide-up p-4">
            <div className="flex justify-between items-start mb-2">
                 <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Student</h3>
                    {isSpecialNeeds && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Accessible Mode</span>}
                 </div>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5" /></button>
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2 truncate" title={studentName}>{studentName}</h2>
            
            {/* Score Display Area */}
            <div className="flex justify-between items-end mb-4 h-12">
                {finalResult === 'incorrect' ? (
                    <div className="w-full text-center">
                        <div className="text-3xl font-extrabold text-red-500">0 PTS</div>
                        <div className="text-sm font-bold text-red-400">Try Again!</div>
                    </div>
                ) : finalResult && typeof finalResult !== 'string' ? (
                     <div className="animate-bounce w-full text-center">
                         <div className="text-sm font-bold text-gray-500">Base {finalResult.base} + Bonus {finalResult.bonus}</div>
                         <div className="text-3xl font-extrabold text-purple-600">{finalResult.total} PTS</div>
                     </div>
                ) : (
                    <>
                        <div>
                            <span className={`text-3xl font-mono font-bold ${scoreDisplay > 800 ? 'text-green-600' : scoreDisplay > 500 ? 'text-yellow-600' : 'text-red-500'}`}>{scoreDisplay}</span>
                            <span className="text-xs text-gray-500 font-bold ml-1">PTS</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-mono text-gray-600">{formattedTime}s</span>
                        </div>
                    </>
                )}
            </div>

            {!started && !finalResult ? (
                <div className="flex space-x-2">
                     <button 
                        onClick={() => setStarted(true)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition"
                    >
                        Start Timer
                    </button>
                    <button 
                        onClick={handleAbsent}
                        className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold rounded-lg shadow transition"
                        title="Mark Absent / Skip"
                    >
                        Absent
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleCorrect}
                        disabled={!!finalResult}
                        className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
                    >
                        Correct ✅
                    </button>
                    <button 
                        onClick={handleIncorrect}
                        disabled={!!finalResult}
                        className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow transition disabled:opacity-50"
                    >
                        Incorrect ❌
                    </button>
                </div>
            )}
        </div>
    );
};

// Leaderboard Modal
const LeaderboardModal: React.FC<{
    data: { name: string; score: number }[];
    onClose: () => void;
}> = ({ data, onClose }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
             // onClose(); // Optional: Uncomment to auto-close
        }, 5000); 
        return () => clearTimeout(timer);
    }, []);

    return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 pointer-events-auto">
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col border-4 border-yellow-400 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-purple-700">🏆 Leaderboard</h3>
                <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"><CloseIcon className="w-6 h-6"/></button>
            </div>
            <div className="overflow-y-auto flex-grow">
                {data.length === 0 ? <p className="text-gray-500 text-center py-4">No points yet!</p> : (
                    <table className="w-full">
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.name} className="border-b last:border-0 hover:bg-yellow-50">
                                    <td className="py-3 px-2 font-bold text-gray-500 w-8">{index + 1}.</td>
                                    <td className="py-3 px-2 font-semibold text-gray-800">{item.name}</td>
                                    <td className="py-3 px-2 text-right font-bold text-purple-600">{item.score} pts</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    </div>
)};

// Export Default for index.tsx compatibility
export default function App() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [view, setView] = useState<View>('landing');
  const [participationRecords, setParticipationRecords] = useState<ParticipationRecord[]>([]);
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudConfig, setCloudConfig] = useState(localStorage.getItem('firebaseConfig') || '');
  const [dbPermissionError, setDbPermissionError] = useState<string | null>(null);
  const [uploadingData, setUploadingData] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showConfig, setShowConfig] = useState(false); 
  
  // Student Mode State
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [activeStudentName, setActiveStudentName] = useState<string | null>(null);
  const [studentLoginVisible, setStudentLoginVisible] = useState(false);
  
  // Teacher Mode State (for Name Picker)
  const [activeStudent, setActiveStudent] = useState<string | null>(null); 
  const [remainingPool, setRemainingPool] = useState<string[]>([]); // Pool includes weighted duplicates
  const [poolSizeDisplay, setPoolSizeDisplay] = useState(0); // For display purposes
  const [resetKey, setResetKey] = useState(0); 

  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [activeStudentModalVisible, setActiveStudentModalVisible] = useState(false);

  // Initialization
  useEffect(() => {
    const init = async () => {
        const connected = initFirebase();
        setIsCloudConnected(connected);
        
        if (connected) {
            const { ok, error } = await checkDatabaseAccess();
            if (!ok && error === 'permission-denied') {
                setDbPermissionError("DATABASE LOCKED: Please update Firebase Rules to 'allow read, write: if true;'");
                setShowConfig(true); 
            } else {
                setDbPermissionError(null);
                setShowConfig(false); 
                
                const cloudCurriculum = await getCurriculumFromCloud();
                if (cloudCurriculum) {
                    setCurriculum(cloudCurriculum);
                } else {
                    setCurriculum(getCurriculum()); 
                }
                
                const partRecs = await getAllParticipationFromCloud();
                setParticipationRecords(partRecs);
                
                const actRecs = await getAllActivityRecordsFromCloud();
                setActivityRecords(actRecs);
            }
        } else {
            setShowConfig(true); 
            setCurriculum(getCurriculum());
            setParticipationRecords(getParticipationRecordsFromStorage());
            setActivityRecords(getActivityRecordsFromStorage());
        }
    };
    init();
    
    const savedSession = safeJSONParse<SessionInfo | null>(sessionStorage.getItem('sessionInfo'), null);
    if (savedSession) setSessionInfo(savedSession);
  }, [cloudConfig]);

  const shuffleArray = useCallback((array: string[]) => {
      let pool = [...array];
      for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool;
  }, []);

  const resetPicker = useCallback(() => {
    if (!sessionInfo || !curriculum) return;
    const studentList = studentsByGrade[sessionInfo.grade] || [];
    
    let pool: string[] = [];
    studentList.forEach(student => {
        const profile = curriculum.studentProfiles.find(p => p.name === student);
        pool.push(student);
        if (profile?.isSpecialNeeds) {
            pool.push(student);
            pool.push(student);
            pool.push(student);
        }
    });

    const shuffled = shuffleArray(pool);
    setRemainingPool(shuffled);
    setPoolSizeDisplay(shuffled.length);
    setActiveStudent(null);
    setResetKey(p => p + 1);
  }, [sessionInfo, shuffleArray, curriculum]);

  useEffect(() => { if (sessionInfo && curriculum) resetPicker(); }, [sessionInfo, resetPicker, curriculum]);

  const handleStudentLoginSuccess = (name: string) => {
      setActiveStudentName(name);
      setIsStudentMode(true);
      setStudentLoginVisible(false);
      setView('studentDashboard');
  };

  const handleSetCurriculum = (newCurriculum: Curriculum) => {
      setCurriculum(newCurriculum);
      saveCurriculum(newCurriculum); 
      if (isCloudConnected && !dbPermissionError) saveCurriculumToCloud(newCurriculum);
  };
  
  const handleCloudConfigSave = () => {
      let config: any = {};
      let input = cloudConfig.trim();
      
      try {
          config = JSON.parse(input);
      } catch (e) {
          const regex = /['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
          let match;
          let foundAny = false;
          while ((match = regex.exec(input)) !== null) {
              foundAny = true;
              config[match[1]] = match[2];
          }
          if (!foundAny) {
               alert("Could not find valid configuration keys. Please ensure you copied the 'firebaseConfig' object correctly.");
               return;
          }
      }

      if (!config.apiKey || !config.projectId) {
          alert("Invalid Config: Missing 'apiKey' or 'projectId'. Please check your input.");
          return;
      }

      try {
          localStorage.setItem('firebaseConfig', JSON.stringify(config));
          window.location.reload();
      } catch (e) {
          alert("Error saving to local storage: " + (e as Error).message);
      }
  };
  
  const handleTestConnection = async () => {
      initFirebase();
      
      const { ok, error } = await checkDatabaseAccess();
      if (!ok && error === 'permission-denied') {
          setDbPermissionError("DATABASE LOCKED: Please update Firebase Rules to 'allow read, write: if true;'");
          setShowConfig(true);
      } else if (!ok) {
          setDbPermissionError(`Connection Failed: ${error}`);
          setShowConfig(true);
      } else {
          setDbPermissionError(null);
          alert("✅ Connection Successful! Your database is unlocked and ready.");
          setShowConfig(false);
      }
  };
  
  const handleUploadLocalData = async () => {
      if (!curriculum) {
          alert("⚠️ Critical Error: Curriculum data not loaded. Please refresh and try again.");
          return;
      }
      
      // Explicit initialization check
      const connected = initFirebase();
      if (!connected) {
          alert("❌ Firebase not initialized. Please check your configuration.");
          return;
      }
      
      if (!confirm("This will upload your current LOCAL data to the Cloud. Do this only if you want to sync your local progress to the database.")) return;
      
      alert("Starting upload... please wait.");
      setUploadingData(true);
      
      try {
          const localPart = getParticipationRecordsFromStorage();
          const localAct = getActivityRecordsFromStorage();
          
          console.log("Uploading...", { curriculum, localPart, localAct });
          
          const success = await uploadLocalDataToCloud(curriculum, localPart, localAct);
          if (success) {
              setUploadSuccess(true);
              setTimeout(() => setUploadSuccess(false), 3000);
              alert("✅ Success! Your class roster and scores are now in the cloud.");
          } else {
              alert("❌ Upload failed. Please check your internet connection and ensure the database isn't locked (Test Connection).");
          }
      } catch(e) {
          alert("❌ Unexpected error during upload: " + (e as Error).message);
      } finally {
          setUploadingData(false);
      }
  };

  const handleBaselineComplete = (results: BaselineResult) => {
      if (!curriculum || !activeStudentName) return;
      const updatedProfiles = [...curriculum.studentProfiles];
      const existingIndex = updatedProfiles.findIndex(p => p.name === activeStudentName);
      
      if (existingIndex >= 0) {
          updatedProfiles[existingIndex] = { ...updatedProfiles[existingIndex], baselineTaken: true, masteryLevel: results.level };
      } else {
          updatedProfiles.push({ name: activeStudentName, needsSupport: false, primaryLanguage: '', baselineTaken: true, masteryLevel: results.level });
      }
      
      handleSetCurriculum({ ...curriculum, studentProfiles: updatedProfiles });
      setView('studentDashboard');
  };

  const logActivity = useCallback((activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => {
        const newRecord: ActivityRecord = {
            ...activityData,
            id: new Date().toISOString() + Math.random(),
            studentSection: sessionInfo?.grade || 'Unknown',
            date: new Date().toISOString().split('T')[0],
        };
        
        const updated = [...activityRecords, newRecord];
        setActivityRecords(updated);
        saveActivityRecordsToStorage(updated);
        
        if (isCloudConnected && !dbPermissionError) saveActivityRecordToCloud(newRecord);
        
  }, [activityRecords, sessionInfo, isCloudConnected, dbPermissionError]);

  const logParticipation = useCallback((studentName: string, durationSeconds: number, isCorrect: boolean, score: number = 0) => {
        if (!sessionInfo) return;
        const newRecord: ParticipationRecord = {
            id: new Date().toISOString(),
            studentName,
            grade: sessionInfo.grade,
            date: sessionInfo.date,
            day: sessionInfo.day,
            period: sessionInfo.period,
            timestamp: Date.now(),
            durationSeconds,
            score: isCorrect ? score : 0, 
            isCorrect
        };
        
        setParticipationRecords(prev => {
            const updated = [...prev, newRecord];
            saveParticipationRecordsToStorage(updated);
            return updated;
        });
        
        if (isCloudConnected && !dbPermissionError) saveParticipationToCloud(newRecord);
        
  }, [sessionInfo, isCloudConnected, dbPermissionError]);


  const handleBack = () => {
      if (isStudentMode) setView('studentDashboard');
      else setView('menu');
  };
  
  const pickStudent = () => {
    if (remainingPool.length === 0) {
        resetPicker();
        return;
    }
    const nextStudent = remainingPool[0];
    setRemainingPool(prev => prev.slice(1));
    setActiveStudent(nextStudent);
    setActiveStudentModalVisible(true);
  };

  const handleResetPool = () => {
      if (window.confirm("Refill the student name pool? (Scores will remain)")) {
          resetPicker();
      }
  };

  const handleResetLeaderboard = () => {
    if (!sessionInfo) return;
    if (!window.confirm("⚠ RESET SESSION?\n\nThis will clear the leaderboard and refill the name pool for this class period.")) return;
    
    const currentRecords = getParticipationRecordsFromStorage();
    
    const otherRecords = currentRecords.filter(r => 
        r.date !== sessionInfo.date || 
        r.grade !== sessionInfo.grade || 
        Number(r.period) !== Number(sessionInfo.period)
    );
    
    saveParticipationRecordsToStorage(otherRecords);
    setParticipationRecords(otherRecords);
    resetPicker();
    setLeaderboardVisible(false);
  };
  
  const handleModalLog = (isCorrect: boolean, seconds: number, points: number) => {
      if (activeStudent) {
          logParticipation(activeStudent, seconds, isCorrect, isCorrect ? points : 0);
      }
      setActiveStudentModalVisible(false);
      setActiveStudent(null);
      if (isCorrect) {
          setLeaderboardVisible(true);
      }
  };

  const isSpecial = activeStudent && curriculum?.studentProfiles.find(p => p.name === activeStudent)?.isSpecialNeeds;

  const leaderboardData = useMemo(() => {
      if (!sessionInfo) return [];
      const sessionRecords = participationRecords.filter(r => 
          r.date === sessionInfo.date && r.grade === sessionInfo.grade && Number(r.period) === Number(sessionInfo.period) && r.isCorrect
      );
      const scores: Record<string, number> = {};
      sessionRecords.forEach(r => {
          const points = r.score !== undefined ? r.score : 1;
          scores[r.studentName] = (scores[r.studentName] || 0) + points;
      });
      return Object.entries(scores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score);
  }, [participationRecords, sessionInfo]);

  const renderView = () => {
    if (!curriculum) return <div className="p-10 text-center"><Spinner/> Loading...</div>;
    
    if (studentLoginVisible) {
        return <StudentLogin onBack={() => setStudentLoginVisible(false)} onLogin={handleStudentLoginSuccess} />;
    }

    const commonActivityProps = { 
        activeStudent: isStudentMode ? activeStudentName : activeStudent, 
        logParticipation: isStudentMode ? () => {} : logParticipation, 
        records: activityRecords,
        logActivity,
        onComplete: handleBack, 
        curriculum 
    };

    switch (view) {
        case 'landing': return <LandingPage onTeacherSelect={() => setView('adminLogin')} onStudentSelect={() => setStudentLoginVisible(true)} />;
        case 'studentDashboard': return activeStudentName ? <StudentDashboard studentName={activeStudentName} curriculum={curriculum} setView={setView} activityRecords={activityRecords} /> : <LandingPage onTeacherSelect={() => setView('adminLogin')} onStudentSelect={() => setStudentLoginVisible(true)} />;
        case 'baselineTest': return activeStudentName ? <BaselineTest studentName={activeStudentName} onComplete={handleBaselineComplete} logActivity={logActivity} /> : null;
        
        case 'sessionSetup': return <SessionSetup onSessionStart={(info) => { setSessionInfo(info); setView('menu'); }} onAdminClick={() => setView('adminLogin')} />;
        case 'adminLogin': return <AdminLogin onAdminLogin={() => { setIsAdmin(true); setView('adminConsole'); }} setView={setView} />;
        case 'adminConsole': return (
            <div className="space-y-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Administrator Console</h2>
                    <button 
                        onClick={() => setView('sessionSetup')} 
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 flex items-center"
                    >
                        <span>Exit to Classroom</span>
                    </button>
                </div>

                {dbPermissionError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow mb-4">
                        <p className="font-bold text-lg">⚠️ {dbPermissionError}</p>
                        <p className="text-sm mt-1">Go to Firebase Console &gt; Build &gt; Firestore Database &gt; Rules. Delete everything and paste: <code>allow read, write: if true;</code></p>
                    </div>
                )}
                
                <div className="bg-blue-900 text-white rounded-lg shadow-lg overflow-hidden transition-all">
                    {!showConfig && isCloudConnected && !dbPermissionError ? (
                        <div className="p-4 flex justify-between items-center bg-green-700">
                            <div className="flex items-center">
                                <span className="text-xl mr-2">✅</span>
                                <div>
                                    <h3 className="font-bold">Cloud Status: Online</h3>
                                    <p className="text-xs text-green-200">Syncing with Firebase</p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                 <button onClick={handleUploadLocalData} disabled={uploadingData || uploadSuccess} className={`flex items-center space-x-1 text-xs px-3 py-1 rounded text-white font-bold transition-all ${uploadSuccess ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                    {uploadingData ? <Spinner className="w-4 h-4" /> : uploadSuccess ? <CheckCircleIcon className="w-4 h-4"/> : <UploadIcon className="w-4 h-4" />}
                                    <span>{uploadSuccess ? 'Synced!' : 'Upload Data Now'}</span>
                                </button>
                                <button onClick={() => setShowConfig(true)} className="text-xs bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded">Show Settings</button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">Cloud Database Configuration</h3>
                                {isCloudConnected && <button onClick={() => setShowConfig(false)} className="text-xs text-blue-200 hover:text-white">Hide</button>}
                            </div>
                            <p className="text-sm text-blue-200 mb-4">Paste your Firebase Config JSON here to enable live syncing.</p>
                            <textarea 
                                value={cloudConfig}
                                onChange={(e) => setCloudConfig(e.target.value)}
                                className="w-full p-2 text-gray-900 rounded font-mono text-xs h-24"
                                placeholder='const firebaseConfig = { apiKey: "...", ... };'
                            />
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center space-x-4">
                                    <p className={`text-sm ${isCloudConnected ? 'text-green-300 font-bold' : 'text-red-300'}`}>
                                        {isCloudConnected ? '✅ Connected' : '❌ Offline (Local Storage)'}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={handleTestConnection} className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600 font-bold text-sm">Test Connection</button>
                                    <button onClick={handleCloudConfigSave} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 font-bold text-sm">Save & Reload</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <AdminConsole curriculum={curriculum} onCurriculumUpdate={handleSetCurriculum} />
            </div>
        );
        
        case 'menu': return (
            <div className="max-w-5xl mx-auto p-6 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Classroom Activities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {curriculum.featureToggles.writingChecker && (
                        <button onClick={() => setView('writing')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                            <WritingIcon className="w-10 h-10 text-blue-500 mb-2" />
                            <span className="font-bold text-gray-700">Writing Checker</span>
                        </button>
                    )}
                    {curriculum.featureToggles.grammarPractice && (
                        <button onClick={() => setView('grammar')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <GrammarIcon className="w-10 h-10 text-indigo-500 mb-2" />
                            <span className="font-bold text-gray-700">Grammar Practice</span>
                        </button>
                    )}
                    {curriculum.featureToggles.readingComprehension && (
                        <button onClick={() => setView('reading')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <ReadingIcon className="w-10 h-10 text-teal-500 mb-2" />
                            <span className="font-bold text-gray-700">Reading Comprehension</span>
                        </button>
                    )}
                    {curriculum.featureToggles.coverTheBasics && (
                        <button onClick={() => setView('coverTheBasics')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <CoverBasicsIcon className="w-10 h-10 text-green-500 mb-2" />
                            <span className="font-bold text-gray-700">Cover the Basics</span>
                        </button>
                    )}
                    {curriculum.featureToggles.learnToWrite && (
                        <button onClick={() => setView('learnToWrite')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <LearnToWriteIcon className="w-10 h-10 text-orange-500 mb-2" />
                            <span className="font-bold text-gray-700">Learn to Write</span>
                        </button>
                    )}
                     {curriculum.featureToggles.guidedWriting && (
                        <button onClick={() => setView('guidedWriting')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <GuidedWritingIcon className="w-10 h-10 text-purple-500 mb-2" />
                            <span className="font-bold text-gray-700">Guided Writing</span>
                        </button>
                    )}
                    {curriculum.featureToggles.vocabularyPractice && (
                        <button onClick={() => setView('vocabulary')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <VocabularyIcon className="w-10 h-10 text-cyan-500 mb-2" />
                            <span className="font-bold text-gray-700">Vocabulary</span>
                        </button>
                    )}
                    {curriculum.featureToggles.textLeveler && (
                         <button onClick={() => setView('textLeveler')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <TextLevelerIcon className="w-10 h-10 text-red-500 mb-2" />
                            <span className="font-bold text-gray-700">Text Leveler</span>
                        </button>
                    )}
                    {curriculum.featureToggles.spellingStation && (
                         <button onClick={() => setView('spellingStation')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <SpellingStationIcon className="w-10 h-10 text-lime-500 mb-2" />
                            <span className="font-bold text-gray-700">Spelling Station</span>
                        </button>
                    )}
                    {curriculum.featureToggles.diaryLog && (
                         <button onClick={() => setView('diaryLog')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <DiaryIcon className="w-10 h-10 text-amber-500 mb-2" />
                            <span className="font-bold text-gray-700">Class Diary</span>
                        </button>
                    )}
                    {curriculum.featureToggles.reportCard && (
                        <button onClick={() => setView('participationReport')} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-all flex flex-col items-center text-center">
                             <ReportIcon className="w-10 h-10 text-gray-500 mb-2" />
                            <span className="font-bold text-gray-700">Participation Report</span>
                        </button>
                    )}
                </div>
            </div>
        );
        
        // Activities
        case 'writing': return <WritingChecker {...commonActivityProps} />;
        case 'grammar': return <GrammarPractice {...commonActivityProps} />;
        case 'reading': return <ReadingComprehension {...commonActivityProps} />;
        case 'textLeveler': return <TextLeveler curriculum={curriculum} onUpdateAssignments={a => handleSetCurriculum({...curriculum, assignments: a})} />;
        case 'vocabulary': return <VocabularyPractice {...commonActivityProps} />;
        case 'guidedWriting': return <GuidedWriting {...commonActivityProps} />;
        case 'coverTheBasics': return <CoverTheBasics {...commonActivityProps} isAdmin={isAdmin} />;
        case 'learnToWrite': return <LearnToWrite {...commonActivityProps} />;
        case 'spellingStation': return <SpellingStation {...commonActivityProps} />;
        case 'diaryLog': return <DiaryLog records={participationRecords} onUpdateRecords={(updated) => { setParticipationRecords(updated); saveParticipationRecordsToStorage(updated); }} />;
        case 'participationReport': return <ReportCard records={participationRecords} />;
        
        default: return <div>Unknown View</div>;
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 font-sans pb-24">
      {/* Navigation Bar - Only show if not on Landing or Login */}
      {view !== 'landing' && !studentLoginVisible && (
          <nav className="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-20 px-4 py-3 flex justify-between items-center print:hidden">
            <button onClick={() => { setView('landing'); setIsStudentMode(false); setIsAdmin(false); setActiveStudent(null); }} className="font-bold text-blue-600 text-lg">
                English Genius {isStudentMode ? '(Student)' : isAdmin ? '(Admin)' : '(Teacher)'}
            </button>
            {!isStudentMode && sessionInfo && (
                <div className="text-sm text-gray-500 hidden sm:block">{sessionInfo.grade} • {sessionInfo.day}</div>
            )}
            <button onClick={() => { setView('landing'); setIsStudentMode(false); setIsAdmin(false); setActiveStudent(null); }} className="text-sm text-gray-500 hover:text-red-500">Log Out</button>
          </nav>
      )}

      <main className="relative">
        {renderView()}

        {/* Global Components for Teacher Mode */}
        {!isStudentMode && sessionInfo && view !== 'landing' && view !== 'sessionSetup' && (
            <>
                {/* Active Student Popup - Persists across views */}
                {activeStudentModalVisible && activeStudent && (
                   <MiniStudentPopup 
                        studentName={activeStudent} 
                        isSpecialNeeds={!!isSpecial}
                        onClose={() => { setActiveStudentModalVisible(false); setActiveStudent(null); }} 
                        onLog={handleModalLog} 
                   />
                )}
                
                {/* Global Leaderboard Modal */}
                {leaderboardVisible && <LeaderboardModal data={leaderboardData} onClose={() => setLeaderboardVisible(false)} />}

                {/* Floating Tracker Bar - Available in ALL activities */}
                <div key={resetKey} className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200 p-3 z-40 flex items-center justify-between px-4 md:px-8 animate-slide-up">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider space-x-2 shadow-sm border border-purple-200">
                            <span>Pool: {remainingPool.length}</span>
                            <button 
                                onClick={handleResetPool} 
                                className="ml-2 w-5 h-5 flex items-center justify-center bg-purple-200 hover:bg-purple-300 rounded-full text-purple-800 transition"
                                title="Refill Pool"
                            >
                                ↺
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleResetLeaderboard} 
                            className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                            title="Clear Leaderboard & Reset Pool for this Session"
                        >
                            <DeleteIcon className="w-4 h-4" />
                            <span>Reset Session</span>
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setLeaderboardVisible(true)} 
                            className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold hover:bg-yellow-200 border border-yellow-300 shadow-sm flex items-center"
                        >
                            <span className="mr-1">🏆</span> <span className="hidden sm:inline">Leaderboard</span>
                        </button>
                        <button 
                            onClick={pickStudent} 
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center transform active:scale-95 transition-transform"
                        >
                            <span className="mr-2">🎲</span> Pick Name
                        </button>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}