export class MinLengthRequiredError extends Error {
  constructor(key: string, expected: number, received: number) {
    super(
      `Campo ${key} inválido. Debe tener un mínimo de ${expected} carácteres, pero se recibieron ${received} carácteres.`,
    );
    Object.setPrototypeOf(this, MinLengthRequiredError.prototype);
  }
}
