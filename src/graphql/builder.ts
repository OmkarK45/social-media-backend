import SchemaBuilder from '@giraphql/core'
import RelayPlugin from '@giraphql/plugin-relay'
import ScopeAuthPlugin from '@giraphql/plugin-scope-auth'
import DataloaderPlugin from '@giraphql/plugin-dataloader'
import ValidationPlugin from '@giraphql/plugin-validation'
import SimpleObjectsPlugin from '@giraphql/plugin-simple-objects'

import { Context } from '~/graphql/context'
import { FileUpload, GraphQLUpload } from 'graphql-upload'
import { prisma } from '~/lib/db'

export const builder = new SchemaBuilder<{
	DefaultInputFieldRequiredness: true
	Context: Context
	Scalars: {
		ID: { Input: string; Output: string | number }
		DateTime: { Input: Date; Output: Date }
		FileUpload: { Input: FileUpload; Output: FileUpload }
	}
	AuthScopes: {
		user: boolean
		unauthenticated: boolean
	}
}>({
	defaultInputFieldRequiredness: true,
	plugins: [
		ScopeAuthPlugin,
		SimpleObjectsPlugin,
		ValidationPlugin,
		DataloaderPlugin,
		RelayPlugin,
	],
	authScopes: async ({ user }) => ({
		user: !!user,
		unauthenticated: !user,
	}),
	relayOptions: {
		nodeQueryOptions: {},
		nodesQueryOptions: {},
		nodeTypeOptions: {},
		pageInfoTypeOptions: {},
	},
})

builder.queryType({})
builder.mutationType({})

builder.scalarType('DateTime', {
	serialize: (date) => date.toISOString(),
	parseValue: (date) => new Date(date),
})

builder.addScalarType('FileUpload', GraphQLUpload, {})
