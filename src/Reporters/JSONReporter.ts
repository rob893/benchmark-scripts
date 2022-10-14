import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { PerformanceResult, RunReporter } from '../models';

export class JSONReporter implements RunReporter {
  public generateReport(result: PerformanceResult): void {
    const asJson = JSON.stringify(result, null, 2);
    const dirPath = './reports';

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
    }

    writeFileSync(`${dirPath}/performance-report-${result.startTime}`, asJson);
  }
}
