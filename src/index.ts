import axios from 'axios';
import { makeRequest, q25, q50, q75, q95, sleep, std, timeFunction } from './utils';
import config from './config.json';

async function main(): Promise<void> {
  const startTime = Date.now();

  const { urls, authorizationToken } = config;

  const mins = 10;
  const runTimeInMs = mins * 60 * 1000;
  const requestsPerMin = 1000;
  const waitTimeMs = runTimeInMs / (requestsPerMin * mins);

  const data = {
    operationName: 'Test',
    variables: {},
    query:
      'query Test {\n  getRoomReservationSimple(confirmationNumber: "123" lastName: "Joe") {\n    operaConfirmationNumber\n }\n}'
  };

  console.log('starting...');

  const requestsMap: Map<string, Promise<{ time: number; success: boolean }>[]> = new Map();

  let timer = 0;
  let i = 1;
  while (timer < runTimeInMs) {
    const url = urls[i % urls.length];
    console.log(`Sending request ${i}`);

    const requests = requestsMap.get(url) ?? [];

    requests.push(
      timeFunction(() =>
        makeRequest(
          () =>
            // axios.post(url, data, {
            //   headers: { 'x-correlation-id': '123' }
            // }),
            axios.get(url, {
              headers: { authorization: `Bearer ${authorizationToken}` }
            }),
          `Request number ${i} complete with no errors`,
          `Request number ${i} complete with error`
        )
      )
    );

    requestsMap.set(url, requests);

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
      console.error(`Error: ${error.message}`);
      console.error(error);
    }
  }

  console.log('\n################### RESULTS ###################\n');

  for (const { url, requestNumber, succeeded, failed, times } of urlResults) {
    const averageTime = times.reduce((prev, curr) => prev + curr, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (succeeded / requestNumber) * 100;
    const failureRate = (failed / requestNumber) * 100;

    console.log(`Endpoint: ${url}`);
    console.log(`Number of requests: ${requestNumber}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Failure rate: ${failureRate}%`);
    console.log(`Average request time: ${averageTime}ms`);
    console.log(`Max request time: ${maxTime}ms`);
    console.log(`Min request time: ${minTime}ms`);
    console.log(`25th percentile: ${q25(times)}ms`);
    console.log(`50th percentile: ${q50(times)}ms`);
    console.log(`75th percentile: ${q75(times)}ms`);
    console.log(`95th percentile: ${q95(times)}ms`);
    console.log(`Standard deviation: ${std(times)}`);
    console.log('\n');
  }

  const endTime = Date.now();

  const totalTimeMs = endTime - startTime;
  const totalTimeS = totalTimeMs / 1000;
  const totalTimeM = totalTimeS / 60;

  console.log(
    `${
      totalSucceeded + totalFailed
    } requests complete. ${totalSucceeded} total requests were successful. ${totalFailed} failed. Script took ${totalTimeMs} ms/${totalTimeS} seconds/${totalTimeM} minutes to run.`
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
