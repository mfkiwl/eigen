import React from "react"
import { createPaginationContainer, graphql, RelayPaginationProp } from "react-relay"

import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native"

import { navigate } from "lib/navigation/navigate"
import ConversationSnippet from "./ConversationSnippet"
import { NoMessages } from "./NoMessages"

import { PAGE_SIZE } from "lib/data/constants"

import { ActionType, ContextModule, OwnerType } from "@artsy/cohesion"
import { Conversations_me } from "__generated__/Conversations_me.graphql"
import { getCurrentEmissionState } from "lib/store/GlobalStore"
import { extractNodes } from "lib/utils/extractNodes"
import { ActionNames, ActionTypes } from "lib/utils/track/schema"
import { color, Flex, Sans, Separator } from "palette"
import { useTracking } from "react-tracking"

interface Props {
  me: Conversations_me
  relay: RelayPaginationProp
  headerView?: JSX.Element
  onRefresh?: () => any
  isActiveTab: boolean
}

type Item = NonNullable<NonNullable<NonNullable<Conversations_me["conversations"]>["edges"]>[0]>["node"]

// @track()
export const Conversations: React.FC<Props> = React.forwardRef((props) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isFetching, setIsFetching] = React.useState<boolean>(false)
  const { trackEvent } = useTracking()

  const { relay, isActiveTab } = props

  const fetchData = () => {
    if (relay.hasMore() && !relay.isLoading()) {
      setIsLoading(true)
      relay.loadMore(PAGE_SIZE, (error) => {
        if (error) {
          console.error("Conversations/index.tsx #fetchData", error.message)
          // FIXME: Handle error
        }
        setIsLoading(false)
      })
    }
  }

  const refreshConversations = (withSpinner: boolean = false) => {
    if (!relay.isLoading()) {
      if (withSpinner) {
        setIsFetching(true)
      }
      relay.refetchConnection(PAGE_SIZE, (error) => {
        if (error) {
          console.error("Conversations/index.tsx #refreshConversations", error.message)
          // FIXME: Handle error
        }
        setIsFetching(false)
      })
    }
  }

  const handleSelectConversation = (item: Item) => {
    if (item) {
      trackEvent({
        action: ActionType.tappedInboxConversation,
        context_module: ContextModule.inboxInquiries,
        context_screen_owner_type: OwnerType.inboxInquiries,
        destination_screen_owner_type: OwnerType.inboxConversation,
        destination_screen_owner_id: item.internalID,
        artwork_id: (item.items?.[0]?.item as any)?.internalID,
        partner_id: (item.items?.[0]?.item as any)?.partner?.internalID,
        action_type: ActionTypes.Tap,
        action_name: ActionNames.ConversationSelected,
      })
      navigate(`conversation/${item?.internalID}`)
    }
  }

  React.useEffect(() => {
    if (isActiveTab) {
      refreshConversations()
    }
  }, [isActiveTab])

  const conversations = extractNodes(props.me.conversations)

  const unreadCount = props.me.conversations?.totalUnreadCount
  const unreadCounter = unreadCount ? `(${unreadCount})` : null
  const shouldDisplayMyBids = getCurrentEmissionState().options.AROptionsBidManagement

  return (
    <View style={{ flexGrow: 1 }}>
      {!shouldDisplayMyBids && (
        <Flex py={1} style={{ borderBottomWidth: 1, borderBottomColor: color("black10") }}>
          <Sans mx={2} mt={1} size="8" style={{ borderBottomWidth: 1, borderBottomColor: color("black10") }}>
            Inbox {unreadCounter}
          </Sans>
        </Flex>
      )}
      <FlatList
        data={conversations}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refreshConversations(true)
            }}
          />
        }
        keyExtractor={(item) => item.internalID!}
        ItemSeparatorComponent={() => <Separator mx={2} width="auto" />}
        renderItem={({ item }) => {
          return <ConversationSnippet conversation={item} onSelected={() => handleSelectConversation(item)} />
        }}
        onEndReached={fetchData}
        onEndReachedThreshold={2}
        contentContainerStyle={{ flexGrow: 1, justifyContent: !conversations.length ? "center" : "flex-start" }}
        ListEmptyComponent={<NoMessages />}
      />
      {!!(relay.hasMore() && isLoading) && (
        <Flex p={3} alignItems="center">
          <ActivityIndicator />
        </Flex>
      )}
    </View>
  )
})

/* @track()

//   // @track((_props, _state, args: [Item]) => ({
//   //   action: ActionType.tappedInboxConversation,
//   //   context_module: ContextModule.inboxInquiries,
//   //   context_screen_owner_type: OwnerType.inboxInquiries,
//   //   destination_screen_owner_type: OwnerType.inboxConversation,
//   //   destination_screen_owner_id: args[0]?.internalID,
//   //   artwork_id: (args[0]?.items?.[0]?.item as any)?.internalID,
//   //   partner_id: (args[0]?.items?.[0]?.item as any)?.partner?.internalID,
//   //   action_type: ActionTypes.Tap,
//   //   action_name: ActionNames.ConversationSelected,
//   // }))

*/

export const ConversationsContainer = createPaginationContainer(
  Conversations,
  {
    me: graphql`
      fragment Conversations_me on Me
      @argumentDefinitions(count: { type: "Int", defaultValue: 10 }, cursor: { type: "String", defaultValue: "" }) {
        conversations: conversationsConnection(first: $count, after: $cursor)
          @connection(key: "Conversations_conversations") {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              internalID
              last_message: lastMessage
              ...ConversationSnippet_conversation
              items {
                item {
                  __typename
                  ... on Artwork {
                    internalID
                    partner {
                      internalID
                    }
                  }
                }
              }
            }
          }
          totalUnreadCount
        }
      }
    `,
  },
  {
    getConnectionFromProps(props) {
      return props.me && props.me.conversations
    },
    getVariables(_props, { count, cursor }, fragmentVariables) {
      return {
        // in most cases, for variables other than connection filters like
        // `first`, `after`, etc. you may want to use the previous values.
        ...fragmentVariables,
        count,
        cursor,
      }
    },
    query: graphql`
      query ConversationsQuery($count: Int!, $cursor: String) {
        me {
          ...Conversations_me @arguments(count: $count, cursor: $cursor)
        }
      }
    `,
  }
)
