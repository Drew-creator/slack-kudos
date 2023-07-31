import { Test, TestingModule } from '@nestjs/testing';
import { KudosController } from '../kudos/kudos.controller';

describe('KudosController', () => {
  let controller: KudosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KudosController],
    }).compile();

    controller = module.get<KudosController>(KudosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
