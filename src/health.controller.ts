import { Controller, Get, Route } from "tsoa";

@Route("health")
export class HealthController extends Controller {
  @Get()
  public getHealth(): { status: string } {
    return { status: "ok" };
  }
}
