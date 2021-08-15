/**
 * This code is not written by me.
 * I'm experimenting with good pagination approaches
 */
const toCursor = (id: number | string) =>
	Buffer.from(id.toString()).toString('base64')

const fromCursor = (cursor: string) =>
	Buffer.from(cursor, 'base64').toString('ascii')

export const connectionResolver = async (
	{ first, last, before = '', after = '', ...args }: any,
	model: any
) => {
	if (first && last) {
		throw new Error(
			'The first and last parameters cannot be passed at the same time'
		)
	}
	const edges = []
	const afterCursor = fromCursor(after)
	const beforeCursor = fromCursor(before)
	const where = {
		...(afterCursor ? { id: { gt: afterCursor } } : {}),
		...(beforeCursor ? { id: { lt: beforeCursor } } : {}),
		...(Object.keys(args).length ? args : {}),
	}
	const condition = {
		where,
		take: first || -last,
	}
	const nodes = await model.findMany(condition)
	for (let i = 0; i < nodes.length; i += 1) {
		const node = nodes[i]
		edges.push({
			cursor: toCursor(node.id),
			node,
		})
	}
	const startCursor = edges.length > 0 ? edges[0].cursor : ''
	const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : ''
	let hasPrevPage = false
	let hasNextPage = false
	if (startCursor) {
		const startCursorDecode = fromCursor(startCursor)
		const count = await model.count({
			where: {
				id: {
					lt: startCursorDecode,
				},
			},
		})
		hasPrevPage = count > 0
	}
	if (endCursor) {
		const endCursorDecode = fromCursor(endCursor)
		const count = await model.count({
			where: {
				id: {
					gt: endCursorDecode,
				},
			},
		})
		hasNextPage = count > 0
	}

	const totalCount = await model.count({ where })
	return {
		edges,
		nodes,
		totalCount,
		pageInfo: {
			startCursor,
			endCursor,
			hasPrevPage,
			hasNextPage,
		},
	}
}
