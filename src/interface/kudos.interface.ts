import { Document } from 'mongoose';

export interface IKudos extends Document{
   readonly team_id?: string;
   readonly team_domain?: string;
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
   readonly users?: [
        {
            readonly user_id?: string,
            readonly user_name?: string,
            kudos_given?: number,
            kudos_received?: number,
        }?
    ]
    
   readonly etpr_i?: boolean
//    readonly team_kudos_given?: number
}