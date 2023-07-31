import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsString, MaxLength } from "class-validator";

export class CreateKudosDto {
    @IsString()
    readonly team_id?: string;

    @IsString()
    readonly team_domain?: string;

    @IsArray()
    readonly kudos_container?: [
        {
            readonly kudo_sender_uid?: string,
            readonly kudo_recipient?: string,
            readonly kudo_message?: string,
            readonly kudo_uid?: string,
            readonly created_at?: Date,
            readonly updated_at?: Date,
            readonly update_count?: number,
            readonly channel_id?: string,
        }
    ]

    @IsArray()
    readonly users?: [
        {
            readonly user_id?: string,
            readonly user_name?: string,
            kudos_given?: number,
            kudos_received?: number,
        }?
    ]

    @IsBoolean()
    readonly etpr_i?: boolean

    // @IsNumber()
    // readonly team_kudos_given?: number
}