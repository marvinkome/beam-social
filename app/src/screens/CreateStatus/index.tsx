import React from "react"
import { useNavigation } from "@react-navigation/native"
import { StyleSheet, View } from "react-native"
import { Icon } from "react-native-elements"
import { TextStatus } from "./Text"

export function CreateStatus() {
    const { goBack } = useNavigation()

    return (
        <View style={styles.container}>
            <Icon
                onPress={goBack}
                containerStyle={styles.closeIconContainer}
                name="close"
                type="ionicons"
            />

            <TextStatus />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    closeIconContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        paddingVertical: 25,
        paddingHorizontal: 15,
        zIndex: 10,
    },
})
