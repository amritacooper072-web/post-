import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { getMockUserInfo } from './services/instagramService';
import type { CheckResult, StoredSession } from './types';

// --- HELPER COMPONENTS (defined outside the main App to prevent re-creation on re-renders) ---

const Icon = ({ path, className }: { path: string; className?: string }) => (
  <svg className={className || 'w-6 h-6'} viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

const Header = () => (
    <h1 className="text-3xl font-bold text-white text-center p-6 rounded-2xl bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] shadow-lg mb-6">
        Instagram Profile Post Date Checker
    </h1>
);

interface SettingsPanelProps {
    fileName: string;
    minDelay: number;
    maxDelay: number;
    resumeSession: boolean;
    isChecking: boolean;
    usernames: string[];
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    setMinDelay: (v: number) => void;
    setMaxDelay: (v: number) => void;
    setResumeSession: (v: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ fileName, minDelay, maxDelay, resumeSession, isChecking, usernames, onFileChange, setMinDelay, setMaxDelay, setResumeSession, fileInputRef }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-4 space-y-4">
        <div className="flex items-center space-x-4">
            <label htmlFor="file-upload" className={`flex-1 cursor-pointer transition-all duration-300 items-center justify-center p-3 text-center border-2 border-dashed rounded-xl ${isChecking ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:border-indigo-400'}`}>
                <Icon path="M9 16.5V10.5C9 9.67157 9.67157 9 10.5 9H13.5C14.3284 9 15 9.67157 15 10.5V16.5M12 16.5H9M12 16.5H15M12 6.75L15 9.75M12 6.75L9 9.75" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="font-semibold">{fileName || "Click to select a .txt or .csv file"}</span>
                <input id="file-upload" ref={fileInputRef} type="file" className="hidden" accept=".txt,.csv" onChange={onFileChange} disabled={isChecking} />
            </label>
        </div>

        {usernames.length > 0 && (
            <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-800">File Content Preview:</p>
                <p className="text-xs text-gray-600 mt-1 italic truncate">
                    {usernames.slice(0, 5).join(', ')}
                    {usernames.length > 5 ? '...' : ''}
                </p>
            </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
                <label htmlFor="min-delay" className="font-medium text-gray-700">Min Delay (s):</label>
                <input type="number" id="min-delay" value={minDelay} onChange={e => setMinDelay(Math.max(1, parseInt(e.target.value, 10)))} className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={isChecking} />
            </div>
            <div className="flex items-center space-x-2">
                <label htmlFor="max-delay" className="font-medium text-gray-700">Max Delay (s):</label>
                <input type="number" id="max-delay" value={maxDelay} onChange={e => setMaxDelay(Math.max(1, parseInt(e.target.value, 10)))} className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={isChecking} />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="resume-session" checked={resumeSession} onChange={e => setResumeSession(e.target.checked)} className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500" disabled={isChecking} />
                <label htmlFor="resume-session" className="ml-2 font-medium text-gray-700">Resume previous session</label>
            </div>
        </div>
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
            <Icon path="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" className="w-6 h-6 mr-2"/> Start Checking
        </button>
        <button onClick={onStop} disabled={!isChecking} className="flex items-center justify-center p-4 text-white font-bold rounded-2xl shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600">
            <Icon path="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" className="w-6 h-6 mr-2"/> Stop Checking
        </button>
        <button onClick={onExport} disabled={!canExport || isChecking} className="flex items-center justify-center p-4 text-white font-bold rounded-2xl shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-6 h-6 mr-2"/> Export Results
        </button>
    </div>
);


interface ProgressBarDisplayProps {
  progress: number;
  statusMessage: string;
  timeRemaining: string;
  isChecking: boolean;
  total: number;
  current: number;
}
const ProgressBarDisplay: React.FC<ProgressBarDisplayProps> = ({ progress, statusMessage, timeRemaining, isChecking, total, current }) => (
    <div className="bg-white p-4 rounded-2xl shadow-md mb-4 space-y-3">
        <div className="w-full bg-gray-200 rounded-full h-6">
            <div className="bg-gradient-to-r from-[#fa7e1e] via-[#d62976] to-[#962fbf] h-6 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center text-sm font-medium text-gray-600">
            <span>{statusMessage}</span>
            {isChecking && total > 0 && <span>{`${current} / ${total} (${progress.toFixed(0)}%)`}</span>}
            <span>{timeRemaining}</span>
        </div>
    </div>
);


interface ResultsTableProps {
    results: CheckResult[];
    totalUsernames: number;
}
const ResultsTable: React.FC<ResultsTableProps> = ({ results, totalUsernames }) => (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Results
                {results.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({results.length} / {totalUsernames} checked)
                    </span>
                )}
            </h3>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Username</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Latest Post Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => (
                        <tr key={`${result.username}-${index}`} className={result.error ? 'bg-red-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <a
                                  href={`https://www.instagram.com/${result.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                >
                                    {result.username}
                                </a>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${result.error ? 'text-red-700 font-semibold' : 'text-gray-600'}`}>{result.post_date}</td>
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
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [minDelay, setMinDelay] = useState<number>(5);
    const [maxDelay, setMaxDelay] = useState<number>(7);
    const [resumeSession, setResumeSession] = useState<boolean>(true);
    const [fileName, setFileName] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('Select a file to begin.');
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isCheckingRef = useRef(isChecking);
    
    // Create a ref to hold all state and props needed by the processing loop.
    // This avoids stale closures in the recursive setTimeout.
    const stateRef = useRef({
        currentIndex,
        usernames,
        results,
        minDelay,
        maxDelay,
        resumeSession,
        fileName
    });

    // Keep the ref updated on every render
    useEffect(() => {
        stateRef.current = {
            currentIndex,
            usernames,
            results,
            minDelay,
            maxDelay,
            resumeSession,
            fileName
        };
        isCheckingRef.current = isChecking;
    });


    useEffect(() => {
        try {
            const savedSession = localStorage.getItem('instagramCheckerSession');
            if (savedSession && resumeSession) {
                const data: StoredSession = JSON.parse(savedSession);
                setStatusMessage(`Previous session found with ${data.usernames.length} usernames. File: ${data.fileName}. Processed ${data.currentIndex}. Click Start to resume.`);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            localStorage.removeItem('instagramCheckerSession');
        }
    }, [resumeSession]);

    // This is the core processing logic, wrapped in a stable useCallback.
    // It reads all dynamic data from stateRef.current to avoid stale state.
    const processQueue = useCallback(async () => {
        const { currentIndex, usernames, minDelay, maxDelay, resumeSession, fileName } = stateRef.current;

        if (!isCheckingRef.current || currentIndex >= usernames.length) {
            setIsChecking(false);
            setStatusMessage(`Finished checking ${usernames.length} profiles.`);
            setTimeRemaining('');
            localStorage.removeItem('instagramCheckerSession');
            return;
        }

        const username = usernames[currentIndex];
        setStatusMessage(`Checking ${username} (${currentIndex + 1}/${usernames.length})...`);

        const resultApi = await getMockUserInfo(username);
        const newResult: CheckResult = { username, post_date: 'N/A', error: false };
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;

        if (resultApi.error) {
            newResult.post_date = `Error: ${resultApi.error}`;
            newResult.error = true;
            if (resultApi.code === 429) {
                setStatusMessage(`Rate limited. Pausing for ${delay / 1000}s...`);
            } else if (resultApi.code === 404) {
                setStatusMessage(`User '${username}' not found. Continuing...`);
            } else {
                setStatusMessage(`API Error for '${username}'. Retrying after delay.`);
            }
        } else {
            try {
                const edges = resultApi.data?.user?.edge_owner_to_timeline_media?.edges || [];
                if (edges.length > 0) {
                    const latestPost = edges.reduce((latest: any, edge: any) =>
                        (edge.node.taken_at_timestamp > latest.node.taken_at_timestamp) ? edge : latest
                    );
                    const postDate = new Date(latestPost.node.taken_at_timestamp * 1000);
                    newResult.post_date = postDate.toISOString().split('T')[0];
                } else {
                    newResult.post_date = 'No posts found or private account.';
                }
            } catch {
                newResult.post_date = 'Error: Invalid response format';
                newResult.error = true;
                setStatusMessage(`Invalid data received for '${username}'. Continuing...`);
            }
        }

        // Use functional updates to ensure state updates correctly
        setResults(prev => [...prev, newResult]);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        if (resumeSession) {
            const updatedResults = [...stateRef.current.results, newResult];
            const sessionData: StoredSession = { usernames, results: updatedResults, currentIndex: nextIndex, minDelay, maxDelay, fileName };
            localStorage.setItem('instagramCheckerSession', JSON.stringify(sessionData));
        }

        setTimeout(processQueue, delay);
    }, []); // Empty dependency array makes processQueue a stable function


    // This effect starts the process when isChecking becomes true.
    useEffect(() => {
        if (isChecking) {
            processQueue();
        }
        // processQueue is stable and doesn't need to be in the dependency array
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isChecking]);


    useEffect(() => {
        let interval: ReturnType<typeof setTimeout>;
        if (isChecking && usernames.length > 0) {
            interval = setInterval(() => {
                const remaining = usernames.length - currentIndex;
                const avgDelay = ((minDelay + maxDelay) / 2.0) + 1.5; // Add 1.5s for mock API latency
                const estimatedSeconds = remaining * avgDelay;
                const h = Math.floor(estimatedSeconds / 3600);
                const m = Math.floor((estimatedSeconds % 3600) / 60);
                const s = Math.floor(estimatedSeconds % 60);
                setTimeRemaining(`ETA: ${h}h ${m}m ${s}s`);
            }, 1000);
        } else {
            setTimeRemaining('');
        }
        return () => clearInterval(interval);
    }, [isChecking, currentIndex, usernames.length, minDelay, maxDelay]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).map(line => line.split(',')[0].trim()).filter(Boolean);
            setUsernames(lines);
            setResults([]);
            setCurrentIndex(0);
            setStatusMessage(`Loaded ${lines.length} usernames. Ready to start.`);
        };
        reader.readAsText(file);
    };

    const handleStart = () => {
        if (minDelay > maxDelay) {
            setStatusMessage('Error: Min delay cannot be greater than Max delay.');
            return;
        }

        let canStartProcessing = false;

        if (resumeSession) {
            const savedSession = localStorage.getItem('instagramCheckerSession');
            if (savedSession) {
                try {
                    const data: StoredSession = JSON.parse(savedSession);
                    setUsernames(data.usernames);
                    setResults(data.results);
                    setCurrentIndex(data.currentIndex);
                    setFileName(data.fileName);
                    setMinDelay(data.minDelay);
                    setMaxDelay(data.maxDelay);
                    setStatusMessage(`Resuming session...`);
                    canStartProcessing = data.usernames.length > 0;
                } catch {
                    localStorage.removeItem('instagramCheckerSession');
                    setResults([]);
                    setCurrentIndex(0);
                }
            }
        } 
        
        if (!canStartProcessing) {
             if (usernames.length > 0) {
                setResults([]);
                setCurrentIndex(0);
                localStorage.removeItem('instagramCheckerSession');
                canStartProcessing = true;
             }
        }

        if (!canStartProcessing) {
            setStatusMessage('No usernames loaded. Please select a file.');
            return;
        }

        setIsChecking(true);
    };


    const handleStop = () => {
        setIsChecking(false);
        setStatusMessage('Process stopped by user.');
        setTimeRemaining('');
    };


    const handleExport = () => {
        if (results.length === 0) {
            setStatusMessage('No results to export.');
            return;
        }
        const header = ['username', 'post_date'];
        const csvRows = [header.join(','), ...results.map(r => `"${r.username}","${r.post_date}"`)];
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

    const progress = usernames.length > 0 ? (currentIndex / usernames.length) * 100 : 0;
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Header />
                <SettingsPanel 
                    fileName={fileName}
                    minDelay={minDelay}
                    maxDelay={maxDelay}
                    resumeSession={resumeSession}
                    isChecking={isChecking}
                    usernames={usernames}
                    onFileChange={handleFileChange}
                    setMinDelay={setMinDelay}
                    setMaxDelay={setMaxDelay}
                    setResumeSession={setResumeSession}
                    fileInputRef={fileInputRef}
                />
                <ControlButtons 
                    onStart={handleStart}
                    onStop={handleStop}
                    onExport={handleExport}
                    isChecking={isChecking}
                    canStart={usernames.length > 0 || !!localStorage.getItem('instagramCheckerSession')}
                    canExport={results.length > 0}
                />
                <ProgressBarDisplay 
                    progress={progress}
                    statusMessage={statusMessage}
                    timeRemaining={timeRemaining}
                    isChecking={isChecking}
                    total={usernames.length}
                    current={currentIndex}
                />
                <ResultsTable results={results} totalUsernames={usernames.length} />
            </div>
        </div>
    );
}
