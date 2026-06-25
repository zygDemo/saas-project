import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class UpdateMobileConfigDto {
  @ApiPropertyOptional({ description: '已启用的移动端模块列表', example: ['carloan', 'food'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  mobileModules!: string[];

  @ApiPropertyOptional({ description: '默认模块 key（单模块模式）', example: 'carloan' })
  @IsOptional()
  @IsString()
  defaultMobileModule?: string;
}
