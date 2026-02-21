
import { Message, AIModel } from '../types';

const OPENROUTER_API_KEY = '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';
const DEFAULT_MODEL_ID = 'stepfun/step-3.5-flash:free';

/**
 * Helper for OpenAI-compatible providers (Groq, OpenRouter, OpenAI, etc.)
 */
async function fetchOpenAICompatible(messages: any[], onChunk: (content: string) => void, signal?: AbortSignal) {
  const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  const formattedMessages = messages.map(m => {
      if (m.role === 'system') return { role: 'system', content: m.content };
      if (Array.isArray(m.content)) {
          return {
              role: m.role,
              content: m.content.map((c: any) => {
                  if (c.type === 'image_url') {
                      return { type: 'image_url', image_url: { url: c.image_url.url } };
                  }
                  return { type: 'text', text: c.text };
              })
          };
      }
      return { role: m.role, content: m.content };
  });
  
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Chat'
    },
    body: JSON.stringify({ 
        model: DEFAULT_MODEL_ID, 
        messages: formattedMessages, 
        stream: true, 
        temperature: 0.7,
        max_tokens: 4096
    }),
    signal
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('data: ')) {
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') return;
        try { 
          const chunk = JSON.parse(jsonStr);
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) onChunk(delta); 
          
          if (chunk.usage?.reasoning_tokens) {
            console.log("Reasoning tokens:", chunk.usage.reasoning_tokens);
          }
        } catch (e) {}
      }
    }
  }
}

/**
 * Main function to stream chat completion
 */
export const streamChatCompletion = async (
  messages: Message[], 
  userName: string | null, 
  isThinkingMode: boolean, 
  currentModel: AIModel | null, 
  onStatus: (s: string) => void, 
  onChunk: (c: string) => void, 
  onFinish: () => void, 
  signal?: AbortSignal
) => {
  try {
    onStatus('processing');
    
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const finalSystemPrompt = `You are a helpful AI assistant. Answer the user's questions clearly and concisely. 
    Current Date: ${dateString}
    Current Time: ${timeString}`;
    
    let finalMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...messages.map(m => {
            if (m.attachment && m.attachment.type === 'image') {
                return {
                    role: m.role,
                    content: [
                        { type: 'text', text: m.content || "Analyze this image." },
                        { type: 'image_url', image_url: { url: m.attachment.content } }
                    ]
                };
            }
            return { role: m.role, content: m.content };
        })
    ];
    
    await fetchOpenAICompatible(finalMessages, onChunk, signal);
    onFinish();
  } catch (error: any) {
    if (error.name !== 'AbortError') onChunk(`\n[System Error]: ${error.message}`);
    onFinish();
  }
};

/**
 * Generates a short title for a chat using the AI model
 */
export const generateChatTitle = async (history: Message[]): Promise<string> => {
    const lastUserMsg = history.filter(m => m.role === 'user').pop();
    if (!lastUserMsg) return "New Chat";

    const prompt = `Generate a very short title (2-5 words) for this conversation. Output ONLY the title text.\n\nConversation:\n${lastUserMsg.content}`;

    try {
        const baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chat'
            },
            body: JSON.stringify({ 
                model: DEFAULT_MODEL_ID,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 15,
                temperature: 0.6
            })
        });

        if (response.ok) {
            const data = await response.json();
            const title = data.choices?.[0]?.message?.content?.trim();
            if (title) {
                return title.replace(/^["']|["']$/g, '');
            }
        }
    } catch (e) {
        console.warn("Title generation failed");
    }

    return lastUserMsg.content.substring(0, 30) + (lastUserMsg.content.length > 30 ? "..." : "");
};

