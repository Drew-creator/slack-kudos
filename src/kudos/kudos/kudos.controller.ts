import { Controller, Post, Req, Res } from '@nestjs/common';
import { KudosService } from './kudos.provider';

@Controller('api')
export class KudosController {
    constructor(private kudosService: KudosService) {}


    @Post('give_kudos')
    give_kudos(@Req() req, @Res() res) {
        return this.kudosService.kudos_team(req)
    }

    @Post('replace_kudo')
    replace_kudo(@Req() req, @Res() res) {
        return this.kudosService.replace_kudo(req)
    }
}
