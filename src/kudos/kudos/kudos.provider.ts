import { Injectable } from '@nestjs/common';
import { CreateKudosDto } from 'src/dto/create-kudos.dto';
import { IKudos } from 'src/interface/kudos.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kudos } from 'src/schema/kudos.schema';
import {firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class KudosService {
    constructor(@InjectModel('Kudos') private kudosModel:Model<IKudos>, private httpService:HttpService) {}

    async kudos_team(req) {
        console.log(req.body)
        // extract the data from the request
        const {
            team_id, 
            team_domain, 
            channel_id, 
            channel_name, 
            user_id, 
            user_name, 
            command, 
            text, 
            response_url,
            is_enterprise_install,
        } = req.body;

        const kudo_text_pattern = new RegExp('<@([A-Z0-9]{12})\|([a-zA-Z0-9]+)> (<|&lt;)(.+?)(>|&gt;)');
        
        // check for proper command input formatting
        if (!kudo_text_pattern.test(text)) {
            this.send_response_message_to_user(response_url, `Please follow the formatting rules. Example: /give_kudo @user <this is a message>`);
            return
        }

        const recipient_name: string = text.split(' ')[0].slice(2, text.split(' ')[0].length - 3).split("|")[1];
        const recipient_uid: string = text.split(' ')[0].slice(2, text.split(' ')[0].length - 3).split("|")[0];

        let kudo_message: string = text.split(' ').slice(1).join(' ');
        kudo_message = kudo_message.slice(4, kudo_message.length - 4); // extract text between &lt; &gt;

        const sender_uid: string = user_id;
        const sender_name: string = user_name;

        const kudo_params_to_be_cleaned = [
            team_domain, 
            channel_name, 
            sender_name, 
            text,
            recipient_name
        ]

        kudo_params_to_be_cleaned.forEach((param) => {
            param = this.sanitize(param); // sanitize text
        })

        const kudos_team_obj: CreateKudosDto = await this.find_kudos_team(team_id)

        // CHECK FOR EXISTING KUDO TEAM OBJ
        if (!kudos_team_obj) {
            const kudos_team:CreateKudosDto = {
                team_id: team_id,
                team_domain: team_domain,
                kudos_container: [
                    {
                        kudo_sender_name: sender_name,
                        kudo_sender_uid: sender_uid,
                        kudo_recipient_name: recipient_name,
                        kudo_recipient_uid: recipient_uid,
                        kudo_message: kudo_message,
                        kudo_uid: 'kudos_' + Math.random().toString(36).substr(2, 9),
                        created_at: new Date(),
                        updated_at: new Date(),
                        update_count: 0,
                        channel_id: channel_id,
                    }
                ],
                users: [],
                etpr_i: is_enterprise_install
            };
    
            const new_kudos = new this.kudosModel(kudos_team);

            let kudos_record: CreateKudosDto = await this.create_kudos_team(new_kudos);

            // create update condition, push sender and recipient obj into users arr
            const update_condition: object = {
                $push: {
                    users: {
                        $each: [
                            { // sender
                                user_id: sender_uid,
                                user_name: sender_name,
                                kudos_given: 1,
                                kudos_received: 0,
                            },
                            { // recipient
                                user_id: recipient_uid, 
                                user_name: recipient_name, 
                                kudos_given: 0,
                                kudos_received: 1,
                            }
                        ]
                    }
                }
            }

            this.update_kudos_team(team_id, update_condition)
            this.send_response_message_to_user(response_url, `kudos with id - ${kudos_team.kudos_container[0].kudo_uid} created`)
            // return {status: 200, message: `kudo with id - ${kudos_team.kudos_container[0].kudo_uid} created`}

            console.log(kudos_record)
        } else { 
            // IF KUDO TEAM OBJ ALREADY EXISTS
            // CREATE KUDOS OBJ
            const kudos_obj = {
                kudo_sender_name: sender_name,
                kudo_sender_uid: sender_uid,
                kudo_recipient_name: recipient_name,
                kudo_recipient_uid: recipient_uid,
                kudo_message: kudo_message,
                kudo_uid: 'kudos_' + Math.random().toString(36).substr(2, 9),
                created_at: new Date(),
                updated_at: new Date(),
                update_count: 0,
                channel_id: channel_id,
            }

            // PUSH KUDOS OBJ TO KUDOS_CONTAINER
            const update_condition: object = {
                $push: {
                    kudos_container: kudos_obj
                }
            }

            const kudos_record: CreateKudosDto = await this.update_kudos_team(team_id, update_condition);
            let sender_exists: boolean, recipient_exists: boolean = false;

            console.log(kudos_record)

            // CHECK IF USERS ALREADY EXIST
            kudos_record.users.forEach((user) => {
                if (user['user_id'] === sender_uid) {
                    user['kudos_given'] += 1;
                    sender_exists = true;
                } 
                
                if (user['user_id'] === recipient_uid) {
                    user['kudos_received'] += 1;
                    recipient_exists = true;
                }

                console.log('user: ', user)
            })


            // CREATE AND PUSH USER OBJ IF NOT
            if (!sender_exists) {
                kudos_record.users.push({
                    user_id: sender_uid,
                    user_name: sender_name,
                    kudos_given: 1,
                    kudos_received: 0,
                })
            }

            if (!recipient_exists) {
                kudos_record.users.push({ 
                    user_id: recipient_uid,
                    user_name: recipient_name, 
                    kudos_given: 0,
                    kudos_received: 1,
                })
            }

            await this.update_kudos_team(team_id, kudos_record)

            this.send_response_message_to_user(response_url, `Kudos with id - ${kudos_obj.kudo_uid} created`)
            // return {status: 200, message: `kudo with id - ${kudos_obj.kudo_uid} created`}
        }
    }

    async replace_kudo(req) {
        const {
            team_id, 
            team_domain, 
            channel_id, 
            channel_name, 
            user_id, 
            user_name, 
            command, 
            text, 
            response_url,
            is_enterprise_install,
        } = req.body;

        const kudo_text_pattern = new RegExp('(?:<|&lt;)kudos_[a-z0-9]{9}(?:>|&gt;) (?:<|&lt;).+?(?:>|&gt;)');
        
        // check for proper command input formatting
        if (!kudo_text_pattern.test(text)) {
            this.send_response_message_to_user(response_url, `Please follow the formatting rules. Example: /replace_kudo <kudo_id> <this is a message>`);
            return
        }

        const kudo_params_to_be_cleaned = [
            team_domain, 
            channel_name, 
            user_name, 
            text
        ]


        kudo_params_to_be_cleaned.forEach((param) => {
            param = this.sanitize(param);
        })

        let message:string, kudo_id: string;

        try {
            // extract kudo_id and message from text property
            message = text.split('&gt; &lt;')[1].slice(0, text.split('&gt; &lt;')[1].length - 4);
            kudo_id = text.split(' ')[0].slice(4, text.split(' ')[0].length - 4); 
        } catch(err) {
            this.send_response_message_to_user(response_url, `Please follow the formatting rules. Example: /replace_kudo <kudo_12345> <this message is a replacement>`);
            return
        }

        console.log(message, " " , kudo_id)

        // find kudos team obj
        const kudos_team_obj = await this.find_kudos_team(team_id);
        let user_id_matches_kudo_sender_uid:boolean = false;

        if (!kudos_team_obj) {
            this.send_response_message_to_user(response_url, `No kudos entries for your workspace`);
            return
        }

        // find kudo obj in kudos_container and update message
        kudos_team_obj.kudos_container.forEach((kudo) => {
            if (kudo.kudo_uid === kudo_id && kudo.kudo_sender_uid === user_id) {
                kudo.kudo_message = message;
                kudo.updated_at = new Date();
                kudo.update_count += 1;
                user_id_matches_kudo_sender_uid = true;
            }
        })

        if (!user_id_matches_kudo_sender_uid) {
            this.send_response_message_to_user(response_url, `You are not the sender of this kudo or kudo_id does not exist. You cannot edit it.`);
            return
        }
        
        // save updated kudos team obj
        await this.update_kudos_team(team_id, kudos_team_obj);
        this.send_response_message_to_user(response_url, `Kudo with id - ${kudo_id} updated`);


        console.log(req.body)
    }

    async delete_kudo(req) {
        const {
            team_id, 
            team_domain, 
            channel_id, 
            channel_name, 
            user_id, 
            user_name, 
            command, 
            text, 
            response_url,
            is_enterprise_install,
        } = req.body;

        const kudo_text_pattern = new RegExp('^-?\d+$');
        
        // check for proper command input formatting
        if (!kudo_text_pattern.test(text)) {
            this.send_response_message_to_user(response_url, `Please follow the formatting rules. Example: /list_ 10`);
            return
        }

        const kudo_params_to_be_cleaned = [
            team_domain, 
            channel_name, 
            user_name, 
            text
        ]


        kudo_params_to_be_cleaned.forEach((param) => {
            param = this.sanitize(param);
        })

        const kudo_id:string = text;
        const kudos_team_obj:CreateKudosDto = await this.find_kudos_team(team_id);

        let kudo_exists:boolean = false;

        kudos_team_obj.kudos_container.forEach((kudo, index) => {
            if (kudo.kudo_uid === kudo_id) {
                kudos_team_obj.kudos_container.splice(index, 1);
                kudo_exists = true;
            }
        })

        if (kudo_exists) {
            await this.update_kudos_team(team_id, kudos_team_obj);
            this.send_response_message_to_user(response_url, `Kudo with id - ${kudo_id} deleted`)
        } else {
            this.send_response_message_to_user(response_url, `Kudo with id - ${kudo_id} not found`)
        }
    }

    async list_recent_n_kudos(req) {
        const {
            team_id, 
            team_domain, 
            channel_id, 
            channel_name, 
            user_id, 
            user_name, 
            command, 
            text, 
            response_url,
            is_enterprise_install,
        } = req.body;

        const kudo_text_pattern = new RegExp('^(?:[0-9]|[0-9]{2})$');
        
        // check for proper command input formatting
        if (!kudo_text_pattern.test(text)) {
            this.send_response_message_to_user(response_url, `Please follow the formatting rules. Example: /list_kudos 10`);
            return
        }

        const kudos_return_count = parseInt(text);

        if (kudos_return_count > 50) {
            this.send_response_message_to_user(response_url, `Please use a number from 1 - 50`);
            return 
        }

        const kudo_params_to_be_cleaned = [
            team_domain, 
            channel_name, 
            user_name, 
            text
        ]

        kudo_params_to_be_cleaned.forEach((param) => {
            param = this.sanitize(param);
        })

        const kudos_team_obj:CreateKudosDto = await this.find_kudos_team(team_id);
        const kudos_container = kudos_team_obj.kudos_container.slice(0);
        let returned_kudo_arr;
        
        
        if (kudos_return_count >= kudos_container.length) {
            // return all kudo available
            returned_kudo_arr = kudos_container.slice(0);
        } else {
            // return n kudos
            returned_kudo_arr = kudos_team_obj.kudos_container.slice(
                kudos_team_obj.kudos_container.length - kudos_return_count
            )
        }

        let returned_kudo_string = `*${kudos_return_count} Most Recent Kudos*\n\n`;

        returned_kudo_arr.forEach((kudo_obj, index) => {
            returned_kudo_string += 
            `\n\n${index + 1}) _*${kudo_obj.kudo_message}*_
            \n*Recipient* - _${kudo_obj.kudo_recipient_name}_
            \n*Sender* - _${kudo_obj.kudo_sender_name}_
            \n*Date* - _${kudo_obj.created_at}_\n\n=====`
        })

        this.send_response_message_to_user(response_url, returned_kudo_string);
    }

    async send_response_message_to_user(response_url, message: string) {
        const response = firstValueFrom(
            await this.httpService.post(response_url, {
                text: message
            })
        )

        return response;
    }

    async create_kudos_team(createKudosDto: CreateKudosDto) : Promise<IKudos> {
        const new_kudos = new this.kudosModel(createKudosDto);
        return new_kudos.save();
    }

    async find_kudos_team(team_id:string) : Promise<IKudos> {
        const kudos_team_obj = await this.kudosModel.findOne({team_id: team_id}).lean();
        return kudos_team_obj;
    }

    async update_kudos_team(team_id:string, update_obj: object) : Promise<IKudos> {
        const kudos_team_obj = await this.kudosModel.findOneAndUpdate({team_id: team_id}, update_obj, {new: true}).lean();
        return kudos_team_obj;
    }

    sanitize(v) {
        if (v instanceof Object) {
          for (var key in v) {
            if (/^\$/.test(key)) {
              delete v[key];
            } else {
              this.sanitize(v[key]);
            }
          }
        }
        return v;
    };
}

