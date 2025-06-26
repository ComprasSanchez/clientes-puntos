import { TransactionTimestampFactory } from '../../core/factories/TransactionTimestampFactory';
import { TimestampId } from './TimestampId';

export class OperacionId extends TimestampId {
  private constructor(_value: number) {
    super(_value);
  }

  /**
   * Genera un OperacionId basado en timestamp (legible para el cliente)
   */
  static create(): OperacionId {
    return new OperacionId(TransactionTimestampFactory.now());
  }

  public static instance(_value: number): OperacionId {
    return new OperacionId(_value);
  }

  /** Para leer su valor */
  public get value(): number {
    return super.value;
  }
}
