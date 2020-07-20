import * as Cryptr from 'cryptr';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  sign(appId: string) {
    const crypt = new Cryptr(process.env.JWT_SECRET);
    const payload = { sub: crypt.encrypt(appId) };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
