import { Box, Button, color, Flex, Sans, Theme } from "@artsy/palette"
import { ScrollableTab } from "lib/Components/ScrollableTabBar"
import { TabBar } from "lib/Components/TabBar"
import { Schema, screenTrack, track } from "lib/utils/track"
import React, { Component } from "react"
import { NativeModules, View } from "react-native"
// @ts-ignore STRICTNESS_MIGRATION
import ScrollableTabView from "react-native-scrollable-tab-view"
import { RelayProp } from "react-relay"
import styled from "styled-components/native"
import { BucketResults } from "../Map/bucketCityResults"
import { EventEmitter } from "../Map/EventEmitter"
import { MapTab, RelayErrorState } from "../Map/types"
import { cityTabs } from "./cityTabs"
import { AllEvents } from "./Components/AllEvents"
import { EventList } from "./Components/EventList"

interface Props {
  verticalMargin?: number
  isDrawerOpen?: boolean
  initialTab?: number
  citySlug: string
  tracking: any
}

interface State {
  buckets?: BucketResults
  filter: MapTab // Used for analytics
  relay: RelayProp
  cityName: string
  citySlug: string
  sponsoredContent: { introText: string; artGuideUrl: string }
  relayErrorState?: RelayErrorState
}
const AllCityMetaTab = 0

@screenTrack<Props>(props => ({
  context_screen: Schema.PageNames.CityGuide,
  context_screen_owner_type: Schema.OwnerEntityTypes.CityGuide,
  context_screen_owner_slug: props.citySlug,
  context_screen_owner_id: props.citySlug,
}))
export class CityView extends Component<Props, State> {
  // @ts-ignore STRICTNESS_MIGRATION
  state = {
    buckets: null,
    filter: cityTabs[0],
    relay: null,
    cityName: "",
    citySlug: "",
    sponsoredContent: null,
    relayErrorState: null,
  }

  scrollViewVerticalStart = 0

  handleEvent = ({
    filter,
    buckets,
    cityName,
    citySlug,
    relay,
    sponsoredContent,
  }: {
    filter: MapTab
    buckets: BucketResults
    cityName: string
    relay: RelayProp
    citySlug: string
    sponsoredContent: { introText: string; artGuideUrl: string }
  }) => {
    // We have the Relay response; post a notification so that the ARMapContainerViewController can finalize the native UI (ie: show the drawer partially).
    this.setState(
      {
        buckets,
        filter,
        cityName,
        citySlug,
        relay,
        sponsoredContent,
      },
      () => {
        NativeModules.ARNotificationsManager.postNotificationName("ARLocalDiscoveryQueryResponseReceived", {})
      }
    )
  }

  handleError = ({ relayErrorState }: { relayErrorState: RelayErrorState }) => {
    // We have a Relay error; post a notification so that the ARMapContainerViewController can finalize the native UI (ie: show the drawer partially).
    this.setState({ relayErrorState }, () => {
      NativeModules.ARNotificationsManager.postNotificationName("ARLocalDiscoveryQueryResponseReceived", {})
    })
  }

  UNSAFE_componentWillMount() {
    EventEmitter.subscribe("map:change", this.handleEvent)
    EventEmitter.subscribe("map:error", this.handleError)
  }

  componentWillUnmount() {
    EventEmitter.unsubscribe("map:change", this.handleEvent)
    EventEmitter.unsubscribe("map:error", this.handleError)
  }

  // @ts-ignore STRICTNESS_MIGRATION
  setSelectedTab(selectedTab) {
    EventEmitter.dispatch("filters:change", selectedTab.i)
    NativeModules.ARNotificationsManager.postNotificationName("ARLocalDiscoveryCityGotScrollView", {})
  }

  @track((__, _, args) => {
    const filter = args[0]
    let actionName
    switch (filter) {
      case "all":
        actionName = Schema.ActionNames.AllTab
        break
      case "saved":
        actionName = Schema.ActionNames.SavedTab
        break
      case "fairs":
        actionName = Schema.ActionNames.FairsTab
        break
      case "galleries":
        actionName = Schema.ActionNames.GalleriesTab
        break
      case "museums":
        actionName = Schema.ActionNames.MuseumsTab
        break
      default:
        actionName = null
        break
    }
    return {
      action_name: actionName,
      action_type: Schema.ActionTypes.Tap,
    } as any
  })
  // @ts-ignore STRICTNESS_MIGRATION
  trackTab(_filter) {
    return null
  }

  // @ts-ignore STRICTNESS_MIGRATION
  componentDidUpdate(_, prevState) {
    if (prevState.filter.id !== this.state.filter.id) {
      this.trackTab(this.state.filter.id)
    }
  }

  // @ts-ignore STRICTNESS_MIGRATION
  renderTabBar(props) {
    return (
      <View>
        <TabBar {...props} spaceEvenly={false} />
      </View>
    )
  }

  // TODO: Is it correct that we have these two similar ones?
  // @ts-ignore STRICTNESS_MIGRATION
  onScrollableTabViewLayout = layout => {
    this.scrollViewVerticalStart = layout.nativeEvent.layout.y
  }
  // @ts-ignore STRICTNESS_MIGRATION
  onScrollViewLayout = layout => {
    this.scrollViewVerticalStart = layout.nativeEvent.layout.y
    NativeModules.ARNotificationsManager.postNotificationName("ARLocalDiscoveryCityGotScrollView", {})
  }

  render() {
    const { buckets, cityName, citySlug, relayErrorState } = this.state
    const { verticalMargin } = this.props
    // bottomInset is used for the ScrollView's contentInset. See the note in ARMapContainerViewController.m for context.
    const bottomInset = this.scrollViewVerticalStart + (verticalMargin || 0)

    return buckets || relayErrorState ? (
      <Theme>
        <Flex style={{ flex: 1 }}>
          <Flex py={1} alignItems="center">
            <Handle />
          </Flex>
          {relayErrorState ? (
            // @ts-ignore STRICTNESS_MIGRATION
            <ErrorScreen relayErrorState={relayErrorState} key="error" />
          ) : (
            <ScrollableTabView
              initialPage={this.props.initialTab || AllCityMetaTab}
              onChangeTab={this.setSelectedTab}
              renderTabBar={this.renderTabBar}
              prerenderingSiblingsNumber={2}
              onLayout={this.onScrollableTabViewLayout}
              // These are the ScrollView props for inside the scrollable tab view
              contentProps={{
                contentInset: { bottom: bottomInset },
                onLayout: this.onScrollViewLayout,
              }}
            >
              <ScrollableTab tabLabel="All" key="all">
                <AllEvents
                  cityName={cityName}
                  citySlug={citySlug}
                  key={cityName}
                  sponsoredContent={this.state.sponsoredContent as any /* STRICTNESS_MIGRATION */}
                  buckets={buckets as any /* STRICTNESS_MIGRATION */}
                  relay={this.state.relay as any /* STRICTNESS_MIGRATION */}
                />
              </ScrollableTab>

              {cityTabs
                .filter(tab => tab.id !== "all")
                .map(tab => {
                  return (
                    <ScrollableTab tabLabel={tab.text} key={tab.id}>
                      <EventList
                        key={cityName + tab.id}
                        // @ts-ignore STRICTNESS_MIGRATION
                        bucket={buckets[tab.id]}
                        type={tab.id}
                        cityName={cityName}
                        citySlug={citySlug}
                        // @ts-ignore STRICTNESS_MIGRATION
                        relay={this.state.relay}
                        renderedInTab
                      />
                    </ScrollableTab>
                  )
                })}
            </ScrollableTabView>
          )}
        </Flex>
      </Theme>
    ) : null
  }
}

const Handle = styled.View`
  width: 40px;
  height: 5px;
  border-radius: 2.5px;
  background-color: ${color("black30")};
`

// @TODO: Implement test for this component https://artsyproduct.atlassian.net/browse/LD-562
const ErrorScreen: React.SFC<{ relayErrorState: RelayErrorState }> = ({ relayErrorState: { retry, isRetrying } }) => {
  return (
    <Box py={2}>
      <Sans size="3t" textAlign="center" mx={2}>
        We are having trouble loading content right now, please try again later.
      </Sans>
      <Flex justifyContent="center" flexDirection="row">
        <Box mt={2}>
          <Button onPress={retry} loading={isRetrying}>
            Retry
          </Button>
        </Box>
      </Flex>
    </Box>
  )
}
