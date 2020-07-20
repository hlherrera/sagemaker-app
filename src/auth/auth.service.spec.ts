import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import * as Cryptr from 'cryptr';

describe('AuthService', () => {
  let service: AuthService;
  let mockGetFn: (p: string) => void;
  const crypt = new Cryptr(process.env.JWT_SECRET || '12345678');
  const JwtServiceProvider = {
    provide: 'JwtService',
    useValue: {
      sign: ({ sub }) => {
        mockGetFn(crypt.decrypt(sub));
      },
    },
  };

  beforeEach(async () => {
    mockGetFn = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, JwtServiceProvider],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign the app', () => {
    service.sign('app1');
    expect(mockGetFn).toBeCalledWith('app1');
  });
});
