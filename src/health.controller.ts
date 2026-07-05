import { Controller, Get, Route } from "tsoa";
import { success } from "./common/responses/response.js";

@Route("health")
export class HealthController extends Controller {
  @Get()
  public getHealth() {
    return success("HEALTH_OK", "서버가 정상 동작 중입니다.", { status: "ok" });
  }
}
