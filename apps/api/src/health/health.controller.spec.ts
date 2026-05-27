import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('retourne le statut ok', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('mytdfrik-api');
    expect(result.timestamp).toBeDefined();
  });
});
