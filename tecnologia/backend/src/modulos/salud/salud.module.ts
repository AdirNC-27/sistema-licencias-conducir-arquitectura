import { Controller, Get, Module } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TerminusModule, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Publico } from '../../compartido/seguridad/decoradores';

@ApiTags('Salud')
@Controller('health')
class SaludController {
  constructor(
    private readonly salud: HealthCheckService,
    private readonly bd: TypeOrmHealthIndicator,
  ) {}

  @Publico()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado de la API y de PostgreSQL (EQ-04, monitoreo con UptimeRobot)' })
  revisar() {
    return this.salud.check([() => this.bd.pingCheck('postgresql', { timeout: 1500 })]);
  }
}

@Module({ imports: [TerminusModule], controllers: [SaludController] })
export class SaludModule {}
