import User, { IUser } from '@models/users'

const WEIGHT = {
    youtube: 1,
    reddit: 2,
    spotify_genre: 3,
    spotify_artist: 4,
}

const MIN_SCORE = 20
const MIN_POSSIBLE_SCORE = 60

// HELPERS
function getConnectedAccounts(user: IUser) {
    const connectedAccounts = user.connectedAccounts

    if (!connectedAccounts) {
        return null
    }

    return {
        youtube: connectedAccounts.youtube.subscriptions,
        reddit: connectedAccounts.reddit.subreddits,
        spotifyArtists: connectedAccounts.spotify.artists,
        spotifyGenres: connectedAccounts.spotify.genres,
    }
}

// Total score:
function getTotalPossibleScore(user: IUser) {
    const connectedAccounts = getConnectedAccounts(user)
    if (!connectedAccounts) {
        return 0
    }

    const youtubeHighestScore = connectedAccounts.youtube.reduce((a) => a + WEIGHT.youtube, 0)
    const redditHighestScore = connectedAccounts.reddit.reduce((a) => a + WEIGHT.reddit, 0)

    const spotifyGenreHighestScore = connectedAccounts.spotifyGenres.reduce(
        (a) => a + WEIGHT.spotify_genre,
        0
    )
    const spotifyArtistHighestScore = connectedAccounts.spotifyArtists.reduce(
        (a) => a + WEIGHT.spotify_artist,
        0
    )

    return (
        youtubeHighestScore +
        redditHighestScore +
        spotifyGenreHighestScore +
        spotifyArtistHighestScore
    )
}

// FIND SIMILARITIES
function getYoutubeSimilarites(
    user: Array<{ name: string; id: string }>,
    closeUser: Array<{ name: string; id: string }>
): [number, string[]] {
    const sharedInterest: string[] = []

    // scan through subscriptions
    const similarityWeight = user.reduce((simValue, curr) => {
        const similar = closeUser.find((sub) => sub.name.toLowerCase() === curr.name.toLowerCase())

        if (similar) {
            simValue = simValue + WEIGHT.youtube
            sharedInterest.push(curr.name)
        }

        return simValue
    }, 0)

    return [similarityWeight, sharedInterest]
}

function getRedditSimilarites(
    user: Array<{ name: string; id: string }>,
    closeUser: Array<{ name: string; id: string }>
): [number, string[]] {
    const sharedInterest: string[] = []

    const similarityWeight = user.reduce((simValue, curr) => {
        const similar = closeUser.find((sub) => sub.name.toLowerCase() === curr.name.toLowerCase())

        if (similar) {
            simValue = simValue + WEIGHT.reddit
            sharedInterest.push(curr.name)
        }

        return simValue
    }, 0)

    return [similarityWeight, sharedInterest]
}

function getSpotifyGenreSimilarites(user: string[], closeUser: string[]): [number, string[]] {
    const sharedInterest: string[] = []

    const similarityWeight = user.reduce((simValue, curr) => {
        const similar = closeUser.find((sub) => sub.toLowerCase() === curr.toLowerCase())

        if (similar) {
            simValue = simValue + WEIGHT.spotify_genre
            sharedInterest.push(curr)
        }

        return simValue
    }, 0)

    return [similarityWeight, sharedInterest]
}

function getSpotifyArtistSimilarites(
    user: Array<{ name: string; id: string }>,
    closeUser: Array<{ name: string; id: string }>
): [number, string[]] {
    const sharedInterest: string[] = []

    const similarityWeight = user.reduce((simValue, curr) => {
        const similar = closeUser.find((sub) => sub.name.toLowerCase() === curr.name.toLowerCase())

        if (similar) {
            simValue = simValue + WEIGHT.spotify_artist
            sharedInterest.push(curr.name)
        }

        return simValue
    }, 0)

    return [similarityWeight, sharedInterest]
}

export async function findFriends(user: IUser, withLogs = false) {
    const recommendedUsers = []
    const logs: any[] = []

    // get the highest posible score
    const totalPossibleScore = getTotalPossibleScore(user)
    const userConnectedAccounts = getConnectedAccounts(user)
    if (!userConnectedAccounts) {
        return null
    }

    // if highest posible score is too small break early
    if (totalPossibleScore < MIN_POSSIBLE_SCORE) {
        return null
    }

    // get all users who is not in friends
    const closestUsers = await User.find({
        _id: { $ne: user.id, $nin: user.friends },
        // 'profile.location.state': user.profile.location?.state,
    })

    // loop through all close users
    for (const closeUser of closestUsers) {
        const closeUserConnectedAccounts = getConnectedAccounts(closeUser)
        if (!closeUserConnectedAccounts) {
            continue
        }

        // find similarities in youtube
        const [youtubeWeight, youtubeSharedInterest] = getYoutubeSimilarites(
            userConnectedAccounts.youtube,
            closeUserConnectedAccounts.youtube
        )

        // find similarities in reddit
        const [redditWeight, redditSharedInterest] = getRedditSimilarites(
            userConnectedAccounts.reddit,
            closeUserConnectedAccounts.reddit
        )

        // find similarities in spotify genres
        const [spotifyGenreWeight, spotifyGenreInterest] = getSpotifyGenreSimilarites(
            userConnectedAccounts.spotifyGenres,
            closeUserConnectedAccounts.spotifyGenres
        )

        // find similarities in spotify artists
        const [spotifyArtistWeight, spotifyArstisInterest] = getSpotifyArtistSimilarites(
            userConnectedAccounts.spotifyArtists,
            closeUserConnectedAccounts.spotifyArtists
        )

        const totalScore = youtubeWeight + redditWeight + spotifyGenreWeight + spotifyArtistWeight
        const normalizedScore = Math.round((totalScore / totalPossibleScore) * 100)
        const sharedInterests = [
            ...youtubeSharedInterest.map((interest) => ({
                name: interest,
                platform: 'youtube',
            })),

            ...redditSharedInterest.map((interest) => ({
                name: interest,
                platform: 'reddit',
            })),

            ...spotifyGenreInterest.map((interest) => ({
                name: interest,
                platform: 'spotify_genre',
            })),

            ...spotifyArstisInterest.map((interest) => ({
                name: interest,
                platform: 'spotify_artist',
            })),
        ]

        if (normalizedScore >= MIN_SCORE) {
            recommendedUsers.push({
                normalizedScore,
                friend: closeUser,
                sharedInterests,
            })
        }

        if (withLogs) {
            logs.push({
                user: closeUser.email,
                totalScore,
                normalizedScore,
                youtubeSharedInterest,
                redditSharedInterest,
                spotifyGenreInterest,
                spotifyArstisInterest,
                totalNumberOfInterest: sharedInterests.length,
            })
        }
    }

    if (withLogs) {
        console.log(logs)
    }

    // sort based on score
    return recommendedUsers.sort((a, b) => {
        if (a.normalizedScore < b.normalizedScore) return 1
        if (a.normalizedScore > b.normalizedScore) return -1
        return 0
    })[0]
}
