import { useHistory } from "react-router-dom"
import { useGoogleLogin as useReactGoogleLogin } from "react-google-login"
import { useMutation, gql } from "@apollo/client"
import { toast } from "react-toastify"
import { startLoader } from "components/loader"
import { ConnectYoutubeAccount } from "lib/connect-account"
import { AUTH_TOKEN, GOOGLE_CLIENT_ID } from "lib/keys"
import { trackError, setUser, trackEvent } from "lib/analytics"

type LoginOptions = {
    loginType: "register" | "invite" | "login"
    onAuthCb?: () => void
    inviteToken?: string
}

export function useGoogleLogin(options: LoginOptions) {
    const history = useHistory()

    // create api login mutation function
    const [googleLogin] = useMutation(gql`
        mutation GoogleLogin($token: String!, $inviteToken: String, $youtubeData: [YoutubeInput]) {
            googleLogin(token: $token, inviteToken: $inviteToken, youtubeData: $youtubeData) {
                success
                token
                user {
                    id
                }
            }
        }
    `)

    const onGoogleLoginSuccess = async (googleResp: any) => {
        // get access token from google
        const accessToken = googleResp.accessToken || googleResp.wc.access_token
        if (!accessToken) {
            toast.error("Failed to authenticate with Google")
            return
        }

        // if we're login in, then no need to fetch youtube data
        let stopLoader: any = undefined
        let youtubeData: any = undefined
        if (options.loginType !== "login") {
            // start loader
            stopLoader = startLoader({
                type: "fullscreen",
                message: "Setting up your Beam account.",
            })

            // get youtube subscriptions
            const youtube = new ConnectYoutubeAccount(accessToken)
            youtubeData = await youtube.getSubscriptions()
        }

        const loginResp = await googleLogin({
            variables: {
                token: accessToken,
                inviteToken: options.inviteToken,
                youtubeData,
            },
        })

        const { token, success, message, user } = loginResp.data?.googleLogin

        if (success) {
            // Post login activities
            localStorage.setItem(AUTH_TOKEN, token)
            setUser(user.id)

            stopLoader && stopLoader()
            if (options.onAuthCb) {
                return options.onAuthCb()
            } else {
                // if user is signing in
                return history.push(
                    options.loginType === "login" ? "/app/chats" : "/app/onboarding"
                )
            }
        } else {
            // TODO:: ADD LOGGER
            trackError(`Authentication with Google failed - ${message}`)
            console.log(message)
            toast.dark(`Authentication Failed - ${message}`)
            stopLoader && stopLoader()
        }
    }

    // setup google login action
    const login = useReactGoogleLogin({
        clientId: GOOGLE_CLIENT_ID,
        cookiePolicy: "single_host_origin",
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        fetchBasicProfile: false,
        onSuccess: onGoogleLoginSuccess,
        onFailure: () => trackError("Authentication with react google login failed"),
    })

    return {
        signIn: () => {
            if (login.loaded) {
                login.signIn()
                trackEvent("Authenticate with Google", {
                    label: options.loginType,
                })
            }
        },
        loaded: login.loaded,
    }
}