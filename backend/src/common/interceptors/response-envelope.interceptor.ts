import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  RESPONSE_MESSAGE_KEY,
  SKIP_RESPONSE_ENVELOPE_KEY,
} from '../constants/metadata.constants';

type EnvelopePayload = {
  success?: boolean;
  data?: unknown;
  meta?: Record<string, unknown>;
  message?: string;
};

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_ENVELOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const responseMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (shouldSkip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload: EnvelopePayload | unknown) => {
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'success' in payload &&
          (payload as EnvelopePayload).success === true
        ) {
          return payload;
        }

        if (
          typeof payload === 'object' &&
          payload !== null &&
          'data' in payload &&
          'meta' in payload
        ) {
          const typedPayload = payload as EnvelopePayload;
          return {
            success: true,
            data: typedPayload.data,
            meta: typedPayload.meta,
          };
        }

        if (
          typeof payload === 'object' &&
          payload !== null &&
          'data' in payload &&
          !('meta' in payload)
        ) {
          const typedPayload = payload as EnvelopePayload;
          return {
            success: true,
            data: typedPayload.data,
          };
        }

        if (
          typeof payload === 'object' &&
          payload !== null &&
          'message' in payload &&
          !('data' in payload)
        ) {
          return {
            success: true,
            message: (payload as EnvelopePayload).message,
          };
        }

        return responseMessage
          ? {
              success: true,
              data: payload,
              message: responseMessage,
            }
          : {
              success: true,
              data: payload,
            };
      }),
    );
  }
}
