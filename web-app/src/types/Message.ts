export interface Message {
  id: number;
  date: string;
  timestamp: number;
  text: string;
  fromId: number | null;
  views: number;
}

export interface ParsedData {
  exportDate: string;
  totalMessages: number;
  messages: Message[];
}