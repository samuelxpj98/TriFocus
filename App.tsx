import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Simplified UUID generation usually needs a lib, but I'll use a helper below to avoid deps issues in this prompt format
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
    const saved = localStorage.getItem('trifocus_tasks');
    return saved ? JSON.parse(saved) : [];
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

    // Filter out completed for the main list (could be a toggle, but keeping it simple)
    // We actually keep completed at the bottom usually, let's just sort them.
    
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Mobile-first Navigation (Sidebar on Desktop) */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:relative md:border-t-0 md:border-r md:w-64 md:flex-col md:justify-start md:h-screen flex justify-around p-2 md:p-6 shadow-lg md:shadow-none">
        
        <div className="hidden md:block mb-8">
           <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
             TriFocus.
           </h1>
           <p className="text-xs text-slate-400 mt-1">Organize. Prioritize. Execute.</p>
        </div>

        <nav className="flex md:flex-col gap-1 w-full md:space-y-2">
           <button 
             onClick={() => setViewMode('DASHBOARD')}
             className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${viewMode === 'DASHBOARD' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
           >
             <Icons.LayoutDashboard className="w-6 h-6 md:w-5 md:h-5" />
             <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">Geral</span>
           </button>

           <div className="hidden md:block border-t border-slate-100 my-2"></div>
           <p className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Contextos</p>

           <button 
             onClick={() => setViewMode(JobType.SOMOSUM)}
             className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${viewMode === JobType.SOMOSUM ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
           >
             <Icons.Users className="w-6 h-6 md:w-5 md:h-5" />
             <span className="text-[10px] md:text-sm mt-1 md:mt-0">SomosUm</span>
           </button>

           <button 
             onClick={() => setViewMode(JobType.VIBETEEN)}
             className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${viewMode === JobType.VIBETEEN ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
           >
             <Icons.Briefcase className="w-6 h-6 md:w-5 md:h-5" />
             <span className="text-[10px] md:text-sm mt-1 md:mt-0">Vibe Teen</span>
           </button>

           <button 
             onClick={() => setViewMode(JobType.IPE)}
             className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all ${viewMode === JobType.IPE ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-slate-500 hover:bg-sky-50 hover:text-sky-600'}`}
           >
             <Icons.BookOpen className="w-6 h-6 md:w-5 md:h-5" />
             <span className="text-[10px] md:text-sm mt-1 md:mt-0">IPE</span>
           </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {viewMode === 'DASHBOARD' ? 'Visão Geral Inteligente' : `Tarefas: ${viewMode}`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {viewMode === 'DASHBOARD' 
                ? `Você tem ${activeTasksCount} tarefas ativas organizadas por urgência e facilidade.` 
                : 'Foque neste contexto agora.'}
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-700 text-white p-3 md:px-5 md:py-2.5 rounded-full md:rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="hidden md:inline font-medium">Nova Tarefa</span>
          </button>
        </header>

        {/* AI Insight Section */}
        {viewMode === 'DASHBOARD' && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               {/* Background decoration */}
               <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                           <Icons.Brain className="w-5 h-5" />
                           TriFocus Coach
                        </h3>
                        <p className="text-indigo-100 text-sm mt-1 max-w-xl">
                           Precisa de ajuda para organizar a mente entre os 3 trabalhos? Eu analiso suas tarefas e crio um roteiro.
                        </p>
                    </div>
                    <button 
                       onClick={handleGetAdvice}
                       disabled={isLoadingAi}
                       className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/20 disabled:opacity-50"
                    >
                       {isLoadingAi ? 'Analisando...' : 'Gerar Plano do Dia'}
                    </button>
                 </div>
                 
                 {aiAdvice && (
                     <div className="mt-4 bg-black/20 backdrop-blur-sm rounded-xl p-4 text-sm leading-relaxed border border-white/10 animate-fade-in whitespace-pre-line">
                         {aiAdvice}
                     </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-4 max-w-3xl">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-20 opacity-50">
               <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
                  <Icons.CheckCircle className="w-8 h-8 text-slate-400" />
               </div>
               <p className="text-lg font-medium text-slate-600">Tudo limpo por aqui!</p>
               <p className="text-sm">Adicione tarefas para organizar sua rotina.</p>
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

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTask}
        defaultJob={viewMode !== 'DASHBOARD' ? viewMode : undefined}
      />
    </div>
  );
};

export default App;
