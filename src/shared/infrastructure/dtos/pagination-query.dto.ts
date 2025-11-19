// @shared/infrastructure/http/dtos/pagination-query.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationParams } from '@shared/core/contracts/pagination';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // hard cap para no matar el server
  limit: number = 20;

  toParams(): PaginationParams {
    return {
      page: this.page,
      limit: this.limit,
    };
  }
}
