import { Repository, FindOptionsWhere } from 'typeorm';

export abstract class BasePostgresRepository<
  Domain,
  Entity extends { id: string },
> {
  protected constructor(protected readonly repo: Repository<Entity>) {}

  protected abstract toDomain(entity: Entity): Domain;
  protected abstract toEntity(domain: Domain): Entity;

  async save(domain: Domain): Promise<void> {
    const entity = this.toEntity(domain);
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<Domain | null> {
    const entity = await this.repo.findOneBy({
      id,
    } as FindOptionsWhere<Entity>);
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Domain[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // …otros métodos comunes (updatePartial, count, etc.)
}
