import { Controller, Post, Req, Res } from '@nestjs/common';
import { KudosService } from './kudos.provider';

@Controller('api')
export class KudosController {
    constructor(private kudosService: KudosService) {}


    @Post('give_kudos')
    give_kudos(@Req() req) {
        this.kudosService.kudos_team(req)
        return "Kudo request recieved!"
    }

    @Post('replace_kudo')
    replace_kudo(@Req() req) {
        this.kudosService.replace_kudo(req)
        return "Kudo request recieved!"
    }
}
