import axios from 'axios';
import { makeRequest, q25, q50, q75, q95, sleep, std, timeFunction } from './utils';
import config from './config.json';

async function main(): Promise<void> {
  const startTime = Date.now();

  const { urls, authorizationToken } = config;

  const mins = 0.1;
  const runTimeInMs = mins * 60 * 1000;
  const requestsPerMin = 2000;
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
              headers: { authorization: `Bearer ${authorizationToken}`, 'x-correlation-id': '123' }
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

  // Wait for any requests to finish
  await sleep(2000);

  console.log('\n################### RESULTS ###################\n');

  let totalSucceeded = 0;
  let totalFailed = 0;
  for (const [url, requests] of requestsMap) {
    try {
      const { succeeded, failed, times } = (await Promise.all(requests)).reduce<{
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

      totalSucceeded += succeeded;
      totalFailed += failed;

      const averageTime = times.reduce((prev, curr) => prev + curr, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log(`Endpoint: ${url}`);
      console.log(`Number of requests: ${requests.length}`);
      console.log(`Average request time: ${averageTime}ms`);
      console.log(`Max request time: ${maxTime}ms`);
      console.log(`Min request time: ${minTime}ms`);
      console.log(`25th percentile: ${q25(times)}ms`);
      console.log(`50th percentile: ${q50(times)}ms`);
      console.log(`75th percentile: ${q75(times)}ms`);
      console.log(`95th percentile: ${q95(times)}ms`);
      console.log(`Standard deviation: ${std(times)}`);
      console.log('\n');
    } catch (error) {
      console.error(`Error: ${error.message}`);
      console.error(error);
    }
  }

  const endTime = Date.now();

  const totalTimeMs = endTime - startTime;
  const totalTimeS = totalTimeMs / 1000;
  const totalTimeM = totalTimeS / 60;

  console.log(
    `Requests complete. ${totalSucceeded} total requests were successful. ${totalFailed} failed. Script took ${totalTimeMs} ms/${totalTimeS} seconds/${totalTimeM} minutes to run.`
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
