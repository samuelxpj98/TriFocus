import { GoogleGenAI, Type } from "@google/genai";
import { Task, JobType, Priority, Effort } from "../types";

// In Vite, process.env is polyfilled by our config, but we ensure fallback
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPrioritizationAdvice = async (tasks: Task[]): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured. Verifique o Cloudflare ou .env";
  
  const pendingTasks = tasks.filter(t => !t.completed);

  if (pendingTasks.length === 0) {
    return "Você não tem tarefas pendentes! Aproveite seu descanso.";
  }

  const prompt = `
    Atue como um assistente de produtividade pessoal especialista em gerenciamento de múltiplos contextos.
    
    O usuário tem 3 empregos:
    1. SomosUm (Universitários Batistas): Vídeos, posts, escrita.
    2. Vibe Teen (Ministério Adolescentes): Discipulado, cultos sábado, acampamentos.
    3. IPE (Professor Ensino Religioso): Preparar aulas, dar aulas.
    
    O usuário prioriza:
    1. Prazos iminentes (Deadline).
    2. Prioridade Alta.
    3. Facilidade de execução (Esforço "Fácil" primeiro para ganhar momentum).
    
    Aqui está a lista de tarefas atual (JSON):
    ${JSON.stringify(pendingTasks.map(t => ({
      title: t.title,
      job: t.job,
      deadline: t.deadline,
      priority: t.priority,
      effort: t.effort
    })))}

    Por favor, analise a lista e forneça:
    1. Um breve "Plano de Ataque" para hoje, sugerindo qual tarefa fazer primeiro e por quê.
    2. Uma dica rápida sobre como alternar entre esses contextos (ex: criativo vs pedagógico) com base nas tarefas listadas.
    
    Mantenha o tom encorajador, organizado e direto. Responda em Português do Brasil. Use Markdown simples.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um conselho agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Verifique sua conexão ou tente mais tarde.";
  }
};

export const breakdownTask = async (taskTitle: string, job: JobType): Promise<string[]> => {
    if (!process.env.API_KEY) return ["API Key missing"];

    const prompt = `
      Eu tenho uma tarefa complexa para meu trabalho no ${job}: "${taskTitle}".
      Quebre esta tarefa em 3 a 5 sub-tarefas menores e acionáveis para que eu possa começar facilmente.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING
                  }
                }
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return ["Não foi possível dividir a tarefa."];
    }
}