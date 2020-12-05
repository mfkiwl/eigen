import { SaleCardTestsQuery } from "__generated__/SaleCardTestsQuery.graphql"
import { extractText } from "lib/tests/extractText"
import { renderWithWrappers } from "lib/tests/renderWithWrappers"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { act } from "react-test-renderer"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { RegistrationCTAWrapper, SaleCard, SaleCardFragmentContainer } from "../Components/SaleCard"

jest.unmock("react-relay")

describe("SaleCard", () => {
  let env: ReturnType<typeof createMockEnvironment>

  beforeEach(() => {
    env = createMockEnvironment()
  })

  const TestRenderer = () => (
    <QueryRenderer<SaleCardTestsQuery>
      environment={env}
      query={graphql`
        query SaleCardTestsQuery($saleID: String!) @relay_test_operation {
          me {
            ...SaleCard_me
          }
          sale(id: $saleID) {
            ...SaleCard_sale
          }
        }
      `}
      variables={{ saleID: "test-sale" }}
      render={({ error, props }) => {
        if (props?.sale && props?.me) {
          return <SaleCardFragmentContainer me={props.me} sale={props.sale} />
        } else if (error) {
          console.error(error)
        }
      }}
    />
  )

  const getWrapper = (mockResolvers = {}) => {
    const tree = renderWithWrappers(<TestRenderer />)
    act(() => {
      env.mock.resolveMostRecentOperation((operation) => MockPayloadGenerator.generate(operation, mockResolvers))
    })
    return tree
  }

  it("renders without throwing an error", () => {
    const wrapper = getWrapper()
    expect(wrapper.root.findAllByType(SaleCard)).toHaveLength(1)
  })

  it("doesn't render a registration CTA when a user is qualified for bidding", () => {
    const wrapper = getWrapper({
      Sale: () => ({
        registrationStatus: { qualifiedForBidding: true },
      }),
    })

    expect(wrapper.root.findAllByType(RegistrationCTAWrapper)).toHaveLength(0)
  })

  it("renders a link to identity-verification-faq when the sale requires identity verification and the user is not yet verified", () => {
    const wrapper = getWrapper({
      Sale: () => ({
        registrationStatus: { qualifiedForBidding: false },
        requireIdentityVerification: true,
      }),
      Me: () => ({
        identityVerified: false,
        pendingIdentityVerification: true,
      }),
    })

    expect(wrapper.root.findAllByType(RegistrationCTAWrapper)).toHaveLength(1)
    expect(wrapper.root.findAllByProps({ navLink: "/identity-verification-faq" }).length).toEqual(1)
  })

  it("renders a notice that registration is pending when identity verification is not required, but the user is not yet qualified for bidding", () => {
    const wrapper = getWrapper({
      Sale: () => ({
        registrationStatus: { qualifiedForBidding: false },
        requireIdentityVerification: false,
      }),
    })

    expect(wrapper.root.findAllByType(RegistrationCTAWrapper)).toHaveLength(1)
    const text = extractText(wrapper.root)
    expect(text).toContain("Registration pending")
  })

  it("renders a link to register for the auction when there's no registration status present", () => {
    const wrapper = getWrapper({
      Sale: () => ({
        registrationStatus: null,
        slug: "test-sale",
      }),
    })

    expect(wrapper.root.findAllByType(RegistrationCTAWrapper)).toHaveLength(1)
    expect(wrapper.root.findAllByProps({ navLink: "/auction-registration/test-sale" }).length).toEqual(1)
  })
})