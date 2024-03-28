import { PartialType } from '@nestjs/mapped-types';
import { CreateResumeDto } from './create-resume.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateResumeDto extends PartialType(CreateResumeDto) {
  @IsNotEmpty()
  @IsString()
  status: boolean;
}
