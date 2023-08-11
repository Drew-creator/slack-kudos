import { Module } from '@nestjs/common';
import { KudosService } from './kudos.provider';
import { KudosController } from './kudos.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { KudosSchema } from '../../schema/kudos.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [KudosService],
  controllers: [KudosController],
  imports: [
    MongooseModule.forFeature([
      {name: 'Kudos', schema: KudosSchema}
    ]),
    HttpModule
  ]
})
export class KudosModule {}
