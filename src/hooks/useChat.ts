import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(
    async (input: string) => {
      const userMsg: Message = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantContent = "";

      const updateAssistantMessage = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      try {
        const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
        
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast({
              title: "Rate Limit Exceeded",
              description: "Please try again in a few moments.",
              variant: "destructive",
            });
            setMessages((prev) => prev.slice(0, -1));
            return;
          }
          if (response.status === 402) {
            toast({
              title: "Payment Required",
              description: "Please add funds to continue using AI features.",
              variant: "destructive",
            });
            setMessages((prev) => prev.slice(0, -1));
            return;
          }
          throw new Error("Failed to start stream");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                updateAssistantMessage(content);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) updateAssistantMessage(content);
            } catch {
              /* ignore partial leftovers */
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send message",
          variant: "destructive",
        });
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, toast]
  );

  return { messages, sendMessage, isLoading };
};