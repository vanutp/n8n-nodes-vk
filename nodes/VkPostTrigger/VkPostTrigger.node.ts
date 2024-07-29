import {
	IBinaryKeyData,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	JsonObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';
import { IVkGroup, IVkProfile, IVkWallGetResponse, IWallItem } from './IVkWallGetResponse';
import { Buffer } from 'buffer';
import { IVkPostTriggerResult, IVkTriggerResultAttachment } from './IVkPostTriggerResult'

export class VkPostTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VK Post Trigger',
		name: 'vkPostTrigger',
		icon: 'file:vk.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow on new VK posts',
		subtitle: '={{$parameter["event"]}}',
		defaults: {
			name: 'VK Post Trigger',
		},
		credentials: [
			{
				name: 'vkApi',
				required: true,
			},
		],
		polling: true,
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Sources',
				name: 'sources',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add source',
				default: {
					meow: [
						{
							ownerId: '',
						},
					],
				},
				required: true,
				options: [
					{
						name: 'meow',
						displayName: 'Meow',
						values: [
							{
								displayName: 'Owner ID',
								description: 'The group ID to get posts from',
								name: 'ownerId',
								type: 'string',
								default: '',
								required: true,
							},
						],
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const param = this.getNodeParameter('sources', { meow: [] }) as {
			meow: { ownerId: string }[];
		};
		const ownerIds = param.meow.map((x) => x.ownerId);
		const nodeData = this.getWorkflowStaticData('node');
		const lastPostById = (nodeData.lastPostById || {}) as IDataObject;
		const node = this.getNode();

		const posts: { json: IVkPostTriggerResult; binary: IBinaryKeyData }[] = [];

		for (const ownerId of ownerIds) {
			const resp = await this.helpers.requestWithAuthentication.call(this, 'vkApi', {
				url: 'https://api.vk.com/method/wall.get',
				qs: {
					owner_id: ownerId,
					extended: 1,
					v: '5.199',
				},
				json: true,
			});
			if (resp.error) {
				throw new NodeApiError(node, resp.error as JsonObject, {
					message: resp.error.error_msg,
				});
			}
			const data = resp.response as IVkWallGetResponse;
			data.items = data.items.filter((post) => post.post_type == 'post');

			function getOwnerData(post: IWallItem): {
				id: number;
				name: string;
				link: string;
				profile?: IVkProfile;
				group?: IVkGroup;
			} {
				if (post.owner_id < 0) {
					const group = data.groups.find((g) => g.id == -post.owner_id);
					if (!group) {
						throw new NodeOperationError(
							node,
							`Unable to find owner for post ${post.owner_id}_${post.id}`,
						);
					}
					return {
						group,
						id: post.owner_id,
						name: group.name,
						link: 'https://vk.com/' + (group.screen_name || `public${group.id}`)
					};
				} else {
					const profile = data.profiles.find((p) => p.id == post.owner_id);
					if (!profile) {
						throw new NodeOperationError(
							node,
							`Unable to find owner for post ${post.owner_id}_${post.id}`,
						);
					}
					return {
						profile: profile,
						id: post.owner_id,
						name: profile.first_name + ' ' + profile.last_name,
						link: 'https://vk.com/' + (profile.screen_name || `id${profile.id}`)
					};
				}
			}

			for (const post of data.items) {
				const attachmentFiles: IBinaryKeyData = {};
				const attachments: IVkTriggerResultAttachment[] = [];

				if (lastPostById[ownerId] == post.id) {
					break;
				}

				let text = post.text;

				for (const attachment of post.attachments) {
					if (attachment.type == 'link') {
						continue;
					}
					if (attachment.type != 'photo') {
						text += `\n\nUnsupported attachment type "${attachment.type}"`;
						continue;
					}
					const photo = attachment.photo!;
					const size =
						photo.orig_photo ??
						photo.sizes.reduce((res, curr) => (curr.width > res.width ? curr : res), {
							width: 0,
							type: '',
							height: 0,
							url: '',
						});
					if (!size.url) {
						throw new NodeOperationError(
							node,
							`Failed to find photo size for post id ${post.owner_id}_${post.id}`,
						);
					}

					const photoResponse = await this.helpers.request({
						url: size.url,
						encoding: null,
						resolveWithFullResponse: true,
					});
					const data = Buffer.from(photoResponse.body as string);
					const fileName = size.url.split('/').pop();
					const attachmentId = `${photo.owner_id}_${photo.id}`;
					attachmentFiles[attachmentId] = await this.helpers.prepareBinaryData(data, fileName);
					attachments.push({
						id: attachmentId,
						url: size.url,
					})
				}

				posts.push({
					json: {
						owner: getOwnerData(post),
						date: post.date,
						text,
						attachments,
					},
					binary: attachmentFiles,
				});
				if (!lastPostById[ownerId]) {
					break;
				}
			}

			if (data.items.length > 0) {
				lastPostById[ownerId] = data.items[0].id;
			}
		}

		nodeData.lastPostById = lastPostById;

		return [posts.map((post) =>
			({ json: post.json as unknown as IDataObject, binary: post.binary })
		)];
	}
}
