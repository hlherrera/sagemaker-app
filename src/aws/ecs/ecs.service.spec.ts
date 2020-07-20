import { Test, TestingModule } from '@nestjs/testing';
import { EcsService } from './ecs.service';
import { HttpStatus } from '@nestjs/common';

describe('EcsService', () => {
  let service: EcsService;
  const mockStatusFn = jest.fn();
  beforeEach(async () => {
    const ECSProvider = {
      runTask: (params: any, cb: (err: any, ok: any) => void) => {
        const index = params.overrides.containerOverrides[0].command.indexOf(
          'null',
        );
        index === -1
          ? cb(null, {
              tasks: [
                {
                  taskArn: 'arn:aws:ecs:region:account:task/25254a7f-1f54',
                },
              ],
            })
          : cb(new Error('Not defined'), null);
      },
      describeTasks: (
        params: { tasks: string[]; cluster: string },
        cb: (err: any, ok: any) => void,
      ) => {
        if (params.tasks && params.cluster) {
          mockStatusFn();
          cb(null, { tasks: [{ taskid: 'the-id' }] });
        } else {
          cb({ statusCode: HttpStatus.NOT_FOUND }, null);
        }
      },
    };
    const ElasticTaskProvider = {
      provide: 'ECS',
      useValue: ECSProvider,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [EcsService, ElasticTaskProvider],
    }).compile();

    service = module.get<EcsService>(EcsService);
    mockStatusFn.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should run task', async () => {
    const inputBucket = 'myBucket';
    const dataDirectory = '/path/to/data';
    const path = '/path/to/store/generated/model';
    const outputBucket = 'bucket-for-store-models';

    const CMD = `task --ibucket ${inputBucket} --ifile ${dataDirectory} --obucket ${outputBucket} --ofile ${path}`;
    const params = {
      cluster: 'cluster',
      launchType: 'FARGATE',
      taskDefinition: 'task_definition',
      count: 1,
      platformVersion: 'LATEST',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [...['subnet1', 'subnet2'].map((sn) => sn.trim())],
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: `neuron-container`,
            command: [...CMD.split(' ')],
            environment: [
              {
                name: 'APP_ID',
                value: 1,
              },
            ],
          },
        ],
      },
    };
    const running = await service.runTask(params);
    expect(running).toBe('25254a7f-1f54');
  });

  it('should check Status of the Job', async () => {
    await service.status('the-task-id', 'the-cluster');
    expect(mockStatusFn).toHaveBeenCalled();
  });

  it('should reject status of the Job', async () => {
    const error = await service.status('the-task-id', '').catch((err) => err);
    expect(error).toHaveProperty('statusCode');
    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(mockStatusFn).not.toHaveBeenCalled();
  });
});
