import { TransactionTimestampFactory } from '../../core/factories/TransactionTimestampFactory';
import { TimestampId } from './TimestampId';

export class OperacionId extends TimestampId {
  private constructor(value: number) {
    super(value);
  }

  /**
   * Genera un OperacionId basado en timestamp (legible para el cliente)
   */
  static create(): OperacionId {
    return new OperacionId(TransactionTimestampFactory.now());
  }
}
