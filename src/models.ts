export interface RequestObj<TBody = any> {
  /** The HTTP method of the request. */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** The url of the request. */
  url: string;
  /** (Optional) Body (as JSON) to send with POST, PUT, or PATCH requests. Does nothing for GET and DELETE. */
  body?: TBody;
  /** (Optional) The authorization token to send with each request. This will override the token from global config. */
  authorizationToken?: string;
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
}
