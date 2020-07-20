import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import * as Cryptr from 'cryptr';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ChameleonProjectService } from '../client/chameleonProject.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly service: ChameleonProjectService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const crypt = new Cryptr(process.env.JWT_SECRET);
    const appId = crypt.decrypt(payload.sub);
    const app = await this.service.findOne(appId).catch((err) => err);
    if (!app.id && app.message) {
      throw new UnauthorizedException();
    }
    return { appId, app };
  }
}
