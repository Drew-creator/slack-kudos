import { PartialType } from "@nestjs/mapped-types";
import {CreateKudosDto} from './create-kudos.dto';

export class UpdateKudosDto extends PartialType(CreateKudosDto) {}