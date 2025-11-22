import React, { useState, useRef } from 'react';
import { checkPersonalNarrative, checkLetterWriting, getTextFromImage, detectAIGeneratedText, generatePracticeWorksheet } from '../services/geminiService';
import type { WritingFeedback, LetterWritingFeedback, ActivityRecord, Student, LetterPartFeedback, AIDetectionResult, PracticeWorksheet, Curriculum } from '../types';
import { Spinner, UploadIcon, CheckCircleIcon, DownloadIcon } from './common/Icons';

interface WritingCheckerProps {
  onComplete: () => void;
  curriculum: Curriculum;
}

const scoreColor = (score: number) => {
    if (score <= 2) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-green-500';
};

const ScoreLine: React.FC<{ label: string; scoreData: { score: number; justification: string | null; } }> = ({ label, scoreData }) => (
    <div>
        <p className="flex justify-between font-medium">{label}: <span className={`font-bold ${scoreColor(scoreData.score)}`}>{scoreData.score}/5</span></p>
        {scoreData.justification && (
            <p className="text-xs text-gray-500 italic mt-1 pl-2 border-l-2 ml-1">
                └ {scoreData.justification}
            </p>
        )}
    </div>
);


const getPartStatusIcon = (status: LetterPartFeedback['status']) => {
    switch (status) {
        case 'Correct':
            return <span className="text-green-500">✔</span>;
        case 'Needs Improvement':
            return <span className="text-orange-500">!</span>;
        case 'Missing':
            return <span className="text-red-500">✘</span>;
    }
};

export const WritingChecker: React.FC<WritingCheckerProps> = ({ onComplete, curriculum }) => {
  const gradeLevel = curriculum.gradeLevel;
  const [writingType, setWritingType] = useState<'personalNarrative' | 'letterWriting'>('personalNarrative');
  const [text, setText] = useState('');
  const [personalNarrativeFeedback, setPersonalNarrativeFeedback] = useState<WritingFeedback | null>(null);
  const [letterFeedback, setLetterFeedback] = useState<LetterWritingFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiCheckEnabled, setAiCheckEnabled] = useState(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);

  const [practiceWorksheet, setPracticeWorksheet] = useState<PracticeWorksheet | null>(null);
  const [isGeneratingWorksheet, setIsGeneratingWorksheet] = useState(false);


  const handleTypeChange = (type: 'personalNarrative' | 'letterWriting') => {
    setWritingType(type);
    setText('');
    setPersonalNarrativeFeedback(null);
    setLetterFeedback(null);
    setError(null);
    setAiDetectionResult(null);
    setPracticeWorksheet(null);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setPersonalNarrativeFeedback(null);
    setLetterFeedback(null);
    setAiDetectionResult(null);
    setPracticeWorksheet(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          const extractedText = await getTextFromImage({ data: base64String, mimeType: file.type });
          setText(extractedText);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Could not extract text from the image. Please try again.');
      console.error(err);
      setIsUploading(false);
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (writingType === 'personalNarrative' && text.trim().split(/\s+/).length < 60) {
        setError('Please write more (at least 60 words) to get your score.');
        return;
    }
    if (text.trim().length < 10) {
      setError('Please write a little more before checking.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPersonalNarrativeFeedback(null);
    setLetterFeedback(null);
    setAiDetectionResult(null);
    setPracticeWorksheet(null);

    try {
        let aiResultPromise: Promise<AIDetectionResult> | null = null;
        if (aiCheckEnabled) {
            aiResultPromise = detectAIGeneratedText(text, gradeLevel);
        }

        if (writingType === 'personalNarrative') {
            const result = await checkPersonalNarrative(text, gradeLevel);

            const calculatedTotal = result.scores.paragraphs.score +
                                  result.scores.grammar.score +
                                  result.scores.sentenceStructure.score +
                                  result.scores.spellingAndPunctuation.score;
            
            result.scores.total = calculatedTotal;

            setPersonalNarrativeFeedback(result);
            
            if (calculatedTotal < 16) {
                setIsGeneratingWorksheet(true);
                try {
                    const worksheetData = await generatePracticeWorksheet(text, result, gradeLevel);
                    setPracticeWorksheet(worksheetData);
                } catch (wsError) {
                    console.error("Failed to generate practice worksheet:", wsError);
                } finally {
                    setIsGeneratingWorksheet(false);
                }
            }

        } else { // Letter Writing
            const result = await checkLetterWriting(text, gradeLevel);
            setLetterFeedback(result);
        }

        if (aiResultPromise) {
            const aiResult = await aiResultPromise;
            setAiDetectionResult(aiResult);
        }

    } catch (err) {
      setError('Could not get feedback from the AI. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadWorksheet = () => {
    if (!practiceWorksheet || !practiceWorksheet.worksheetContent) return;

    const worksheetText = practiceWorksheet.worksheetContent;
    
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Writing Practice Worksheet</title>
        <style> body { font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 14pt; margin: 1in; } .worksheet-container { line-height: 2.5; } </style>
      </head><body><div class="worksheet-container">${worksheetText.replace(/\n/g, '<br />')}</div></body></html>`;
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'writing_practice_worksheet.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Writing Checker</h2>
      <p className="text-gray-600 mb-6 text-center">
        {writingType === 'personalNarrative' ? 'Write a story, or upload a photo of handwriting!' : 'Write a letter, or upload a photo of it!'}
      </p>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-center items-center mb-4 border-b pb-4">
            <span className="font-semibold text-gray-700 mr-4">Writing Type:</span>
            <div className="flex items-center space-x-2">
                <button onClick={() => handleTypeChange('personalNarrative')} className={`px-4 py-2 text-sm font-semibold rounded-full ${writingType === 'personalNarrative' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-700'}`}>Personal Narrative</button>
                <button onClick={() => handleTypeChange('letterWriting')} className={`px-4 py-2 text-sm font-semibold rounded-full ${writingType === 'letterWriting' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-700'}`}>Letter Writing</button>
            </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        <textarea 
          value={text} 
          onChange={handleTextChange} 
          onPaste={(e) => { e.preventDefault(); alert("Please type your own work. Pasting is not allowed."); }} 
          className="w-full p-4 border border-gray-300 rounded-lg h-64 focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed"
          placeholder={writingType === 'personalNarrative' ? "Start writing your story here... (No Copy/Paste)" : "Start writing your letter here... (No Copy/Paste)"} 
        />
        <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
             <div className="flex items-center space-x-2">
                <label htmlFor="ai-check-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" id="ai-check-toggle" className="sr-only" checked={aiCheckEnabled} onChange={() => setAiCheckEnabled(!aiCheckEnabled)} />
                        <div className={`block w-12 h-6 rounded-full transition ${aiCheckEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${aiCheckEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-semibold text-gray-700">AI Detector</div>
                </label>
            </div>
          <div className="flex items-center space-x-2">
            <button onClick={triggerFileInput} disabled={isUploading || isLoading} className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400 flex items-center">
              {isUploading ? <Spinner /> : <UploadIcon className="w-5 h-5" />}
              <span className="ml-2">{isUploading ? 'Reading...' : 'Upload Photo'}</span>
            </button>
            <button onClick={handleSubmit} disabled={isLoading || isUploading || !text.trim()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
              {isLoading && <Spinner />}<span className={isLoading ? 'ml-2' : ''}>Check Writing</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
      </div>

      {aiDetectionResult && (
        <div className={`mt-8 p-6 rounded-xl shadow-lg border-t-4 ${aiDetectionResult.isAI ? 'bg-red-50 border-red-400' : 'bg-teal-50 border-teal-400'}`}>
            <h3 className="text-xl font-bold mb-2">{aiDetectionResult.isAI ? 'AI Generated Text Detected' : 'Likely Human-Written'}</h3>
            <div className="flex items-center space-x-4 mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${aiDetectionResult.isAI ? 'bg-red-500' : 'bg-teal-500'}`} style={{width: `${aiDetectionResult.confidence * 100}%`}}></div>
                </div>
                <span className={`font-bold text-lg ${aiDetectionResult.isAI ? 'text-red-600' : 'text-teal-600'}`}>
                    {(aiDetectionResult.confidence * 100).toFixed(0)}% Confident
                </span>
            </div>
            <p className="text-gray-700 italic">"{aiDetectionResult.reason}"</p>
        </div>
      )}

      {personalNarrativeFeedback && writingType === 'personalNarrative' && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Feedback</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Scores & Justifications</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <ScoreLine scoreData={personalNarrativeFeedback.scores.paragraphs} label="Paragraphs" />
                <ScoreLine scoreData={personalNarrativeFeedback.scores.grammar} label="Grammar" />
                <ScoreLine scoreData={personalNarrativeFeedback.scores.sentenceStructure} label="Sentence Structure" />
                <ScoreLine scoreData={personalNarrativeFeedback.scores.spellingAndPunctuation} label="Spelling & Punctuation" />
                <hr className="my-2"/><p className="flex justify-between font-bold text-lg">Total: <span className="text-blue-600">{personalNarrativeFeedback.scores.total}/20</span></p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">What was done well!</h4>
              <div className="p-4 bg-green-50 rounded-lg"><table className="w-full"><tbody>
                {personalNarrativeFeedback.goodPoints.map((point, i) => (
                <tr key={i} className="border-b border-green-200 last:border-b-0">
                    <td className="py-2 pr-2"><CheckCircleIcon className="w-6 h-6 text-green-600" /></td>
                    <td className="py-2 text-green-800">{point}</td>
                </tr>))}</tbody></table>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Areas for Improvement</h4>
            {personalNarrativeFeedback.improvementArea.length > 0 ? (
                <div className="space-y-3">
                {personalNarrativeFeedback.improvementArea.map((item, i) => (
                    <div key={i} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <p><span className="font-semibold">Mistake:</span> <span className="text-red-600 font-mono">"{item.mistake}"</span></p>
                    <p><span className="font-semibold">Correction:</span> <span className="text-green-600 font-mono">"{item.correction}"</span></p>
                    <p className="text-sm text-gray-600 mt-1">{item.explanation}</p>
                    </div>
                ))}</div>
            ) : (<p className="text-gray-600 p-4 bg-gray-50 rounded-lg">No specific mistakes found. Great job!</p>)}
           </div>
           {personalNarrativeFeedback.scores.total < 16 && (
            <div className="mt-8 p-6 bg-sky-50 rounded-xl border-t-4 border-sky-300">
                <h4 className="text-xl font-bold text-sky-800">Practice Sheet</h4>
                <p className="text-gray-600 mt-1 mb-4">Here are some tips and a practice sheet to help improve.</p>
                {isGeneratingWorksheet ? (
                    <div className="flex items-center justify-center p-4"><Spinner /><p className="ml-3 text-gray-700">Creating a personalized practice sheet...</p></div>
                ) : practiceWorksheet ? (
                    <div>
                        <div className="bg-white p-4 rounded-lg shadow-inner space-y-2 mb-4">
                            {practiceWorksheet.guidelines.map((guideline, i) => (
                                <div key={i} className="flex items-start">
                                     <CheckCircleIcon className="w-5 h-5 text-sky-600 mr-2 mt-0.5 flex-shrink-0" /><p className="text-gray-800">{guideline}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleDownloadWorksheet} className="w-full flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition">
                            <DownloadIcon className="w-5 h-5 mr-2" />Download Practice Worksheet
                        </button>
                    </div>
                ) : (<p className="text-red-500 font-semibold">Could not generate a practice sheet this time.</p>)}
            </div>)}
        </div>
      )}

      {letterFeedback && writingType === 'letterWriting' && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Letter Feedback</h3>
            <p className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg">{letterFeedback.overallComment}</p>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-lg font-semibold mb-2">Letter Structure</h4>
                    <div className="space-y-2">
                        {letterFeedback.partsFeedback.map(part => (
                            <div key={part.part} className="p-3 bg-gray-50 rounded-lg flex items-start">
                                <div className="mr-3 text-lg font-bold">{getPartStatusIcon(part.status)}</div>
                                <div><p className="font-semibold">{part.part}</p><p className="text-sm text-gray-600">{part.comment}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-2">Spelling & Punctuation</h4>
                    {letterFeedback.improvementArea.length > 0 ? (
                        <div className="space-y-3">
                        {letterFeedback.improvementArea.map((item, i) => (
                            <div key={i} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                                <p><span className="font-semibold">Mistake:</span> <span className="text-red-600 font-mono">"{item.mistake}"</span></p>
                                <p><span className="font-semibold">Correction:</span> <span className="text-green-600 font-mono">"{item.correction}"</span></p>
                                <p className="text-sm text-gray-600 mt-1">{item.explanation}</p>
                            </div>
                        ))}</div>
                    ) : (<p className="text-gray-600 p-4 bg-gray-50 rounded-lg">No spelling or punctuation mistakes found. Great job!</p>)}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};