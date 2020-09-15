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
                    email
                    createdAt
                }
            }
        }
    `)

    const onGoogleLoginSuccess = async (googleResp: any) => {
        // get access token from google
        const accessToken = googleResp.accessToken || googleResp.wc.access_token
        if (!accessToken) {
            toast.dark("Failed to authenticate with Google")
            trackError(`Authentication with Google failed - Access token not found`)
            return
        }

        // if we're login in, then no need to fetch youtube data
        let stopLoader: any = undefined
        let youtubeData: any = undefined
        if (options.loginType !== "login") {
            // start loader
            stopLoader = startLoader("fullscreen", "Setting up your Beam account.")

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
            setUser(user.id, {
                $email: user.email,
                signUpDate: new Date(parseInt(user.createdAt, 10)).toISOString(),
            })

            stopLoader && stopLoader()

            if (options.loginType !== "login") {
                trackEvent("Connected Youtube Account", {
                    category: "Connect",
                    label: "Auth",
                })
            }

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
            trackError(`User auth failed - ${message}`)
            console.log(message)
            toast.dark(`Error signing up - ${message}`)
            stopLoader && stopLoader()
        }
    }

    // setup google login action
    const login = useReactGoogleLogin({
        clientId: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/youtube.readonly",
        onSuccess: onGoogleLoginSuccess,
        onFailure: (resp) => {
            console.error(resp)
            switch (resp.error) {
                case "popup_closed_by_user":
                    toast.dark("Please complete sign up before closing the tab")
                    break
                case "access_denied":
                    toast.dark("You need to give access to continue on Beam")
                    break
            }

            trackError(`Google auth failed - ${resp.error}`)
        },
    })

    return {
        signIn: () => {
            login.signIn()
            trackEvent(`clicked on google auth for - ${options.loginType}`, {
                category: "Auth",
                label: options.loginType,
            })
        },
        loaded: login.loaded,
    }
}
