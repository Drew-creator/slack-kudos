import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"


@Schema()
export class Kudos {
    @Prop({type: String, required: false})
    team_id: string;

    @Prop({type: String, required: false})
    team_domain: string;

    @Prop({type: Array, required: false})
    kudos_container: [
        {
            kudo_sender_name: string,
            kudo_sender_uid: string,
            kudo_recipient_name: string,
            kudo_recipient_uid: string,
            kudo_message: string,
            kudo_uid: string,
            created_at: Date,
            updated_at: Date,
            update_count: number,
            channel_id: string,
        }
    ]

    @Prop({type: Array, reiquired: false})
    users: [
        {
            user_id: string,
            user_name: string,
            kudos_given: number,
            kudos_received: number,
        }
    ]
    
    @Prop({type: Boolean, required: false})
    etpr_i: boolean

    @Prop({type: Number, requred: false})
    team_kudos_given: number
}

export const KudosSchema = SchemaFactory.createForClass(Kudos);