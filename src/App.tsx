import { useEffect, useState } from 'react'
import { ActivityLogs, AppCategories } from './types'
import './App.css'

/**
 * Formats seconds into a human-readable string: "1h 5m"
 */
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;

  return result.trim();
}

/**
 * Converts ISO date "YYYY-MM-DD" to "DD/MM/YYYY"
 */
const formatDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function App() {
  const [logs, setLogs] = useState<ActivityLogs>({});
  const [categories, setCategories] = useState<AppCategories>({});

  // 1. Determine "Today" in the data's format (ISO)
  const todayISO = new Date().toISOString().split('T')[0];
  
  // 2. Extract logs for today
  const todayLogs = logs[todayISO] || {};

  // 3. Calculate total tracked time for today
  const totalSeconds = Object.values(todayLogs).reduce((acc, curr) => acc + curr, 0);

  // 4. Calculate category totals
  const productiveSeconds = Object.entries(todayLogs)
    .filter(([appName]) => categories[appName] === 'productive')
    .reduce((acc, [, seconds]) => acc + seconds, 0);

  const distractionSeconds = Object.entries(todayLogs)
    .filter(([appName]) => categories[appName] === 'distraction')
    .reduce((acc, [, seconds]) => acc + seconds, 0);

  // 5. Fetch logs and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logData, catData] = await Promise.all([
          window.ipcRenderer.getLogs(),
          window.ipcRenderer.getCategories()
        ]);
        setLogs(logData);
        setCategories(catData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  // 6. Handle category updates
  const handleSetCategory = async (appName: string, category: 'productive' | 'distraction' | 'neutral') => {
    try {
      await window.ipcRenderer.setCategory(appName, category);
      setCategories(prev => ({ ...prev, [appName]: category }));
    } catch (error) {
      console.error('Failed to set category:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ashker</h1>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1a1d23] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-blue-500/20">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Total Tracked</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatTime(totalSeconds)}</div>
          </div>
          
          <div className="bg-[#1a1d23] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-green-500/20">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Productive</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{formatTime(productiveSeconds)}</div>
          </div>

          <div className="bg-[#1a1d23] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-red-500/20">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Distraction</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{formatTime(distractionSeconds)}</div>
          </div>
        </div>

        {/* Activity List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Today's Activity</h2>
            <span className="text-sm font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {formatDate(todayISO)}
            </span>
          </div>

          <div className="space-y-4">
            {Object.keys(todayLogs).length === 0 ? (
              <div className="text-center py-20 bg-[#1a1d23] rounded-2xl border border-dashed border-white/10">
                <p className="text-slate-400">No activity recorded yet today.</p>
              </div>
            ) : (
              Object.entries(todayLogs)
                .sort(([, a], [, b]) => b - a)
                .map(([appName, seconds]) => {
                  const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
                  const category = categories[appName] || 'neutral';
                  
                  return (
                    <div key={appName} className="bg-[#1a1d23] p-6 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">{appName}</h3>
                          <div className="text-2xl font-bold text-blue-500">{formatTime(seconds)}</div>
                          <span className="text-xs text-slate-500 uppercase font-semibold tracking-tighter">
                            {percentage.toFixed(0)}% of total time
                          </span>
                        </div>
                        
                        {/* Category Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          category === 'productive' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          category === 'distraction' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-white/5 text-slate-400 border-white/5'
                        }`}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            category === 'productive' ? 'bg-green-500' :
                            category === 'distraction' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-6">
                        {category !== 'productive' && (
                          <button 
                            onClick={() => handleSetCategory(appName, 'productive')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Productive
                          </button>
                        )}
                        {category !== 'distraction' && (
                          <button 
                            onClick={() => handleSetCategory(appName, 'distraction')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Mark Distraction
                          </button>
                        )}
                        {category !== 'neutral' && (
                          <button 
                            onClick={() => handleSetCategory(appName, 'neutral')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 transition-colors"
                          >
                            Mark Neutral
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-xs text-slate-600 font-medium tracking-widest uppercase">
            Ashker v1.0 • Real-time tracking active
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
