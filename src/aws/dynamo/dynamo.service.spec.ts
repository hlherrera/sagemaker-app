import { Test, TestingModule } from '@nestjs/testing';
import { DynamoService } from './dynamo.service';

describe('DynamoService', () => {
  let service: DynamoService;

  const mockPutFn = jest.fn();
  const mockGetFn = jest.fn();

  const DynamoProvider = {
    provide: 'DynamoDB',
    useValue: {
      get: ({ Key: { id } }, cb: (error: Error | null, data: any) => void) => {
        mockGetFn();
        if (id) {
          cb(null, { Item: id });
        } else {
          cb(null, {});
        }
      },
      put: (_: any, cb: (error: Error | null, data: any) => void) => {
        mockPutFn();
        cb(null, true);
      },
      update: (_: any, cb: (error: Error | null, data: any) => void) => {
        mockPutFn();
        cb(null, true);
      },
    },
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamoService, DynamoProvider],
    }).compile();

    service = module.get<DynamoService>(DynamoService);
    mockGetFn.mockClear();
    mockPutFn.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get data by id', async () => {
    const params = {
      TableName: 'the-dynamo-table',
      Key: { id: 'the-item-id' },
    };
    await service.get(params);

    expect(mockGetFn).toHaveBeenCalled();
  });

  it('should not get data cause no id', async () => {
    const params = {
      TableName: 'the-dynamo-table',
      Key: { id: null },
    };
    const error = await service.get(params).catch((err) => err);

    expect(mockGetFn).toHaveBeenCalled();
    expect(error).toBeDefined();
  });

  it('should register data', async () => {
    const params = {
      TableName: 'the-dynamo-table',
      Item: { id: 'id-of-item' },
    };
    await service.register(params);

    expect(mockPutFn).toHaveBeenCalled();
  });

  it('should update data', async () => {
    const params = {
      TableName: 'the-dynamo-table',
      Key: {
        id: 'the-id-of-item',
      },
      UpdateExpression: 'set name = :name',
      ExpressionAttributeValues: {
        ':name': 'the-item-name',
      },
    };
    await service.update(params);

    expect(mockPutFn).toHaveBeenCalled();
  });
});
