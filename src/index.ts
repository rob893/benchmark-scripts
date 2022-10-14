import axios from 'axios';
import { makeRequest, q25, q50, q75, q95, sleep, std, timeFunction } from './utils';
import { config } from './config';
import { ConsoleReporter } from './reporters/ConsoleReporter';
import { PerformanceResult, RequestPerformanceResult, RunReporter } from './models';

function replaceAll(string: string, search: string, replace: string): string {
  return string.split(search).join(replace);
}

async function main(): Promise<void> {
  const startTime = Date.now();

  const {
    requests,
    authorizationToken,
    mins = 2,
    requestsPerMin = 1000,
    reporters = [new ConsoleReporter()] as RunReporter[]
  } = config;

  const runTimeInMs = mins * 60 * 1000;
  const waitTimeMs = runTimeInMs / (requestsPerMin * mins);

  reporters.forEach(r => r.onStart && r.onStart());

  const requestsMap: Map<string, Promise<{ time: number; success: boolean }>[]> = new Map();

  let timer = 0;
  let i = 1;
  while (timer < runTimeInMs) {
    const request = requests[i % requests.length];

    const { url, method, body, authorizationToken: reqAuthToken, replacers } = request;
    const tokenToUse = reqAuthToken ?? authorizationToken;

    reporters.forEach(r => r.onSendRequest && r.onSendRequest(request, i));

    const requestPromises = requestsMap.get(url) ?? [];

    let urlToUse = url;

    if (replacers) {
      for (const { target, replaceWithOneOf } of replacers) {
        urlToUse = replaceAll(urlToUse, target, replaceWithOneOf[Math.floor(Math.random() * replaceWithOneOf.length)]);
      }
    }

    requestPromises.push(
      timeFunction(() =>
        makeRequest(
          () => {
            switch (method.toUpperCase()) {
              case 'GET':
                return axios.get(urlToUse, {
                  headers: { authorization: tokenToUse ? `Bearer ${tokenToUse}` : undefined }
                });
              case 'POST':
                return axios.post(urlToUse, body, {
                  headers: { authorization: tokenToUse ? `Bearer ${tokenToUse}` : undefined }
                });
              case 'PUT':
                return axios.put(urlToUse, body, {
                  headers: { authorization: tokenToUse ? `Bearer ${tokenToUse}` : undefined }
                });
              case 'PATCH':
                return axios.patch(urlToUse, body, {
                  headers: { authorization: tokenToUse ? `Bearer ${tokenToUse}` : undefined }
                });
              case 'DELETE':
                return axios.delete(urlToUse, {
                  headers: { authorization: tokenToUse ? `Bearer ${tokenToUse}` : undefined }
                });
              default:
                throw new Error('Invalid method.');
            }
          },
          () => {
            reporters.forEach(r => r.onRequestSuccess && r.onRequestSuccess(request, i));
          },
          error => {
            reporters.forEach(r => r.onRequestError && r.onRequestError(request, i, error));
          }
        )
      )
    );

    requestsMap.set(url, requestPromises);

    await sleep(waitTimeMs);

    timer += waitTimeMs;
    i++;
  }

  let totalSucceeded = 0;
  let totalFailed = 0;

  const urlResults: {
    url: string;
    requestNumber: number;
    succeeded: number;
    failed: number;
    times: number[];
  }[] = [];

  for (const [url, requests] of requestsMap) {
    try {
      const result = (await Promise.all(requests)).reduce<{
        succeeded: number;
        failed: number;
        times: number[];
      }>(
        (prev, curr) => ({
          succeeded: curr.success ? prev.succeeded + 1 : prev.succeeded,
          failed: !curr.success ? prev.failed + 1 : prev.failed,
          times: [...prev.times, curr.time]
        }),
        { succeeded: 0, failed: 0, times: [] }
      );

      totalSucceeded += result.succeeded;
      totalFailed += result.failed;

      urlResults.push({
        url,
        requestNumber: requests.length,
        ...result
      });
    } catch (error) {
      reporters.forEach(r => r.onApplicationError && r.onApplicationError(error));
    }
  }

  const requestResults: RequestPerformanceResult[] = urlResults.map(
    ({ url: endpoint, requestNumber: numberOfRequests, succeeded, failed, times }) => {
      const averageRequestTime = times.reduce((prev, curr) => prev + curr, 0) / times.length;
      const minRequestTime = Math.min(...times);
      const maxRequestTime = Math.max(...times);
      const successRate = (succeeded / numberOfRequests) * 100;
      const failureRate = (failed / numberOfRequests) * 100;

      return {
        averageRequestTime,
        endpoint,
        failureRate,
        successRate,
        maxRequestTime,
        minRequestTime,
        numberOfRequests,
        percentile25: q25(times),
        percentile50: q50(times),
        percentile75: q75(times),
        percentile95: q95(times),
        standardDeviation: std(times)
      };
    }
  );

  const endTime = Date.now();
  const totalTimeMS = endTime - startTime;
  const totalTimeSeconds = totalTimeMS / 1000;
  const totalTimeMinutes = totalTimeSeconds / 60;

  const runResult: PerformanceResult = {
    endTime,
    totalTimeMS,
    totalTimeSeconds,
    totalTimeMinutes,
    startTime,
    totalFailed,
    totalSucceeded,
    requestResults
  };

  for (const reporter of reporters) {
    reporter.generateReport(runResult);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
