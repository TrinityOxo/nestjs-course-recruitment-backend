import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Job } from 'src/modules/jobs/schemas/job.schema';
import { Company } from 'src/modules/users/dto/create-user.dto';

export type ResumeDocument = HydratedDocument<Resume>;

@Schema({ timestamps: true, versionKey: false })
export class Resume {
  @Prop()
  email: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: Object })
  url: string;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Company.name })
  companyId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Job.name })
  jobId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Array })
  history: {
    status: string;
    updatedAt: Date;
    updatedBy: {
      _id: mongoose.Schema.Types.ObjectId;
      email: string;
    };
  }[];

  @Prop({ type: Object })
  createdBy: { _id: mongoose.Schema.Types.ObjectId; email: string };

  @Prop({ type: Object })
  updatedBy: { _id: mongoose.Schema.Types.ObjectId; email: string };

  @Prop({ type: Object })
  deletedBy: { _id: mongoose.Schema.Types.ObjectId; email: string };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);
