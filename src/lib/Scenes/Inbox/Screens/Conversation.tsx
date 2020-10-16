import NetInfo from "@react-native-community/netinfo"
import { Conversation_me } from "__generated__/Conversation_me.graphql"
import { ConversationQuery } from "__generated__/ConversationQuery.graphql"
import ConnectivityBanner from "lib/Components/ConnectivityBanner"
import { defaultEnvironment } from "lib/relay/createEnvironment"
import Composer from "lib/Scenes/Inbox/Components/Conversations/Composer"
import Messages from "lib/Scenes/Inbox/Components/Conversations/Messages"
import { sendConversationMessage } from "lib/Scenes/Inbox/Components/Conversations/SendConversationMessage"
import { updateConversation } from "lib/Scenes/Inbox/Components/Conversations/UpdateConversation"
import { AppStore } from "lib/store/AppStore"
import renderWithLoadProgress from "lib/utils/renderWithLoadProgress"
import { Schema, Track, track as _track } from "lib/utils/track"
import { color, Flex, Text, Touchable } from "palette"
import React from "react"
import { View } from "react-native"
import NavigatorIOS from "react-native-navigator-ios"
import Svg, { Path } from "react-native-svg"
import { createFragmentContainer, graphql, QueryRenderer, RelayProp } from "react-relay"
import styled from "styled-components/native"
import { ConversationDetailsQueryRenderer } from "./ConversationDetails"

const Container = styled.View`
  flex: 1;
  flex-direction: column;
`
const Header = styled.View`
  align-self: stretch;
  margin-top: 22px;
  flex-direction: column;
  margin-bottom: 18px;
`

// This makes it really easy to style the HeaderTextContainer with space-between
const PlaceholderView = View

const HeaderTextContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  flex-grow: 1;
`

interface Props {
  me: Conversation_me
  relay: RelayProp
  onMessageSent?: (text: string) => void
  navigator: NavigatorIOS
}

interface State {
  sendingMessage: boolean
  isConnected: boolean
  markedMessageAsRead: boolean
  fetchingData: boolean
  failedMessageText: string | null
}

// @ts-ignore STRICTNESS_MIGRATION
const track: Track<Props, State> = _track

@track()
export class Conversation extends React.Component<Props, State> {
  // @ts-ignore STRICTNESS_MIGRATION
  messages: MessagesComponent
  // @ts-ignore STRICTNESS_MIGRATION
  composer: Composer

  // Assume if the component loads, connection exists (this way the banner won't flash unnecessarily)
  state = {
    sendingMessage: false,
    isConnected: true,
    markedMessageAsRead: false,
    fetchingData: false,
    failedMessageText: null,
  }

  componentDidMount() {
    NetInfo.isConnected.addEventListener("connectionChange", this.handleConnectivityChange)
    this.maybeMarkLastMessageAsRead()
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener("connectionChange", this.handleConnectivityChange)
  }

  // @ts-ignore STRICTNESS_MIGRATION
  handleConnectivityChange = (isConnected) => {
    this.setState({ isConnected })
  }

  maybeMarkLastMessageAsRead() {
    const conversation = this.props.me.conversation
    if (conversation?.unread && !this.state.markedMessageAsRead) {
      updateConversation(
        this.props.relay.environment,
        // @ts-ignore STRICTNESS_MIGRATION
        conversation,
        // @ts-ignore STRICTNESS_MIGRATION
        conversation.lastMessageID,
        // @ts-ignore STRICTNESS_MIGRATION
        (_response) => {
          this.setState({ markedMessageAsRead: true })
          AppStore.actions.bottomTabs.fetchCurrentUnreadConversationCount()
        },
        // @ts-ignore STRICTNESS_MIGRATION
        (error) => {
          console.warn(error)
          this.setState({ markedMessageAsRead: true })
          AppStore.actions.bottomTabs.fetchCurrentUnreadConversationCount()
        }
      )
    }
  }

  // @ts-ignore STRICTNESS_MIGRATION
  @track((props) => ({
    action_type: Schema.ActionTypes.Success,
    action_name: Schema.ActionNames.ConversationSendReply,
    // @ts-ignore STRICTNESS_MIGRATION
    owner_id: props.me.conversation.internalID,
    owner_type: Schema.OwnerEntityTypes.Conversation,
  }))
  messageSuccessfullySent(text: string) {
    this.setState({ sendingMessage: false })

    if (this.props.onMessageSent) {
      this.props.onMessageSent(text)
    }
  }

  // @ts-ignore STRICTNESS_MIGRATION
  @track((props) => ({
    action_type: Schema.ActionTypes.Fail,
    action_name: Schema.ActionNames.ConversationSendReply,
    // @ts-ignore STRICTNESS_MIGRATION
    owner_id: props.me.conversation.internalID,
    owner_type: Schema.OwnerEntityTypes.Conversation,
  }))
  messageFailedToSend(error: Error, text: string) {
    console.warn(error)
    this.setState({ sendingMessage: false, failedMessageText: text })
  }

  render() {
    const conversation = this.props.me.conversation
    // @ts-ignore STRICTNESS_MIGRATION
    const partnerName = conversation.to.name

    return (
      <Composer
        disabled={this.state.sendingMessage || !this.state.isConnected}
        // @ts-ignore STRICTNESS_MIGRATION
        ref={(composer) => (this.composer = composer)}
        // @ts-ignore STRICTNESS_MIGRATION
        value={this.state.failedMessageText}
        onSubmit={(text) => {
          this.setState({ sendingMessage: true, failedMessageText: null })
          sendConversationMessage(
            this.props.relay.environment,
            // @ts-ignore STRICTNESS_MIGRATION
            conversation,
            text,
            // @ts-ignore STRICTNESS_MIGRATION
            (_response) => {
              this.messageSuccessfullySent(text)
            },
            // @ts-ignore STRICTNESS_MIGRATION
            (error) => {
              this.messageFailedToSend(error, text)
            }
          )
          this.messages.scrollToLastMessage()
        }}
      >
        <Container>
          <Header>
            <Flex flexDirection="row" alignSelf="stretch" mx={2}>
              <HeaderTextContainer>
                <Text variant="mediumText">{partnerName}</Text>
                <PlaceholderView />
              </HeaderTextContainer>
              <Touchable
                onPress={() => {
                  this.props.navigator.push({
                    component: ConversationDetailsQueryRenderer,
                    title: "",
                    passProps: {
                      conversationID: this.props.me?.conversation?.internalID,
                    },
                  })
                }}
              >
                <Svg width={28} height={28} viewBox="0 0 28 28">
                  <Path
                    d="M6.5 21.5V6.5H16L16 21.5H6.5ZM17.5 21.5H21.5V6.5H17.5L17.5 21.5ZM5 5.5C5 5.22386 5.22386 5 5.5 5H22.5C22.7761 5 23 5.22386 23 5.5V22.5C23 22.7761 22.7761 23 22.5 23H5.5C5.22386 23 5 22.7761 5 22.5V5.5Z"
                    fill={color("black100")}
                    fillRule="evenodd"
                  />
                </Svg>
              </Touchable>
            </Flex>
          </Header>
          {!this.state.isConnected && <ConnectivityBanner />}
          <Messages
            componentRef={(messages) => (this.messages = messages)}
            conversation={conversation as any}
            onDataFetching={(loading) => {
              this.setState({ fetchingData: loading })
            }}
          />
        </Container>
      </Composer>
    )
  }
}

export const ConversationFragmentContainer = createFragmentContainer(Conversation, {
  me: graphql`
    fragment Conversation_me on Me {
      conversation(id: $conversationID) {
        internalID
        id
        lastMessageID
        unread
        to {
          name
        }
        from {
          email
        }
        ...Messages_conversation
      }
    }
  `,
})

export const ConversationQueryRenderer: React.FC<{
  conversationID: string
  navigator: NavigatorIOS
}> = (props) => {
  const { conversationID, navigator } = props
  return (
    <QueryRenderer<ConversationQuery>
      environment={defaultEnvironment}
      query={graphql`
        query ConversationQuery($conversationID: String!) {
          me {
            ...Conversation_me
          }
        }
      `}
      variables={{
        conversationID,
      }}
      render={renderWithLoadProgress(ConversationFragmentContainer, { navigator })}
    />
  )
}