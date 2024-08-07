import { IVkGroup, IVkProfile } from './IVkWallGetResponse';

export interface IVkTriggerResultAttachment {
	id: string;
	type: 'photo' | 'video';
	url: string;
}

export interface IVkPostTriggerResult {
	owner: {
		id: number;
		name: string;
		link: string;
		profile?: IVkProfile;
		group?: IVkGroup;
	};
	date: number;
	text: string;
	attachments: IVkTriggerResultAttachment[];
	id: number;
	link: string;
}
