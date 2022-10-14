# benchmark-scripts

## Setup and usage

- Add a `config.ts` file to the `src` directory with the following object:

```typescript
export const config: ScriptConfiguration = {
  // Your config.
};
```

- ScriptConfiguration has a schema of:

```typescript
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
```

- `npm i` to install dependencies.
- `npm start` to run the script

### Reporters

Reporters generate reports and can hook into multiple events as the script runs. You can implement your own reporters by implementing this interface (only the generateReport function is required):

```typescript
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
```

You can then configure the script to use your reporter by creating a new instance of it and passing it to the 'reporters' field in the config object (it defaults to only ConsoleReporter (be sure to add a ConsoleReporter instance to the field if you want it because if you set that field, the default reporter will not be used)).

There are several out of the box reporters like ConsoleReporter (used by default) and JSONReporter. See the reporters folder for them.

### Example Config

An example config may look something like this:

```typescript
export const config: ScriptConfiguration = {
  mins: 0.5,
  requestsPerMin: 50,
  requests: [
    {
      method: 'GET',
      url: 'https://example.com/endpoint1?first={1}&startDate={2}&id={3}&amount={4}',
      replacers: [
        {
          target: '{1}',
          replaceWithOneOf: ['250', '100', '300']
        },
        {
          target: '{2}',
          replaceWithOneOf: ['2/15/2021', '3/12/2021', '4/01/2021']
        },
        {
          target: '{3}',
          replaceWithOneOf: ['171315', '765', '58480']
        },
        {
          target: '{4}',
          replaceWithOneOf: ['76', '104', '163']
        }
      ]
    },
    {
      method: 'GET',
      url: 'https://example.com/endpoint2'
    },
    {
      method: 'POST',
      url: 'https://example.com/endpoint2',
      body: { foo: 'bar', baz: [1, 2, 3] } // This body will be serialized to JSON for the request
    },
    {
      method: 'DELETE',
      url: 'https://someotherapi.com/someendpoint/1',
      authorizationToken: '{some special token that will only be used for this request and not the others}'
    }
  ],
  reporters: [new ConsoleReporter(), new JSONReporter()],
  authorizationToken: '{YOUR AUTH TOKEN}'
};
```
