import { IVkGroup, IVkProfile } from './IVkWallGetResponse';

export interface IVkTriggerResultAttachment {
	id: string;
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
}
