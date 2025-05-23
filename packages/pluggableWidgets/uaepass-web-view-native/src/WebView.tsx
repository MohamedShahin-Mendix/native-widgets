import { flattenStyles } from "@mendix/piw-native-utils-internal";
import { Component, createElement } from "react";
import { Text, View, Linking } from "react-native";
import { WebView as RNWebView } from "react-native-webview";

import { WebViewProps } from "../typings/WebViewProps";
import { defaultWebViewStyle, WebViewStyle } from "./ui/Styles";
import { executeAction } from "@mendix/piw-utils-internal";

export type Props = WebViewProps<WebViewStyle>;

export class UAEPASSWebView extends Component<Props> {
    private readonly onLoadHandler = this.onLoad.bind(this);
    private readonly onErrorHandler = this.onError.bind(this);
    private readonly onMessageHandler = this.onMessage.bind(this);
    private readonly styles = flattenStyles(defaultWebViewStyle, this.props.style);

    render(): JSX.Element {
        const uri = this.props.url && this.props.url.value;
        const html = this.props.content && this.props.content.value;

        if (!uri && !html) {
            return (
                <View style={this.styles.errorContainer} testID={this.props.name}>
                    <Text style={this.styles.errorText}>No URL or content was provided.</Text>
                </View>
            );
        }

        return (
            <View style={this.styles.container} testID={this.props.name}>
                <RNWebView
                    source={html ? { html } : { uri: uri! }}
                    style={{
                        width: "100%",
                        height: "100%"
                    }}
                    onLoad={this.onLoadHandler}
                    onError={this.onErrorHandler}
                    onMessage={event => {
                        this.onMessageHandler(event.nativeEvent.data);
                    }}
                    userAgent={this.props.userAgent}
                    onShouldStartLoadWithRequest={({ url }) => {
                        const sanitizedUrl = UAEPASSWebView.sanitize(url);
                        const openExternally =
                            this.props.openLinksExternally &&
                            (html ? sanitizedUrl.startsWith("http") : uri && sanitizedUrl !== UAEPASSWebView.sanitize(uri));
                        if (openExternally) {
                            Linking.openURL(url);
                            return false;
                        }
                        return true;
                    }}
                />
            </View>
        );
    }

    private onLoad(): void {
        executeAction(this.props.onLoad);
    }

    private onError(): void {
        executeAction(this.props.onError);
    }

    private onMessage(input: string): void {
        this.props.onMessageInput?.setTextValue(input);
        executeAction(this.props.onMessage);
    }

    private static sanitize(url: string): string {
        return url.toLowerCase().replace(/\/$/, "");
    }
}
