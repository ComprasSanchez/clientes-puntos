import { ClienteRepository } from '@cliente/core/repository/ClienteRepository';
import { CLIENTE_REPO } from '@cliente/core/tokens/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { CardGenerator } from '@shared/core/interfaces/CardGenerator';

@Injectable()
export class uniqueCardGenerator {
  constructor(
    @Inject(CardGenerator)
    private readonly cardGen: CardGenerator,
    @Inject(CLIENTE_REPO)
    private readonly repository: ClienteRepository,
  ) {}
  async generate(): Promise<string> {
    let intentos = 0;
    let cardNumber: string;
    do {
      if (intentos++ > 10) {
        throw new Error('No se pudo generar un número de tarjeta único');
      }
      cardNumber = this.cardGen.generate();
    } while (await this.repository.existsByTarjetaFidely(cardNumber));
    return cardNumber;
  }
}
