import { PartialType } from '@nestjs/swagger';
import { CreateWasteLogDto } from './create-waste-log.dto';

export class UpdateWasteLogDto extends PartialType(CreateWasteLogDto) {}
