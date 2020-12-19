import { ActionType } from "@artsy/cohesion"
import { Inbox_me } from "__generated__/Inbox_me.graphql"
import { InboxQuery } from "__generated__/InboxQuery.graphql"
import { CssTransition } from "lib/Components/Bidding/Components/Animation/CssTransition"
import { defaultEnvironment } from "lib/relay/createEnvironment"
import { ConversationsContainer } from "lib/Scenes/Inbox/Components/Conversations/Conversations"
import { MyBidsContainer } from "lib/Scenes/MyBids/MyBids"
import { listenToNativeEvents } from "lib/store/NativeModel"
import renderWithLoadProgress from "lib/utils/renderWithLoadProgress"
import { track } from "lib/utils/track"
import { ActionNames, ActionTypes } from "lib/utils/track/schema"
import { Flex, Separator, Text } from "palette"
import React from "react"
import { EmitterSubscription, LayoutChangeEvent, View, ViewProps } from "react-native"
// @ts-expect-error @types file generates duplicate declaration problems
import ScrollableTabView, { TabBarProps } from "react-native-scrollable-tab-view"
import { createRefetchContainer, graphql, QueryRenderer, RelayRefetchProp } from "react-relay"

// Tabs
interface TabWrapperProps extends ViewProps {
  tabLabel: string
}

const TabWrapper: React.FC<TabWrapperProps> = (props) => <View {...props} />

const InboxTabs: React.FC<TabBarProps> = (props) => (
  <>
    <Flex flexDirection="row" px={1.5} mb={2}>
      {props.tabs?.map((name: JSX.Element, page: number) => {
        const isTabActive = props.activeTab === page
        return (
          <CssTransition
            style={[{ opacity: isTabActive ? 1 : 0.3 }]}
            animate={["opacity"]}
            duration={200}
            key={`inbox-tab-${name}`}
          >
            <Text
              mr={2}
              color="black100"
              variant="largeTitle"
              onPress={() => {
                if (!!props.goToPage) {
                  props.goToPage(page)
                }
              }}
            >
              {name}
            </Text>
          </CssTransition>
        )
      })}
    </Flex>
    <Separator />
  </>
)

enum Tab {
  bids = "bids",
  inquiries = "inquiries",
}
// Inbox
interface State {
  fetchingData: boolean
  activeTab: Tab
}

interface Props {
  me: Inbox_me
  relay: RelayRefetchProp
  isVisible: boolean
}

@track()
export class Inbox extends React.Component<Props, State> {
  // @ts-ignore STRICTNESS_MIGRATION
  conversations: ConversationsRef

  // @ts-ignore STRICTNESS_MIGRATION
  myBids: MyBidsRef

  state = {
    fetchingData: false,
    activeTab: Tab.bids,
  }

  scrollViewVerticalStart = 0

  listener: EmitterSubscription | null = null

  flatListHeight = 0

  componentDidMount() {
    this.listener = listenToNativeEvents((event) => {
      if (event.type === "NOTIFICATION_RECEIVED") {
        this.fetchData()
      }
    })
  }

  componentWillUnmount() {
    this.listener?.remove()
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    if (newProps.isVisible) {
      this.fetchData()
    }
  }

  fetchData = () => {
    if (this.state.fetchingData) {
      return
    }

    this.setState({ fetchingData: true })

    if (this.conversations) {
      this.conversations.refreshConversations(() => {
        this.setState({ fetchingData: false })
      })
    } else if (this.myBids) {
      this.myBids.refreshMyBids(() => {
        this.setState({ fetchingData: false })
      })
    } else {
      this.props.relay.refetch({}, null, () => {
        this.setState({ fetchingData: false })
      })
    }
  }

  onScrollableTabViewLayout = (layout: LayoutChangeEvent) => {
    this.scrollViewVerticalStart = layout.nativeEvent.layout.y
  }

  @track((_props, _state, args) => {
    const index = args[0]
    const tabs = ["inboxBids", "inboxInquiries"]

    return {
      action: ActionType.tappedNavigationTab,
      context_module: tabs[index],
      context_screen_owner_type: tabs[index],
      action_type: ActionTypes.Tap,
      action_name: ActionNames.InboxTab,
    }
  })
  handleNavigationTab(tabIndex: number) {
    const newTab: Tab = tabIndex === 0 ? Tab.bids : Tab.inquiries
    this.setState({ activeTab: newTab })
  }

  render() {
    const bottomInset = this.scrollViewVerticalStart
    return (
      <ScrollableTabView
        style={{ paddingTop: 30 }}
        initialPage={0}
        renderTabBar={() => <InboxTabs />}
        contentProps={{
          contentInset: { bottom: bottomInset },
          onLayout: this.onScrollableTabViewLayout,
        }}
        onChangeTab={({ i }: { i: number }) => this.handleNavigationTab(i)}
      >
        <TabWrapper tabLabel="Bids" key="bids" style={{ flexGrow: 1, justifyContent: "center" }}>
          <MyBidsContainer isActiveTab={this.props.isVisible && this.state.activeTab === Tab.bids} me={this.props.me} />
        </TabWrapper>
        <TabWrapper tabLabel="Inquiries" key="inquiries" style={{ flexGrow: 1, justifyContent: "flex-start" }}>
          <ConversationsContainer
            me={this.props.me}
            isActiveTab={this.props.isVisible && this.state.activeTab === Tab.inquiries}
          />
        </TabWrapper>
      </ScrollableTabView>
    )
  }
}

export const InboxContainer = createRefetchContainer(
  Inbox,
  {
    me: graphql`
      fragment Inbox_me on Me {
        ...Conversations_me
        ...MyBids_me
      }
    `,
  },
  graphql`
    query InboxRefetchQuery {
      me {
        ...Inbox_me
      }
    }
  `
)

export const InboxQueryRenderer: React.FC<{ isVisible: boolean }> = (props) => {
  return (
    <QueryRenderer<InboxQuery>
      environment={defaultEnvironment}
      query={graphql`
        query InboxQuery {
          me {
            ...Inbox_me
          }
        }
      `}
      cacheConfig={{ force: true }}
      variables={{}}
      render={(...args) => renderWithLoadProgress(InboxContainer, props)(...args)}
    />
  )
}
