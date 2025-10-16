import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-xl bg-background/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground"> Tilak AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Your intelligent search companion</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-6 animate-pulse">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask me anything! I can search for information, answer questions, and help with various tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}
              {isLoading && (
                <div className="flex gap-3 p-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                    <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-border backdrop-blur-xl bg-background/50 sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default Index;