import React, { useState } from 'react';
import { JobType, Priority, Effort } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
  defaultJob?: JobType;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, defaultJob }) => {
  const [title, setTitle] = useState('');
  const [job, setJob] = useState<JobType>(defaultJob || JobType.SOMOSUM);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [effort, setEffort] = useState<Effort>(Effort.MEDIUM);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    onAdd({
      title,
      job,
      deadline,
      priority,
      effort,
    });
    
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-slate-800">Nova Tarefa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">O que precisa ser feito?</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Gravar vídeo sobre gratidão"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Contexto</label>
               <select 
                 value={job} 
                 onChange={(e) => setJob(e.target.value as JobType)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {Object.values(JobType).map(j => (
                   <option key={j} value={j}>{j}</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
               <input 
                 type="date" 
                 value={deadline} 
                 onChange={(e) => setDeadline(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
               <select 
                 value={priority} 
                 onChange={(e) => setPriority(e.target.value as Priority)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {Object.values(Priority).map(p => (
                   <option key={p} value={p}>{p}</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Esforço (Facilidade)</label>
               <select 
                 value={effort} 
                 onChange={(e) => setEffort(e.target.value as Effort)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                 {Object.values(Effort).map(e => (
                   <option key={e} value={e}>{e}</option>
                 ))}
               </select>
               <p className="text-xs text-slate-400 mt-1">Sempre priorize o que é mais fácil!</p>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors mt-4"
          >
            Adicionar Tarefa
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
