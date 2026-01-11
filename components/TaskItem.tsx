import React, { useState } from 'react';
import { Task, JobType, Priority, Effort } from '../types';
import { Icons, JOB_COLORS } from '../constants';
import { breakdownTask } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  
  const colors = JOB_COLORS[task.job];

  const handleBreakdown = async () => {
    if (subtasks.length > 0) {
        setSubtasks([]);
        return;
    }
    setIsBreakingDown(true);
    const steps = await breakdownTask(task.title, task.job);
    setSubtasks(steps);
    setIsBreakingDown(false);
  };

  const priorityColor = 
    task.priority === Priority.HIGH ? 'text-red-600 bg-red-50 border-red-200' :
    task.priority === Priority.MEDIUM ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
    'text-green-600 bg-green-50 border-green-200';

  const effortBadge = 
    task.effort === Effort.EASY ? '⚡ Fácil' :
    task.effort === Effort.MEDIUM ? '⚖️ Médio' :
    '🏋️ Difícil';

  return (
    <div className={`group relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${task.completed ? 'opacity-60 bg-slate-50' : ''}`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 transition-colors ${task.completed ? 'text-slate-400' : 'text-slate-300 hover:text-slate-500'}`}
        >
          {task.completed ? <Icons.CheckCircle className="w-6 h-6 text-green-500" /> : <Icons.Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {task.job}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColor}`}>
                    {task.priority}
                </span>
            </div>
          
          <h3 className={`font-medium text-slate-800 break-words ${task.completed ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
             <div className="flex items-center gap-1">
                <Icons.Calendar className="w-3 h-3" />
                <span className={new Date(task.deadline) < new Date() && !task.completed ? "text-red-500 font-semibold" : ""}>
                    {new Date(task.deadline).toLocaleDateString('pt-BR')}
                </span>
             </div>
             <div className="flex items-center gap-1">
                <span>{effortBadge}</span>
             </div>
          </div>

           {/* Subtasks / AI Breakdown Area */}
           {subtasks.length > 0 && (
               <div className="mt-3 pl-3 border-l-2 border-slate-100">
                   <p className="text-xs font-semibold text-slate-400 mb-1">Sugestão de Passos:</p>
                   <ul className="space-y-1">
                       {subtasks.map((step, idx) => (
                           <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                               <span>•</span> {step}
                           </li>
                       ))}
                   </ul>
               </div>
           )}
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={handleBreakdown}
                disabled={isBreakingDown || task.completed}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors"
                title="Dividir tarefa com IA"
            >
                <Icons.Brain className={`w-4 h-4 ${isBreakingDown ? 'animate-pulse' : ''}`} />
            </button>
            <button 
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Excluir"
            >
                <Icons.Trash className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
