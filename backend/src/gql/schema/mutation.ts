import { gql } from 'apollo-server-express'

export const mutationTypeDefs = gql`
    # INPUTS
    input YoutubeInput {
        name: String!
        id: String!
        image: String
    }

    input RedditInput {
        name: String!
        id: String!
    }

    input ArtistsInput {
        name: String!
        id: String!
    }

    input ConnectAccountInput {
        account: ConnectedAccountType!

        # if it's youtube we need subs
        subs: [YoutubeInput]

        # if it's reddit we need subreddits
        subreddits: [RedditInput]

        # if it's spotify we need artists and genres
        artists: [ArtistsInput]
        genres: [String]
    }

    input LocationInput {
        lat: Float
        long: Float
    }

    # MUTATIONS
    type LoginMutationResponse {
        code: String!
        success: Boolean!
        message: String
        token: String
        user: User
    }

    type SendMessageMutationResponse {
        code: String!
        success: Boolean!
        message: String
        sentMessage: Message
    }

    type AddFriendMutationResponse {
        code: String!
        success: Boolean!
        message: String
    }

    type Mutation {
        # AUTH
        googleLogin(
            token: String!
            inviteToken: String
            youtubeData: [YoutubeInput]
        ): LoginMutationResponse
        facebookLogin(token: String!, inviteToken: String): LoginMutationResponse

        # USER
        connectAccount(input: ConnectAccountInput): Boolean
        disconnectAccount(account: String!): Boolean
        setLocation(location: LocationInput): Boolean
        createInviteLink: String
        addFriend(inviteToken: String!): AddFriendMutationResponse
        addFriendById(friendId: ID!): Boolean

        # MESSAGING
        sendMessage(to: ID!, message: String!): SendMessageMutationResponse
    }
`
