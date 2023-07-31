import { Test, TestingModule } from '@nestjs/testing';
import { KudosService } from '../kudos/kudos.provider';

describe('KudosService', () => {
  let provider: KudosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KudosService],
    }).compile();

    provider = module.get<KudosService>(KudosService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
