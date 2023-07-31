import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KudosModule } from './kudos/kudos/kudos.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { KudosSchema } from './schema/kudos.schema';

@Module({
  imports: [
    KudosModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.DB_CONNECTION_STRING, 
      { dbName: process.env.DB_NAME }
    )
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
