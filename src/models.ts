export interface RequestObj<TBody = any> {
  /** The HTTP method of the request. */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** The url of the request. */
  url: string;
  /** (Optional) Body (as JSON) to send with POST, PUT, or PATCH requests. Does nothing for GET and DELETE. */
  body?: TBody;
  /** (Optional) The authorization token to send with each request. This will override the token from global config. */
  authorizationToken?: string;
  /** (Optional) Replacers to target certain text and replace them with something else. */
  replacers?: { target: string; replaceWithOneOf: string[]; random?: boolean }[];
}

export interface ScriptConfiguration {
  /** (Optional) Number of minutes to run the script for. Defaults to 2. */
  mins?: number;
  /** (Optional) Number of requests per minute to send. Defaults to 1000. */
  requestsPerMin?: number;
  /** (Optional) The authorization token to send with each request. */
  authorizationToken?: string;
  /** The requests to run the script with. */
  requests: RequestObj[];
  /** (Optional) Reporters used to generate reports. Defaults to just ConsoleReporter. */
  reporters?: RunReporter[];
}

export interface PerformanceResult {
  startTime: number;
  endTime: number;
  totalSucceeded: number;
  totalFailed: number;
  totalTimeMS: number;
  totalTimeSeconds: number;
  totalTimeMinutes: number;
  requestResults: RequestPerformanceResult[];
}

export interface RequestPerformanceResult {
  endpoint: string;
  numberOfRequests: number;
  successRate: number;
  failureRate: number;
  averageRequestTime: number;
  maxRequestTime: number;
  minRequestTime: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile95: number;
  standardDeviation: number;
}

export interface RunReporter {
  generateReport(result: PerformanceResult): void;
  onStart?(): void;
  onSendRequest?<TReqBody>(request: RequestObj<TReqBody>, requestNumber: number): void;
  onRequestSuccess?<TReqBody>(request: RequestObj<TReqBody>, requestNumber: number): void;
  onRequestError?<TReqBody, TError extends Error>(
    request: RequestObj<TReqBody>,
    requestNumber: number,
    error: TError
  ): void;
  onApplicationError?<TError extends Error>(error: TError): void;
}
