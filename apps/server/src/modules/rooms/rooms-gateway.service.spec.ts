import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGatewayService } from './rooms-gateway.service';

describe('RoomsGatewayService', () => {
  let service: RoomsGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsGatewayService],
    }).compile();

    service = module.get<RoomsGatewayService>(RoomsGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
