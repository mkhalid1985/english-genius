import React, { useMemo, useState } from 'react';
import type { ParticipationRecord, DiaryEntry, SessionInfo } from '../types';
import { studentsByGrade } from '../curriculum';
import { DiaryIcon, DeleteIcon } from './common/Icons';

interface DiaryLogProps {
  records: ParticipationRecord[];
  onUpdateRecords: (updatedRecords: ParticipationRecord[]) => void;
}

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
};

const ConfirmationModal: React.FC<{ message: string, onConfirm: () => void, onCancel: () => void }> = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800">Are you sure?</h3>
            <p className="text-gray-600 mt-2">{message}</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg">Confirm Delete</button>
            </div>
        </div>
    </div>
);


export const DiaryLog: React.FC<DiaryLogProps> = ({ records, onUpdateRecords }) => {
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'session' | 'record', id: string } | null>(null);

    const diaryEntries = useMemo(() => {
        const sessions = new Map<string, { sessionInfo: SessionInfo, records: ParticipationRecord[] }>();

        records.forEach(record => {
            const sessionId = `${record.date}-${record.grade}-${record.period}`;
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, {
                    sessionInfo: {
                        date: record.date,
                        day: record.day,
                        period: record.period,
                        grade: record.grade,
                    },
                    records: [],
                });
            }
            sessions.get(sessionId)!.records.push(record);
        });

        const entries: DiaryEntry[] = Array.from(sessions.entries()).map(([id, data]) => {
            const totalStudents = studentsByGrade[data.sessionInfo.grade]?.length || 0;
            const uniqueParticipants = new Set(data.records.map(r => r.studentName));
            const participationCount = uniqueParticipants.size;
            const participationPercentage = totalStudents > 0 ? (participationCount / totalStudents) * 100 : 0;

            return {
                id,
                sessionInfo: data.sessionInfo,
                participationCount,
                totalStudents,
                participationPercentage,
                records: data.records.sort((a,b) => a.studentName.localeCompare(b.studentName)),
            };
        });

        return entries.sort((a, b) => new Date(b.sessionInfo.date).getTime() - new Date(a.sessionInfo.date).getTime());

    }, [records]);

    const handleToggleDetails = (entryId: string) => {
        setExpandedEntry(prev => (prev === entryId ? null : entryId));
    };
    
    const handleDeleteSession = (sessionId: string) => {
        const updatedRecords = records.filter(record => {
            const recordSessionId = `${record.date}-${record.grade}-${record.period}`;
            return recordSessionId !== sessionId;
        });
        onUpdateRecords(updatedRecords);
        setConfirmDelete(null);
    };

    const handleDeleteRecord = (recordId: string) => {
        const updatedRecords = records.filter(record => record.id !== recordId);
        onUpdateRecords(updatedRecords);
        setConfirmDelete(null);
    };

    const handleConfirm = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'session') {
            handleDeleteSession(confirmDelete.id);
        } else {
            handleDeleteRecord(confirmDelete.id);
        }
    };


    if (diaryEntries.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
                 <DiaryIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Your Class Diary is Empty!</h2>
                <p className="text-gray-600 mt-2">Conduct a class session and use the name picker in an activity to start logging your entries.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Class Diary Log</h2>
            <div className="space-y-6">
                {diaryEntries.map(entry => (
                    <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-amber-400">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                            <div>
                                <p className="text-xl font-bold text-gray-800">{new Date(entry.sessionInfo.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                <p className="text-gray-500 font-medium">{entry.sessionInfo.day}</p>
                            </div>
                            <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                                <div className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                                    <span className="bg-gray-200 px-3 py-1 rounded-full">{entry.sessionInfo.grade}</span>
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Period {entry.sessionInfo.period}</span>
                                </div>
                                 <button onClick={() => setConfirmDelete({ type: 'session', id: entry.id })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                    <DeleteIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="font-semibold text-gray-700">Participation</p>
                                <p className="font-bold text-gray-800">{entry.participationCount} <span className="font-normal text-gray-500">/ {entry.totalStudents} students</span></p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                    className="bg-amber-500 h-4 rounded-full" 
                                    style={{ width: `${entry.participationPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-right text-sm font-bold text-amber-600 mt-1">{entry.participationPercentage.toFixed(0)}%</p>
                        </div>
                        
                        <div className="mt-4">
                            <button onClick={() => handleToggleDetails(entry.id)} className="text-sm font-semibold text-blue-600 hover:underline">
                                {expandedEntry === entry.id ? 'Hide Details' : 'Show Details'}
                            </button>
                            {expandedEntry === entry.id && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="font-bold text-gray-700 mb-2">Participation Details</h4>
                                    <ul className="space-y-2">
                                        {entry.records.map(record => (
                                            <li key={record.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                                <span>{record.studentName}</span>
                                                <div className="flex items-center space-x-2">
                                                    {record.durationSeconds && <span className="text-sm font-medium text-gray-500">{formatDuration(record.durationSeconds)}</span>}
                                                     <button onClick={() => setConfirmDelete({ type: 'record', id: record.id })} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full">
                                                        <DeleteIcon className="w-4 h-4"/>
                                                     </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {confirmDelete && (
                <ConfirmationModal 
                    message={confirmDelete.type === 'session' ? 'This will delete the entire session log and all its participation records. This action cannot be undone.' : 'This will delete this student’s participation record for this session. This action cannot be undone.'}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
};