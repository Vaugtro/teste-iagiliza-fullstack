/**
 * **Chat** - Model Definition
 * 
 * Represents a chat in the application.
 * 
 * Properties:
 * - id: Unique identifier for the chat.
 * - userId: Identifier of the user participating in the chat.
 * - createdAt: Timestamp of when the chat was created.
 */

export type Chat = {
  id: number;
  userId: number;
  createdAt: Date;
}