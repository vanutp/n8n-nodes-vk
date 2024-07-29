import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class VkApi implements ICredentialType {
	name = 'vkApi';
	displayName = 'VK API';
	documentationUrl = 'https://dev.vk.com/ru/api/access-token/getting-started';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.accessToken}}',
			},
		},
	};
}
