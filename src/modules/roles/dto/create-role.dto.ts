import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  @IsMongoId()
  @IsArray()
  permissions: mongoose.Schema.Types.ObjectId[];
}
