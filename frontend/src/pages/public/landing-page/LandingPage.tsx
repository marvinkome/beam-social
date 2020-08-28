import React from "react"
import cls from "classnames"
import { Navbar } from "../components/Navbar"
import { FaCheck } from "react-icons/fa"
import { useGoogleLogin } from "lib/hooks"
import { Footer } from "../components/Footer"
import { trackEvent } from "lib/analytics"
import "./LandingPage.scss"

export function LandingPageView(props: { onRegister: () => void }) {
    const { signIn, loaded } = useGoogleLogin(props.onRegister)
    const signUp = (type: string) => {
        signIn()
        trackEvent("Sign up with CTA button", { category: "Auth", label: type })
    }

    return (
        <div className="landing-page">
            <div className="header-container">
                <Navbar />

                <div className="header-grid">
                    <div className="text-grid">
                        <h1>Meet local friends you’ll spend hours chatting with</h1>

                        <div className="check-list">
                            <div className="check">
                                <FaCheck className="icon" />
                                <p>Join local groups for your YouTube channels</p>
                            </div>

                            <div className="check">
                                <FaCheck className="icon" />
                                <p>Find friends nearby who share your interests</p>
                            </div>

                            <div className="check">
                                <FaCheck className="icon" />
                                <p>No Ads</p>
                            </div>

                            <div className="check">
                                <FaCheck className="icon" />
                                <p>No blue theme</p>
                            </div>
                        </div>

                        <button
                            onClick={() => signUp("header")}
                            className={cls("btn btn-primary", { disabled: !loaded })}
                        >
                            Sign up with Google
                        </button>
                    </div>

                    <div className="image-grid">
                        <img
                            alt="Mobile screenshot of beam"
                            src={require("assets/images/screenshot.png")}
                        ></img>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
