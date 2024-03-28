import { IsEmail, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class CreateResumeDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  userId: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  url: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  companyId: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  jobId: mongoose.Schema.Types.ObjectId;
}

export class CreateUserCvDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  companyId: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  jobId: mongoose.Schema.Types.ObjectId;
}
