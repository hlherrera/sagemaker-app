import { Test, TestingModule } from '@nestjs/testing';
import { ChameleonProjectService } from './chameleonProject.service';
import { ChameleonProject } from './domain/chameleonProject';

describe('App Client Service', () => {
  let service: ChameleonProjectService;
  let DynamoService: any;
  const mockPutFn = jest.fn();
  const mockGetFn = jest.fn();

  const dbApps: ChameleonProject[] = [
    new ChameleonProject().build({
      name: 'app-1',
      id: 'app1',
      description: 'The app',
    }),
  ];

  beforeEach(async () => {
    DynamoService = {
      provide: 'DynamoService',
      useValue: {
        get: ({ Key: { id } }) => {
          mockGetFn();
          const Item = dbApps.find((app) => app.id === id);
          return Promise.resolve(Item);
        },
        register: (_: any) => {
          mockPutFn();
          return new Promise((resolve) => {
            resolve({ id: '', name: '', description: '', ..._ });
          });
        },
        update: (_: any) => {
          mockPutFn();
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChameleonProjectService, DynamoService],
    }).compile();

    service = module.get<ChameleonProjectService>(ChameleonProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register app', async (done) => {
    const app: ChameleonProject = new ChameleonProject().build({
      id: '1',
      name: 'model-1',
      description: '',
    });
    await service.register(app);
    expect(mockPutFn).toBeCalled();
    done();
  });

  it('should find app', async (done) => {
    const app = await service.findOne('app1');
    expect(mockGetFn).toBeCalled();
    expect(app['id']).toBe('app1');
    done();
  });
});
