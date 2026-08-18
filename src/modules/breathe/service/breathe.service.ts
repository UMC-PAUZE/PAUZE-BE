import { AppError } from "../../../common/errors/app.error.js";
import type { BreatheGuideFileResponse } from "../dto/breathe.dto.js";
import { BREATHE_CODES, BREATHE_MESSAGES } from "../errors/breathe.errors.js";
import {
  type BreatheGuideRepository,
  breatheGuideRepository,
} from "../repository/breathe.repository.js";

export class BreatheGuideService {
  constructor(
    private readonly breatheGuideRepository: BreatheGuideRepository,
  ) {}

  async getBreatheGuide(): Promise<BreatheGuideFileResponse> {
    const breathe = await this.breatheGuideRepository.findCurrent();

    if (breathe) {
      return { breatheUrl: breathe.breatheUrl };
    }

    throw new AppError({
      code: BREATHE_CODES.BREATHE_GUIDE_NOT_FOUND,
      message: BREATHE_MESSAGES.BREATHE_GUIDE_NOT_FOUND,
      statusCode: 404,
    });
  }
}

export const breatheGuideService = new BreatheGuideService(
  breatheGuideRepository,
);
