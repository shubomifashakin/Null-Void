import { Test, TestingModule } from '@nestjs/testing';
import { RoomsEventsService } from './rooms-events.service';

describe('RoomsEventsService', () => {
  let service: RoomsEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsEventsService],
    }).compile();

    service = module.get<RoomsEventsService>(RoomsEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
