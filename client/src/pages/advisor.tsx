import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  MessageCircle, 
  Plus, 
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2
} from "lucide-react";
import type { AdvisorChat, AdvisorMessage } from "@shared/schema";

type ChatWithMessages = AdvisorChat & { messages: AdvisorMessage[] };

export default function Advisor() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: chats, isLoading: loadingChats } = useQuery<AdvisorChat[]>({
    queryKey: ["/api/advisor/chats"],
  });

  const { data: currentChat, isLoading: loadingChat } = useQuery<ChatWithMessages>({
    queryKey: ["/api/advisor/chats", selectedChatId],
    enabled: !!selectedChatId,
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/advisor/chats", { title: "New Chat" });
    },
    onSuccess: async (response) => {
      const newChat = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/advisor/chats"] });
      setSelectedChatId(newChat.id);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create chat.", variant: "destructive" });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/advisor/chats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisor/chats"] });
      if (selectedChatId === deleteChatMutation.variables) {
        setSelectedChatId(null);
      }
      toast({ title: "Chat deleted" });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, streamingMessage]);

  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedChatId || isStreaming) return;

    const message = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/advisor/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/advisor/chats", selectedChatId] });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to get response.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What courses should I take next semester?",
    "Am I on track to graduate on time?",
    "Which electives would you recommend for my major?",
    "Can you generate an advising request for my advisor?",
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <Card className="w-64 shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Conversations</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => createChatMutation.mutate()}
              disabled={createChatMutation.isPending}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 overflow-auto">
          {loadingChats ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : chats && chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedChatId === chat.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                  data-testid={`chat-item-${chat.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{chat.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatMutation.mutate(chat.id);
                    }}
                    data-testid={`button-delete-chat-${chat.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p>No conversations yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createChatMutation.mutate()}
                className="mt-1"
              >
                Start a chat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Academic Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {!selectedChatId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md p-6">
                <Bot className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Advisor</h3>
                <p className="text-muted-foreground mb-6">
                  Get personalized academic advice based on your degree progress, 
                  course history, and goals.
                </p>
                <Button onClick={() => createChatMutation.mutate()} data-testid="button-start-conversation">
                  Start a Conversation
                </Button>
              </div>
            </div>
          ) : loadingChat ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentChat?.messages?.length === 0 && !isStreaming && (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Try asking:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestedQuestions.map((q, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setInput(q);
                              }}
                              data-testid={`suggested-question-${i}`}
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChat?.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isStreaming && streamingMessage && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                      </div>
                    </div>
                  )}

                  {isStreaming && !streamingMessage && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about your courses, requirements, or get advising help..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[44px] max-h-32 resize-none"
                    disabled={isStreaming}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isStreaming}
                    size="icon"
                    className="shrink-0"
                    data-testid="button-send-message"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This is a planning tool only. Consult your official advisor for academic decisions.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
