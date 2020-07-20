import { Injectable, Inject, HttpStatus } from '@nestjs/common';

@Injectable()
export class EcsService {
  constructor(@Inject('ECS') private ecs: any) {}

  runTask(params: any): Promise<string | Error> {
    return new Promise((resolve, reject) => {
      this.ecs.runTask(params, (err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          const [{ taskArn }] = data.tasks;
          const [, taskId] = taskArn.split(':task/');
          resolve(taskId);
        }
      });
    });
  }

  status(taskId: string, cluster: string): Promise<string | Error> {
    const params = {
      tasks: [taskId],
      cluster,
    };
    return new Promise((resolve, reject) => {
      this.ecs.describeTasks(
        params,
        (err: any, data: { failures: any[]; tasks: any[] }) => {
          if (err || data.tasks.length === 0) {
            reject(
              err || {
                statusCode: HttpStatus.GONE,
                message:
                  'The resource was generated with errors and is no longer available.',
              },
            );
          } else {
            const [task] = data.tasks;
            resolve(task.lastStatus);
          }
        },
      );
    });
  }
}
