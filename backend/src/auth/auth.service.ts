import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../common/decorators/current-user.decorator';

interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async findOrCreateUser(profile: GoogleProfile) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          score: { create: {} },
        },
      });
    }

    return user;
  }

  signToken(user: { id: string; email: string; name: string; image: string | null; role: string }): string {
    const payload: UserPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? undefined,
      role: user.role,
    };
    return this.jwt.sign(payload);
  }
}
