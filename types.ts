
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  thinking?: string; 
  modelName?: string;
  
  attachment?: {
    type: 'image' | 'file';
    content: string; 
    name: string;
  };
  
  imageUrl?: string; 
  audioUrl?: string; 
  isGeneratingImage?: boolean; 
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  input: string;
}

export type AIProvider = 
  | 'openai' 
  | 'gemini' 
  | 'claude' 
  | 'deepseek' 
  | 'grok' 
  | 'groq' 
  | 'openrouter' 
  | 'huggingface' 
  | 'together' 
  | 'mistral';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  modelId?: string;
  createdAt: number;
  isSystemModel?: boolean; // Flag for managed/pre-configured models
  capabilities?: {
    imageGeneration?: boolean;
    audioGeneration?: boolean;
  };
}
