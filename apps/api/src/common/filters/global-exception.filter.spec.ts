import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost } from '@nestjs/common';
import { Response, Request } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test-route',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      ip: '127.0.0.1',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn(() => ({
        getResponse: jest.fn(() => mockResponse),
        getRequest: jest.fn(() => mockRequest),
      })),
    } as unknown as ArgumentsHost;
  });

  describe('catch - HttpException', () => {
    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input',
          path: '/test-route',
          method: 'GET',
        }),
      );
    });

    it('should handle custom HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Custom error', error: 'CUSTOM_ERROR' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Custom error',
          error: 'CUSTOM_ERROR',
        }),
      );
    });
  });

  describe('catch - Generic Error', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Something went wrong',
          error: 'Error',
        }),
      );
    });
  });

  describe('catch - Unknown exception', () => {
    it('should handle unknown exception types', () => {
      const exception = 'Unknown error string';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });
  });

  describe('error response structure', () => {
    it('should include timestamp, path, and method', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs).toHaveProperty('timestamp');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(callArgs.path).toBe('/test-route');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(callArgs.method).toBe('GET');
    });
  });
});
