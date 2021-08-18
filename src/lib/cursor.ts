const DEFAULT_SIZE = 10

interface ConnectionArgs {
	after?: string | null
	before?: string | null
	first?: number | null
	last?: number | null
}

function resolveSize(args: ConnectionArgs) {
	if (args.after) {
		if (!args.first) {
			throw new Error('Must provide `first` with `after`.')
		}
		return args.first
	}

	if (args.before) {
		if (!args.last) {
			throw new Error('Must provide `last` with `before`')
		}
		return args.last
	}

	return args.first ?? args.last ?? DEFAULT_SIZE
}

export function connectionForPrisma<T extends string>(
	args: ConnectionArgs,
	orderBy: T
) {
	const take = resolveSize(args)
	const cursor = args.after ?? args.before

	return {
		// NOTE : we fetch +1 here to determine if there's another page
		take: take + 1,
		skip: cursor ? 1 : 0,
		cursor: cursor ? { id: cursor } : undefined,
		orderBy: [
			{
				[orderBy]: args.last ? ('asc' as const) : ('desc' as const),
			},
			{
				id: 'desc' as const,
			},
		],
	}
}

/**
 * usage
 * const foo = prisma.something.findMany({
   where : {something },
   ...connectionForPrisma(args, 'createdAt')
})
return resolveConnection(foo, args)
 * */

export function resolveConnection<T extends { id: string }>(
	array: T[],
	args: ConnectionArgs
) {
	const expectedSize = resolveSize(args)

	const nodes = array.slice(0, expectedSize)

	const edges = nodes.map((value) =>
		value == null
			? null
			: {
					node: value,
			  }
	)
	return { edges }
}
