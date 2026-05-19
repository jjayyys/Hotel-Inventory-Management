import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    // Log incoming request
    const logContext = {
      method,
      url,

      user: (request as unknown as Record<string, unknown>).user,
      ip: request.ip,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      userId: (request as any).user?.id,
    };

    this.logger.debug(`→ ${method} ${url}`, logContext);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.debug(`← ${method} ${url} ${statusCode} (+${duration}ms)`, {
          ...logContext,
          statusCode,
          duration,
        });
      }),
    );
  }
}
