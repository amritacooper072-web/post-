import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';

// --- TYPE DEFINITIONS ---
interface CheckResult {
    username: string;
    post_date: string; // e.g., "2023-10-26" or "Error: User not found"
    error: boolean;
}

interface JobStatus {
    status: 'pending' | 'in_progress' | 'completed' | 'stopped';
    results: CheckResult[];
    total: number;
}


// --- HELPER COMPONENTS ---

const Icon = ({ path, className }: { path: string; className?: string }) => (
  <svg className={className || 'w-6 h-6'} viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

const Header = () => (
    <h1 className="text-3xl font-bold text-white text-center p-6 rounded-2xl bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] shadow-lg mb-6">
        Instagram Recent Post Checker
    </h1>
);

interface SettingsPanelProps {
    fileName: string;
    isChecking: boolean;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ fileName, isChecking, onFileChange, fileInputRef }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-4">
        <label htmlFor="file-upload" className={`flex-1 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed rounded-xl ${isChecking ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:border-indigo-400'}`}>
            <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25a1.875 1.875 0 001.875 1.875h12.75a1.875 1.875 0 001.875-1.875V12" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <span className="font-semibold">{fileName || "Click to select a .txt or .csv file"}</span>
            <input id="file-upload" ref={fileInputRef} type="file" className="hidden" accept=".txt,.csv" onChange={onFileChange} disabled={isChecking} />
        </label>
    </div>
);


interface ControlButtonsProps {
    onStart: () => void;
    onStop: () => void;
    onExport: () => void;
    isChecking: boolean;
    canStart: boolean;
    canExport: boolean;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onStart, onStop, onExport, isChecking, canStart, canExport }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <button onClick={onStart} disabled={!canStart || isChecking} className="flex items-center justify-center p-4 text-white font-bold rounded-2xl shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600">
            <Icon path="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" className="w-6 h-6 mr-2"/> Start
        </button>
        <button onClick={onStop} disabled={!isChecking} className="flex items-center justify-center p-4 text-white font-bold rounded-2xl shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600">
            <Icon path="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" className="w-6 h-6 mr-2"/> Stop
        </button>
        <button onClick={onExport} disabled={!canExport || isChecking} className="flex items-center justify-center p-4 text-white font-bold rounded-2xl shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-6 h-6 mr-2"/> Export
        </button>
    </div>
);


interface ProgressBarDisplayProps {
  progress: number;
  statusMessage: string;
  total: number;
  current: number;
}
const ProgressBarDisplay: React.FC<ProgressBarDisplayProps> = ({ progress, statusMessage, total, current }) => (
    <div className="bg-white p-4 rounded-2xl shadow-md mb-4 space-y-3">
        <div className="w-full bg-gray-200 rounded-full h-6">
            <div className="bg-gradient-to-r from-[#fa7e1e] via-[#d62976] to-[#962fbf] h-6 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center text-sm font-medium text-gray-600">
            <span>{statusMessage}</span>
            {total > 0 && <span>{`${current} / ${total} (${progress.toFixed(0)}%)`}</span>}
        </div>
    </div>
);


interface ResultsTableProps {
    results: CheckResult[];
}
const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">Results ({results.length})</h3>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Username</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Latest Post Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => (
                        <tr key={`${result.username}-${index}`} className={result.error ? 'bg-red-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                           <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <a href={`https://www.instagram.com/${result.username}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                    {result.username}
                                </a>
                            </td>
                           <td className={`px-4 py-4 whitespace-nowrap text-sm ${result.error ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>{result.post_date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---

export default function App() {
    const [usernames, setUsernames] = useState<string[]>([]);
    const [results, setResults] = useState<CheckResult[]>([]);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [jobToken, setJobToken] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('Select a file to begin.');
    const [totalUsernames, setTotalUsernames] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const pollStatus = async (token: string) => {
        try {
            const response = await fetch(`/api/job_status?token=${token}`);
            if (!response.ok) throw new Error('Failed to get job status');
            
            const data: JobStatus = await response.json();
            setResults(data.results);
            setTotalUsernames(data.total);

            if (data.status === 'completed' || data.status === 'stopped') {
                setIsChecking(false);
                setJobToken(null);
                setStatusMessage(`Process ${data.status}: ${data.results.length} checked.`);
                clearPolling();
            } else {
                 setStatusMessage(`Processing... (${data.results.length}/${data.total})`);
            }
        } catch (error) {
            console.error(error);
            setStatusMessage('Error polling job status. Stopping.');
            setIsChecking(false);
            clearPolling();
        }
    };

    useEffect(() => {
        if (jobToken && isChecking) {
            pollingIntervalRef.current = setInterval(() => {
                pollStatus(jobToken);
            }, 3000); // Poll every 3 seconds
        }
        return () => clearPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobToken, isChecking]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).map(line => line.split(',')[0].trim()).filter(Boolean);
            setUsernames(lines);
            setTotalUsernames(lines.length);
            setResults([]);
            setStatusMessage(`Loaded ${lines.length} usernames. Ready to start.`);
        };
        reader.readAsText(file);
    };

    const handleStart = async () => {
        if (usernames.length === 0) {
            setStatusMessage('No usernames loaded. Please select a file.');
            return;
        }
        
        setIsChecking(true);
        setResults([]);
        setStatusMessage('Starting job...');

        try {
            const response = await fetch('/api/start_job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames }),
            });

            if (!response.ok) throw new Error('Failed to start job');

            const data = await response.json();
            setJobToken(data.token);
            setStatusMessage('Job started. Waiting for first results...');

        } catch (error) {
            console.error(error);
            setStatusMessage('Error starting job. Please try again.');
            setIsChecking(false);
        }
    };

    const handleStop = async () => {
        if (!jobToken) return;
        setStatusMessage('Stopping job...');
        clearPolling();
        try {
            await fetch('/api/stop_job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: jobToken }),
            });
        } catch (error) {
            console.error('Failed to send stop signal:', error);
        }
        setIsChecking(false);
        setJobToken(null);
    };


    const handleExport = () => {
        if (results.length === 0) {
            setStatusMessage('No results to export.');
            return;
        }
        const headers = ['username', 'post_date'];
        const csvRows = [
            headers.join(','),
            ...results.map(row => `${JSON.stringify(row.username)},${JSON.stringify(row.post_date)}`)
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `instagram_results_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatusMessage('Results exported successfully.');
    };

    const progress = totalUsernames > 0 ? (results.length / totalUsernames) * 100 : 0;
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Header />
                <SettingsPanel 
                    fileName={fileName}
                    isChecking={isChecking}
                    onFileChange={handleFileChange}
                    fileInputRef={fileInputRef}
                />
                <ControlButtons 
                    onStart={handleStart}
                    onStop={handleStop}
                    onExport={handleExport}
                    isChecking={isChecking}
                    canStart={usernames.length > 0}
                    canExport={results.length > 0}
                />
                <ProgressBarDisplay 
                    progress={progress}
                    statusMessage={statusMessage}
                    total={totalUsernames}
                    current={results.length}
                />
                <ResultsTable results={results} />
            </div>
        </div>
    );
}