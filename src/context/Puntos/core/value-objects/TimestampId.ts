import { TransactionTimestampFactory } from '../factories/TransactionTimestampFactory';

export class TimestampId {
  constructor(private readonly _value: number) {}

  static create(): TimestampId {
    return new TimestampId(TransactionTimestampFactory.now());
  }

  get value(): number {
    return this._value;
  }
}
