/**
 * **Message** - Model Definition
 * 
 * Represents a message in a chat.
 * 
 * Properties:
 * - id: Unique identifier for the message.
 * - chatId: Identifier of the chat this message belongs to.
 * - sender: The sender of the message (e.g., 'user' or 'ai').
 * - content: The content of the message.
 * - createdAt: Timestamp of when the message was created.
 */

export type Message = {
  id: number;
  chatId: number;
  sender: string; // NOTE: Can be refined as an enum representing possible senders
  content: string;
  createdAt: Date;
}