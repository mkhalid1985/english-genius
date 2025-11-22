import React, { useState } from 'react';
import type { Student, ActivityRecord, Curriculum } from '../types';
import { CoverTheBasicsMenu } from './CoverTheBasicsMenu';
import { CVCActivity } from './CVCActivity';
import { SentenceScrambleActivity } from './SentenceScrambleActivity';
import { ParagraphComprehensionActivity } from './ParagraphComprehensionActivity';

interface CoverTheBasicsProps {
  records: ActivityRecord[];
  onComplete: () => void;
  isAdmin: boolean;
  curriculum: Curriculum;
  activeStudent: string | null;
  logParticipation: (studentName: string, durationSeconds: number, isCorrect: boolean) => void;
  logActivity: (activityData: Omit<ActivityRecord, 'id' | 'studentSection' | 'date'>) => void;
}

export interface ActivitySelection {
    type: string;
    session: number;
}
type BasicActivityView = 'menu' | ActivitySelection;


export const CoverTheBasics: React.FC<CoverTheBasicsProps> = ({ records, onComplete, isAdmin, curriculum, activeStudent, logParticipation, logActivity }) => {
  const [activityView, setActivityView] = useState<BasicActivityView>('menu');

  const handleComplete = () => {
    onComplete();
    setActivityView('menu');
  };

  const handleSelectActivity = (selection: ActivitySelection) => {
    setActivityView(selection);
  };

  if (activityView !== 'menu') {
    const { type, session } = activityView;
    const commonProps = { onComplete: handleComplete, category: type, session };

    if (type.startsWith('CVC Words')) {
        return <CVCActivity 
                  {...commonProps}
                  activeStudent={activeStudent}
                  logActivity={logActivity}
                />;
    }
    if (type.startsWith('Sentence Scramble')) {
        return <SentenceScrambleActivity 
                  {...commonProps}
                  curriculum={curriculum} 
                  activeStudent={activeStudent}
                  logActivity={logActivity}
               />;
    }
    if (type.startsWith('Paragraph Comprehension')) {
        return <ParagraphComprehensionActivity 
                  {...commonProps}
                  curriculum={curriculum} 
                  activeStudent={activeStudent}
                  logParticipation={logParticipation}
                  logActivity={logActivity}
              />;
    }
  }

  return (
    <CoverTheBasicsMenu
      records={records}
      setActivityView={handleSelectActivity}
      isAdmin={isAdmin}
      curriculum={curriculum}
    />
  );
};