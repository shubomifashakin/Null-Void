import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: client.Registry;

  constructor() {
    this.registry = new client.Registry();

    client.collectDefaultMetrics({ register: this.registry });
  }

  public createCounter(name: string, help: string, labelNames: string[] = []) {
    const counter = new client.Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });

    return counter;
  }

  public createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ) {
    const histogram = new client.Histogram({
      name,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });

    return histogram;
  }

  public async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  public getContentType(): string {
    return this.registry.contentType;
  }
}
