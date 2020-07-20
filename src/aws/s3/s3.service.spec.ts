import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;
  const mockHeadFn = jest.fn().mockResolvedValue(true);
  const mockDownloadFn = jest.fn().mockReturnValue(true);
  class S3 {
    STATUS = 'end';
    getObject() {
      return this;
    }
    pipe() {
      return this;
    }
    createReadStream() {
      return this;
    }
    on(arg: string, fn: () => void) {
      if (arg === this.STATUS) {
        mockDownloadFn(arg);
        fn();
      }
      return this;
    }
    listObjectsV2() {
      return { promise: mockHeadFn };
    }
  }

  beforeEach(async () => {
    const S3Provider = {
      provide: 'S3',
      useValue: S3,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service, S3Provider],
    }).compile();
    service = module.get<S3Service>(S3Service);
    mockDownloadFn.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should download file', async () => {
    const id = 'id1';
    const bucket = 'the-bucket';
    const path = '/the/path/in/bucket';
    await service.download(id, bucket, path);
    expect(mockDownloadFn).toHaveBeenCalledTimes(1);
  });

  it('should check path exist', async () => {
    const id = 'id2';
    const bucket = 'the-bucket';
    const path = '/the/path/in/bucket';
    await service.existPath(id, bucket, path);
    expect(mockHeadFn).toHaveBeenCalled();
  });
});
