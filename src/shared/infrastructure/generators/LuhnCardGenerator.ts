import { CardGenerator } from '@shared/core/interfaces/CardGenerator';

export class LuhnTarjetaGenerator implements CardGenerator {
  private readonly prefijo = '63706412';

  generate(): string {
    if (!/^\d{8}$/.test(this.prefijo)) throw new Error('Prefijo inválido');

    const partial = this.prefijo + this.randomDigits(7); // total 15
    const checksum = this.luhnChecksum(partial);
    return partial + checksum;
  }

  private randomDigits(length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
    return out;
  }

  private luhnChecksum(number: string): string {
    let sum = 0,
      shouldDouble = true;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return ((10 - (sum % 10)) % 10).toString();
  }
}
