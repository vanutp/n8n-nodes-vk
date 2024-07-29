export interface IVkGroup {
	id: number;
	name: string;
	screen_name: string;
}

export interface IVkProfile {
	id: number;
	first_name: string;
	last_name: string;
	screen_name: string;
}

interface IPhotoSize {
	height: number;
	width: number;
	type: string;
	url: string;
}

interface IAttachmentPhoto {
	owner_id: number;
	id: number;
	sizes: IPhotoSize[];
	// not in docs
	orig_photo?: IPhotoSize;
}

interface IAttachment {
	type: 'photo' | 'link' | string;
	photo?: IAttachmentPhoto;
}

export interface IWallItem {
	post_type: 'post' | string;
	id: string;
	owner_id: number;
	marked_as_ads: number;
	date: number;
	text: string;
	attachments: IAttachment[];
}

export interface IVkWallGetResponse {
	groups: IVkGroup[];
	profiles: IVkProfile[];
	items: IWallItem[];
}
