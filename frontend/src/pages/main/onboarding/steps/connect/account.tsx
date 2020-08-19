import React, { useState } from "react"
import cls from "classnames"
import { useConnectAccount } from "lib/connectAccounts"
import { trackUserEvent } from "lib/GA"

type IProps = {
    account: "youtube" | "reddit" | "spotify"
    onConnect: () => void
    isConnected: boolean
}

export function Account(props: IProps) {
    const [loading, setLoading] = useState(false)

    const connectAccount = useConnectAccount(props.account, () => {
        props.onConnect()
        setLoading(false)
        trackUserEvent(`Connected ${props.account} account`, "onboarding")
    })

    const onConnect = () => {
        connectAccount()
        setLoading(true)
        trackUserEvent(`Connect ${props.account} account`, "onboarding")
    }

    return (
        <article
            onClick={onConnect}
            className={cls("account", props.account, {
                disabled: props.isConnected,
                loading,
            })}
        >
            {loading ? (
                <div className="loader" />
            ) : (
                <img
                    alt=""
                    src={
                        props.isConnected
                            ? require("assets/images/tick.png")
                            : require("assets/images/plus.png")
                    }
                />
            )}

            <div className="account-details">
                <p className="account-type">
                    {props.account === "youtube" &&
                        (props.isConnected ? "YouTube connected" : "Connect Youtube")}

                    {props.account === "spotify" &&
                        (props.isConnected ? "Spotify connected" : "Connect Spotify")}

                    {props.account === "reddit" &&
                        (props.isConnected ? "Reddit connected" : "Connect Reddit")}
                </p>

                <p>
                    {props.account === "youtube" &&
                        (props.isConnected
                            ? "We've scanned your subscriptions"
                            : "We scan your subscriptions")}

                    {props.account === "spotify" &&
                        (props.isConnected
                            ? "We've scanned your genre and top artists"
                            : "We scan your genre and top artists")}

                    {props.account === "reddit" &&
                        (props.isConnected
                            ? "We've scanned your subreddits"
                            : "We scan your subreddits")}
                </p>
            </div>
        </article>
    )
}
