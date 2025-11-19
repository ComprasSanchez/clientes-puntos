// infra/http/dtos/PaginatedOperacionResponseDto.ts
import { OperacionResponseDto } from './OperacionResponseDto';

export class PaginatedOperacionResponseDto {
  items: OperacionResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
