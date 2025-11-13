import { PrismaClient, user } from '@prisma/client';

import { User } from '@domain/models/user';
import {
  IUserRepository,
  UserCreateData,
} from '@application/use-cases/create-user';

export class PrismaUserRepository implements IUserRepository {

  // Prisma Client Injection
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async create(data: UserCreateData): Promise<User> {
    
    // Create the instance in the database
    const instance = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    // Map the result back to your Domain type
    return this.toDomain(instance);
  }

  // A helper to map Prisma's User to your Domain's User
  private toDomain(prismaUser: user): User {
    // This assumes your Domain 'User' class matches this shape
    const user = new User();

    user.id = prismaUser.id;
    user.email = prismaUser.email;
    user.name = prismaUser.name;
    user.password = prismaUser.password;
    user.createdAt = prismaUser.createdAt;
    
    return user;
  }
}