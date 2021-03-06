import { ContextModule, OwnerType, tappedInfoBubble } from "@artsy/cohesion"
import { MyCollectionArtworkArtistAuctionResultsTestsQuery } from "__generated__/MyCollectionArtworkArtistAuctionResultsTestsQuery.graphql"
import { CaretButton } from "lib/Components/Buttons/CaretButton"
import OpaqueImageView from "lib/Components/OpaqueImageView/OpaqueImageView"
import { navigate } from "lib/navigation/navigate"
import { extractText } from "lib/tests/extractText"
import { renderWithWrappers } from "lib/tests/renderWithWrappers"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { useTracking } from "react-tracking"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { InfoButton } from "../InfoButton"
import { MyCollectionArtworkArtistAuctionResultsFragmentContainer } from "../MyCollectionArtworkArtistAuctionResults"

jest.unmock("react-relay")
jest.mock("react-tracking")

describe("MyCollectionArtworkArtistAuctionResults", () => {
  const trackEvent = jest.fn()
  let mockEnvironment: ReturnType<typeof createMockEnvironment>
  const TestRenderer = () => (
    <QueryRenderer<MyCollectionArtworkArtistAuctionResultsTestsQuery>
      environment={mockEnvironment}
      query={graphql`
        query MyCollectionArtworkArtistAuctionResultsTestsQuery @relay_test_operation {
          artwork(id: "some-slug") {
            ...MyCollectionArtworkArtistAuctionResults_artwork
          }
        }
      `}
      variables={{}}
      render={({ props }) => {
        if (props?.artwork) {
          return <MyCollectionArtworkArtistAuctionResultsFragmentContainer artwork={props.artwork} />
        }
        return null
      }}
    />
  )

  beforeEach(() => {
    mockEnvironment = createMockEnvironment()
    const mockTracking = useTracking as jest.Mock
    mockTracking.mockImplementation(() => {
      return {
        trackEvent,
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const resolveData = (passedProps = {}) => {
    mockEnvironment.mock.resolveMostRecentOperation((operation) =>
      MockPayloadGenerator.generate(operation, passedProps)
    )
  }

  it("renders without throwing an error", () => {
    const wrapper = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artist: () => ({
        auctionResultsConnection: {
          edges: [
            {
              node: {
                saleDate: "2020-10-07T00:00:00.000Z",
                priceRealized: {
                  centsUSD: 400,
                  display: "4.00",
                },
              },
            },
          ],
        },
      }),
    })
    expect(wrapper.root.findByType(OpaqueImageView)).toBeDefined()
    const text = extractText(wrapper.root)
    expect(text).toContain("Auction Results")
    expect(text).toContain("title")
    expect(text).toContain(`Sold`)
    expect(text).toContain("4.00")
    expect(text).toContain("Explore auction results")
  })

  it("navigates to all auction results when user taps auctions results items", () => {
    const wrapper = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        artist: {
          slug: "artist-slug",
        },
      }),
    })
    wrapper.root.findByProps({ "data-test-id": "AuctionsResultsButton" }).props.onPress()
    expect(navigate).toHaveBeenCalledWith("/artist/artist-slug/auction-results")
  })

  it("navigates to all auction results on press", () => {
    const wrapper = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        artist: {
          slug: "artist-slug",
        },
      }),
    })
    wrapper.root.findAllByType(CaretButton)[0].props.onPress()
    expect(navigate).toHaveBeenCalledWith("/artist/artist-slug/auction-results")
  })

  it("tracks analytics event when info button is tapped", () => {
    const wrapper = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        internalID: "artwork-id",
        slug: "artwork-slug",
      }),
    })
    wrapper.root.findByType(InfoButton).props.onPress()

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      tappedInfoBubble({
        contextModule: ContextModule.myCollectionArtwork,
        contextScreenOwnerType: OwnerType.myCollectionArtwork,
        subject: "auctionResults",
        contextScreenOwnerId: "artwork-id",
        contextScreenOwnerSlug: "artwork-slug",
      })
    )
  })
})
