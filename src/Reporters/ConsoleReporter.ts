import { PerformanceResult, RequestObj, RunReporter } from '../models';

export class ConsoleReporter implements RunReporter {
  public onStart(): void {
    console.log('starting...');
  }

  public onSendRequest<TReqBody>(_request: RequestObj<TReqBody>, requestNumber: number): void {
    console.log(`Sending request ${requestNumber}`);
  }

  public onRequestSuccess<TReqBody>(_request: RequestObj<TReqBody>, requestNumber: number): void {
    console.log(`Request number ${requestNumber} complete with no errors`);
  }

  public onRequestError<TReqBody, TError extends Error>(
    _request: RequestObj<TReqBody>,
    requestNumber: number,
    error: TError
  ): void {
    console.error(`Request number ${requestNumber} complete with error`);
    console.error(error);
  }

  public onApplicationError<TError extends Error>(error: TError): void {
    console.error(`Error: ${error.message}`);
    console.error(error);
  }

  public generateReport(result: PerformanceResult): void {
    const {
      endTime,
      startTime,
      totalSucceeded,
      totalFailed,
      requestResults,
      totalTimeMS,
      totalTimeMinutes,
      totalTimeSeconds
    } = result;
    console.log('\n################### RESULTS ###################\n');

    for (const {
      averageRequestTime,
      endpoint,
      failureRate,
      maxRequestTime,
      minRequestTime,
      numberOfRequests,
      percentile25,
      percentile50,
      percentile75,
      percentile95,
      standardDeviation,
      successRate
    } of requestResults) {
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Number of requests: ${numberOfRequests}`);
      console.log(`Success rate: ${successRate}%`);
      console.log(`Failure rate: ${failureRate}%`);
      console.log(`Average request time: ${averageRequestTime}ms`);
      console.log(`Max request time: ${maxRequestTime}ms`);
      console.log(`Min request time: ${minRequestTime}ms`);
      console.log(`25th percentile: ${percentile25}ms`);
      console.log(`50th percentile: ${percentile50}ms`);
      console.log(`75th percentile: ${percentile75}ms`);
      console.log(`95th percentile: ${percentile95}ms`);
      console.log(`Standard deviation: ${standardDeviation}`);
      console.log('\n');
    }

    console.log(
      `${
        totalSucceeded + totalFailed
      } requests complete. ${totalSucceeded} total requests were successful. ${totalFailed} failed. Script took ${totalTimeMS} ms/${totalTimeSeconds} seconds/${totalTimeMinutes} minutes to run.`
    );
  }
}
