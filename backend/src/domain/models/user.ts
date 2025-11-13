/**
 * **User** - Model Definition
 * 
 * Represents a user in the application.
 * 
 * Properties:
 * - id: Unique identifier for the user.
 * - email: User's email address.
 * - name: User's full name (optional).
 * - password: Hashed password for authentication. SHA-256.
 * - createdAt: Timestamp of when the user was created.
 */

export type User = {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}