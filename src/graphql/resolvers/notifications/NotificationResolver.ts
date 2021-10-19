import {
	NodeType,
	Notification,
	NotificationType as PrismaNotificationType,
} from '@prisma/client'
import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'
import { getConnection } from '~/lib/page'
import { PostObject } from '../post/PostResolver'
import { UserObject } from '../user/UserResolver'

const NotificationObject = builder.objectRef<Notification>('Notification')

builder.node(NotificationObject, {
	isTypeOf: (value) =>
		(value as { nodeType?: NodeType }).nodeType === NodeType.Notification,
	id: { resolve: (notification) => notification.id },
	fields: (t) => ({
		isRead: t.exposeBoolean('isRead'),
		message: t.exposeString('message', { nullable: true }),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
		type: t.exposeString('type'),
		receiver: t.field({
			type: UserObject,
			resolve: async ({ receiverId }) => {
				const user = await prisma.user.findUnique({
					where: { id: receiverId },
					rejectOnNotFound: true,
				})
				return user
			},
		}),
		dispatcher: t.field({
			type: UserObject,
			resolve: async ({ dispatcherId }) => {
				const user = await prisma.user.findUnique({
					where: { id: dispatcherId },
					rejectOnNotFound: true,
				})
				return user
			},
		}),
		post: t.field({
			type: PostObject,
			resolve: async ({ postId }) => {
				const post = await prisma.post.findUnique({
					where: { id: postId! },
					rejectOnNotFound: true,
				})
				return post
			},
		}),
		like: t.field({
			type: UserObject,
			resolve: async ({ likeId }) => {
				const like = await prisma.like.findUnique({
					where: { id: likeId! },
					include: { user: true },
					rejectOnNotFound: true,
				})
				return like?.user
			},
		}),
	}),
})

builder.queryField('notifications', (t) =>
	t.field({
		type: [NotificationObject],
		args: { isRead: t.arg.boolean({ defaultValue: false }) },
		resolve: async (_root, { isRead }, { user }) => {
			const notifications = await prisma.notification.findMany({
				where: {
					receiver: {
						id: user?.id,
					},
					isRead,
				},
				orderBy: { createdAt: 'desc' },
			})
			return notifications
		},
	})
)

interface CreateNotificationOptions {
	type: PrismaNotificationType
	dispatcherId: string
	receiverId: string
	entityId: string
}

export async function createNotification({
	type,
	dispatcherId,
	receiverId,
	entityId,
}: CreateNotificationOptions) {
	const notification = await prisma.notification.upsert({
		where: { entityId },
		update: { isRead: false },
		create: {
			dispatcher: { connect: { id: dispatcherId } },
			receiver: { connect: { id: receiverId } },
			like: type === 'POST_LIKE' ? { connect: { id: entityId } } : undefined,
			post: type === 'POST_REPLY' ? { connect: { id: entityId } } : undefined,
			entityId,
			type,
		},
	})
	return notification
}
