import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'

import { schema } from './graphql/schema'
import { makeGraphQLContext } from './graphql/context'

export const apolloServer = async () => {
	return new ApolloServer({
		plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
		schema,
		context: makeGraphQLContext,
		introspection: true,
	})
}
