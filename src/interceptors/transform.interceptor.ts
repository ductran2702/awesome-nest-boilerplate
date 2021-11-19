import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IResponse<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IResponse<T>>
{
  intercept(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
