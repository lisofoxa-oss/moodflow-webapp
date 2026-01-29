import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type WsMessage, type MoodStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useWebSocket() {
  const [viewersCount, setViewersCount] = useState(0);
  const [lastMood, setLastMood] = useState<{ emoji: string; id: number } | null>(null);
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsMessage;

          switch (data.type) {
            case "viewers_count":
              setViewersCount(data.count);
              break;
              
            case "new_mood":
              // Trigger emoji rain or toast
              setLastMood({ emoji: data.mood.emoji, id: Date.now() });
              break;
              
            case "stats_update":
              // Update the React Query cache optimistically
              queryClient.setQueryData([api.stats.get.path], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  today: data.stats
                };
              });
              break;
              
            case "welcome":
              // Optional welcome message handling
              break;
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting...");
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, [queryClient, toast]);

  return { viewersCount, lastMood };
}
