import React, { useState, useMemo } from 'react';
import type { ParticipationRecord } from '../types';
import { PrintIcon, UsersIcon, ActivityIcon } from './common/Icons';

interface ParticipationReportProps {
  records: ParticipationRecord[];
}

type TimeFrame = 'day' | 'week' | 'month';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center">
        {icon}
        <div>
            <p className="text-4xl font-bold text-gray-800">{value}</p>
            <p className="text-gray-500">{title}</p>
        </div>
    </div>
);

// Helper to get UTC YYYY-MM-DD string to match the record format from SessionSetup
const getTodayISOString = () => {
    return new Date().toISOString().split('T')[0];
};

export const ReportCard: React.FC<ParticipationReportProps> = ({ records }) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
    const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>('all');
    const [selectedGrade, setSelectedGrade] = useState<'all' | 'Grade 3 O' | 'Grade 3 P'>('all');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        const todayStr = getTodayISOString();
        const now = new Date();

        let timeFiltered = records;

        // 1. Filter by Time
        if (timeFrame === 'day') {
            // Direct string comparison matches the format stored in SessionSetup
            timeFiltered = records.filter(r => r.date === todayStr);
        } else if (timeFrame === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);
            
            timeFiltered = records.filter(r => {
                // Create date object from the stored YYYY-MM-DD string
                const recordDate = new Date(r.date); 
                return recordDate >= startOfWeek;
            });
        } else if (timeFrame === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            timeFiltered = records.filter(r => {
                 const recordDate = new Date(r.date);
                 return recordDate >= startOfMonth;
            });
        }

        // 2. Filter by Grade
        if (selectedGrade !== 'all') {
            timeFiltered = timeFiltered.filter(r => r.grade === selectedGrade);
        }

        // 3. Filter by Period
        if (selectedPeriod !== 'all') {
            timeFiltered = timeFiltered.filter(r => r.period === selectedPeriod);
        }

        return timeFiltered;
    }, [records, timeFrame, selectedPeriod, selectedGrade]);

    const participationByStudent = useMemo(() => {
        const counts: { [name: string]: { count: number, records: ParticipationRecord[] } } = {};
        filteredRecords.forEach(record => {
            if (!counts[record.studentName]) {
                counts[record.studentName] = { count: 0, records: [] };
            }
            counts[record.studentName].count++;
            counts[record.studentName].records.push(record);
        });
        
        // Sort records for each student by time (newest first)
        Object.values(counts).forEach(data => {
            data.records.sort((a, b) => b.timestamp - a.timestamp);
        });

        // Sort students by count (ascending to show who participates least first)
        return Object.entries(counts).sort((a, b) => a[1].count - b[1].count);
    }, [filteredRecords]);

    const uniqueStudentsParticipated = participationByStudent.length;

    const handlePrint = () => {
        window.print();
    };

    const toggleExpand = (studentName: string) => {
        setExpandedStudent(prev => prev === studentName ? null : studentName);
    };

    if (records.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800">No Participation Logged Yet!</h2>
                <p className="text-gray-600 mt-2">Use the name picker in an activity to log student participation.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-3xl font-bold text-gray-800">Participation Report</h2>
                <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    aria-label="Print Report"
                >
                    <PrintIcon className="w-5 h-5" />
                    <span>Print</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg mb-6 print:hidden">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Time Filter */}
                    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setTimeFrame('day')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${timeFrame === 'day' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Day</button>
                        <button onClick={() => setTimeFrame('week')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${timeFrame === 'week' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Week</button>
                        <button onClick={() => setTimeFrame('month')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${timeFrame === 'month' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Month</button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Grade Filter */}
                        <div className="flex items-center space-x-2">
                            <label htmlFor="grade-filter" className="font-semibold text-gray-700 text-sm">Grade:</label>
                            <select
                                id="grade-filter"
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value as any)}
                                className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Grades</option>
                                <option value="Grade 3 O">Grade 3 O</option>
                                <option value="Grade 3 P">Grade 3 P</option>
                            </select>
                        </div>

                        {/* Period Filter */}
                        <div className="flex items-center space-x-2">
                            <label htmlFor="period-filter" className="font-semibold text-gray-700 text-sm">Period:</label>
                            <select
                                id="period-filter"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Periods</option>
                                {[1, 2, 3, 4, 5, 6, 7].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center mb-6 print:block hidden">
                <h3 className="text-xl font-bold">Participation Report</h3>
                <p className="text-gray-600">
                    Timeframe: {timeFrame.toUpperCase()} | Grade: {selectedGrade === 'all' ? 'All' : selectedGrade} | Period: {selectedPeriod === 'all' ? 'All' : selectedPeriod}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Total Participations" value={filteredRecords.length} icon={<ActivityIcon className="w-12 h-12 text-green-500 mr-4"/>} />
                <StatCard title="Unique Students" value={uniqueStudentsParticipated} icon={<UsersIcon className="w-12 h-12 text-blue-500 mr-4"/>} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Student Participation Details</h3>
                <p className="text-sm text-blue-600 font-semibold mb-4 print:hidden bg-blue-50 p-2 rounded inline-block">💡 Hint: Click on a student's row to see every time they participated.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 font-semibold text-gray-600">Student Name</th>
                                <th className="p-3 font-semibold text-gray-600">Grade</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">Total Count</th>
                                <th className="p-3 font-semibold text-gray-600 text-right">Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participationByStudent.map(([name, data]) => {
                                const lastRecord = data.records[0]; // Records are sorted by timestamp desc
                                const isExpanded = expandedStudent === name;
                                return (
                                <React.Fragment key={name}>
                                    <tr 
                                        onClick={() => toggleExpand(name)}
                                        className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="p-3 font-medium text-gray-800 flex items-center">
                                            <span className={`mr-2 transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`}>▶</span>
                                            {name}
                                        </td>
                                        <td className="p-3 text-gray-600">{lastRecord.grade}</td>
                                        <td className="p-3 text-center">
                                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">{data.count}</span>
                                        </td>
                                        <td className="p-3 text-gray-500 text-sm text-right">
                                            {new Date(lastRecord.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({lastRecord.date})
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={4} className="p-4 border-b border-gray-200">
                                                <div className="pl-4 border-l-4 border-blue-400">
                                                    <h5 className="font-bold text-gray-700 mb-2">Full History ({timeFrame})</h5>
                                                    <ul className="space-y-2">
                                                        {data.records.map((rec, idx) => (
                                                            <li key={idx} className="flex flex-col sm:flex-row justify-between text-sm text-gray-600 bg-white p-2 rounded shadow-sm">
                                                                <span>
                                                                    <span className="font-semibold text-gray-800">{rec.day}, {rec.date}</span>
                                                                    <span className="mx-2 text-gray-300 hidden sm:inline">|</span>
                                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs mt-1 sm:mt-0 block sm:inline w-fit">Period {rec.period}</span>
                                                                    <span className="mx-2 text-gray-300 hidden sm:inline">|</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs mt-1 sm:mt-0 block sm:inline w-fit ${rec.isCorrect === false ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                                                                        {rec.isCorrect === false ? 'Try Again' : (rec.durationSeconds ? `${rec.durationSeconds}s (Points)` : 'Participated')}
                                                                    </span>
                                                                </span>
                                                                <span className="mt-1 sm:mt-0 text-right">
                                                                     {new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                     {participationByStudent.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No participation records found for the selected filters.</p>
                    )}
                </div>
            </div>
        </div>
    );
};