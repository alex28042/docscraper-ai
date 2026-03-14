export interface ILogger {
  info(message: string): void;
  error(message: string): void;
}

export class NullLogger implements ILogger {
  info(): void {}
  error(): void {}
}

export class StderrLogger implements ILogger {
  info(message: string): void {
    process.stderr.write(message + '\n');
  }

  error(message: string): void {
    process.stderr.write(message + '\n');
  }
}
