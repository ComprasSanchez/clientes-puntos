export class MaxLengthRequiredError extends Error {
  constructor(key: string, expected: number, received: number) {
    super(
      `Campo ${key} inválido. Debe tener un máximo de ${expected} carácteres, pero se recibieron ${received} carácteres.`,
    );
    Object.setPrototypeOf(this, MaxLengthRequiredError.prototype);
  }
}
