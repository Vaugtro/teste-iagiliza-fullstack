/* USE CASE: Create User */

import { User } from '@domain/models/user';

export type UserCreateData = {
  name: string;
  email: string;
  password: string; // Hashed password
};

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: UserCreateData): Promise<User>;
}

export interface IPasswordHasher {
    hash(plain: string): Promise<string>;
}

/* Domain-specific errors */
export class ValidationError extends Error {}
export class EmailAlreadyInUseError extends Error {}

/* Simple email validator */
function isValidEmail(email: string): boolean {
    // basic RFC5322-ish regex (sufficient for most apps)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * **CreateUserUseCase**
 * 
 * Use case for creating a new user in the system.
 * 
 * Dependencies:
 * - **IUserRepository**: Interface for user data persistence.
 * - **IPasswordHasher**: Interface for hashing passwords.
 * - **IIDGenerator**: Interface for generating unique IDs.
 * 
 * Input:
 * - **name**: User's full name.
 * - **email**: User's email address.
 * - **password**: User's plain text password.
 * 
 * Output:
 * - **id**: Unique identifier of the created user.
 * - **name**: User's full name.
 * - **email**: User's email address.
 * - **createdAt**: Timestamp of when the user was created.
 * 
 * Errors:
 * - *ValidationError*: Thrown when input validation fails.
 * - *EmailAlreadyInUseError*: Thrown when the provided email is already registered.
 */
export class CreateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly hasher: IPasswordHasher,
    ) {}

    async execute(input: UserCreateData): Promise<UserCreateData> {
        this.validateInput(input);

        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw new EmailAlreadyInUseError('Email is already in use');
        }

        const hashed = await this.hasher.hash(input.password);

        const user: User = {
            name: input.name.trim(),
            email: input.email.toLowerCase().trim(),
            password: hashed,
        };

        const created = await this.userRepository.create(user);

        // Return a DTO without exposing password
        const output: CreateUserOutput = {
            id: created.id,
            name: created.name,
            email: created.email,
            createdAt: created.createdAt,
        };

        return output;
    }

    private validateInput(input: CreateUserInput) {
        if (!input || typeof input !== 'object') {
            throw new ValidationError('Invalid input');
        }

        const name = (input.name || '').trim();
        const email = (input.email || '').trim();
        const password = input.password || '';

        if (!name) {
            throw new ValidationError('Name is required');
        }
        if (!email) {
            throw new ValidationError('Email is required');
        }
        if (!isValidEmail(email)) {
            throw new ValidationError('Email is invalid');
        }
        if (!password || password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters');
        }
    }
}