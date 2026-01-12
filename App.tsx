import React, { useState, useEffect, useMemo } from 'react';
import { Task, JobType, Priority, Effort, ViewMode } from './types';
import { Icons, JOB_COLORS, PRIORITY_MAP, EFFORT_MAP } from './constants';
import TaskItem from './components/TaskItem';
import AddTaskModal from './components/AddTaskModal';
import { getPrioritizationAdvice } from './services/geminiService';

// Helper for ID generation since we can't easily install 'uuid' in this specific output format without a package manager
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('trifocus_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar tarefas:", e);
      return [];
    }
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('trifocus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- Handlers ---
  const addTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: generateId(),
      completed: false,
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleGetAdvice = async () => {
    setIsLoadingAi(true);
    const advice = await getPrioritizationAdvice(tasks);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  // --- Sorting Logic (The Secret Sauce) ---
  const sortedTasks = useMemo(() => {
    // Filter by view mode first
    let filtered = viewMode === 'DASHBOARD' 
      ? tasks 
      : tasks.filter(t => t.job === viewMode);

    return filtered.sort((a, b) => {
      // 1. Completion status (Active first)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      // 2. Deadline (Urgent first)
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // 3. Priority (High first)
      const priorityDiff = PRIORITY_MAP[b.priority] - PRIORITY_MAP[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 4. Effort (Easy first - as requested by user)
      const effortDiff = EFFORT_MAP[a.effort] - EFFORT_MAP[b.effort];
      return effortDiff;
    });
  }, [tasks, viewMode]);

  const activeTasksCount = tasks.filter(t => !t.completed).length;

  // --- Render ---
  return (
    <div className="flex justify-center min-h-screen bg-slate-200">
      
      {/* Mobile Container Frame */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Header */}
        <header className="px-5 py-6 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm flex justify-between items-center">
            <div>
                <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                    TriFocus.
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                    {viewMode === 'DASHBOARD' ? 'Visão Geral' : viewMode}
                </p>
            </div>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
              >
                <Icons.Plus className="w-5 h-5" />
              </button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-28">
           {/* AI Banner */}
           {viewMode === 'DASHBOARD' && (
            <div className="mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                            <Icons.Brain className="w-4 h-4" />
                            Coach IA
                            </h3>
                            <button 
                                onClick={handleGetAdvice}
                                disabled={isLoadingAi}
                                className="bg-white/20 active:bg-white/30 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors backdrop-blur-md"
                            >
                                {isLoadingAi ? '...' : 'Gerar Plano'}
                            </button>
                        </div>
                        {aiAdvice ? (
                            <div className="bg-black/20 rounded-xl p-3 text-xs leading-relaxed border border-white/10 animate-fade-in whitespace-pre-line max-h-40 overflow-y-auto">
                                {aiAdvice}
                            </div>
                        ) : (
                             <p className="text-indigo-100 text-xs">
                                Toque para organizar sua rotina de hoje.
                            </p>
                        )}
                    </div>
                </div>
            </div>
           )}

           {/* Stats / Info */}
           <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {viewMode === 'DASHBOARD' ? 'Sua Lista' : 'Contexto'}
                </span>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {activeTasksCount} Pendentes
                </span>
           </div>

           {/* Task List */}
            <div className="space-y-3">
            {sortedTasks.length === 0 ? (
                <div className="text-center py-16 opacity-50 flex flex-col items-center">
                    <div className="p-4 rounded-full bg-slate-100 mb-3">
                        <Icons.CheckCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-600">Lista Vazia</p>
                    <p className="text-xs text-slate-400 mt-1">Hora de descansar ou planejar.</p>
                </div>
            ) : (
                sortedTasks.map(task => (
                <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                />
                ))
            )}
            </div>
        </main>

        {/* Fixed Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 pb-6 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <button 
                onClick={() => setViewMode('DASHBOARD')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-16 transition-all ${viewMode === 'DASHBOARD' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <div className={`p-1 rounded-full ${viewMode === 'DASHBOARD' ? 'bg-slate-100' : ''}`}>
                   <Icons.LayoutDashboard className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">Geral</span>
            </button>

            <button 
                onClick={() => setViewMode(JobType.SOMOSUM)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-16 transition-all ${viewMode === JobType.SOMOSUM ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
            >
                <div className={`p-1 rounded-full ${viewMode === JobType.SOMOSUM ? 'bg-indigo-50' : ''}`}>
                    <Icons.Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">SomosUm</span>
            </button>

            <button 
                onClick={() => setViewMode(JobType.VIBETEEN)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-16 transition-all ${viewMode === JobType.VIBETEEN ? 'text-orange-600' : 'text-slate-400 hover:text-orange-600'}`}
            >
                <div className={`p-1 rounded-full ${viewMode === JobType.VIBETEEN ? 'bg-orange-50' : ''}`}>
                    <Icons.Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">Vibe</span>
            </button>

            <button 
                onClick={() => setViewMode(JobType.IPE)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl w-16 transition-all ${viewMode === JobType.IPE ? 'text-sky-600' : 'text-slate-400 hover:text-sky-600'}`}
            >
                 <div className={`p-1 rounded-full ${viewMode === JobType.IPE ? 'bg-sky-50' : ''}`}>
                    <Icons.BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">IPE</span>
            </button>
        </nav>

        <AddTaskModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onAdd={addTask}
            defaultJob={viewMode !== 'DASHBOARD' ? viewMode : undefined}
        />
      </div>
    </div>
  );
};

export default App;