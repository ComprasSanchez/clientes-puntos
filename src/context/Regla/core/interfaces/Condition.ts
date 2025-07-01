export interface Condition<Ctx> {
  evaluate(ctx: Ctx): boolean;
}
