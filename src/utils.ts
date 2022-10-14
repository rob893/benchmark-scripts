export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function timeFunction<TResults = any>(
  funcToTime: () => Promise<TResults>
): Promise<{ time: number; success: boolean }> {
  const startTime = Date.now();

  try {
    await funcToTime();

    const endTime = Date.now();

    return {
      time: endTime - startTime,
      success: true
    };
  } catch {
    const endTime = Date.now();

    return {
      time: endTime - startTime,
      success: false
    };
  }
}

export async function makeRequest<T = any>(
  httpFetch: () => Promise<T>,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<T> {
  try {
    const results = await httpFetch();

    if (onSuccess) {
      onSuccess();
    }

    return results;
  } catch (error) {
    if (onError) {
      onError(error);
    }

    throw error;
  }
}

export function sortAsc(arr: number[]): number[] {
  return arr.sort((a, b) => a - b);
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function mean(arr: number[]): number {
  return sum(arr) / arr.length;
}

export function std(arr: number[]): number {
  const mu = mean(arr);
  const diffArr = arr.map(a => (a - mu) ** 2);
  return Math.sqrt(sum(diffArr) / (arr.length - 1));
}

export function quantile(arr: number[], q: number): number {
  const sorted = sortAsc(arr);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

export const q25 = (arr: number[]) => quantile(arr, 0.25);
export const q50 = (arr: number[]) => quantile(arr, 0.5);
export const q75 = (arr: number[]) => quantile(arr, 0.75);
export const q95 = (arr: number[]) => quantile(arr, 0.95);
