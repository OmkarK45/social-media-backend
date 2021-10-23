import { NotificationType } from '@prisma/client'
import { builder } from '~/graphql/builder'
import { prisma } from '~/lib/db'

builder.prismaObject('Notification', {
	findUnique: (notification) => ({ id: notification.id }),
	fields: (t) => ({
		id: t.exposeID('id'),
		type: t.exposeString('type'),
		receiver: t.relation('receiver'),
		dispatcher: t.relation('dispatcher'),
		post: t.relation('post', { nullable: true }),
		like: t.relation('like', { nullable: true }),
		createdAt: t.expose('createdAt', { type: 'DateTime' }),
		updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
	}),
})

builder.queryField('notifications', (t) =>
	t.prismaConnection({
		type: 'Notification',
		cursor: 'id',
		args: { isRead: t.arg.boolean({ defaultValue: false }) },
		resolve: async (query, parent, { isRead }, { user }) => {
			return await prisma.notification.findMany({
				...query,
				where: {
					receiver: { id: user?.id },
					isRead,
				},
				orderBy: { createdAt: 'desc' },
			})
		},
	})
)

interface CreateNotificationOptions {
	type: NotificationType
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
