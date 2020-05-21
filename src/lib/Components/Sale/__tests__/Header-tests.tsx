import React from "react"
import * as renderer from "react-test-renderer"

import { HeaderContainer } from "../Header"

import { Theme } from "@artsy/palette"

it("renders without throwing an error", () => {
  const sale = {
    name: "The Awesome Sale",
    cover_image: {
      href: "http://example.com/some/image.jpg",
    },
  }
  renderer.create(
    <Theme>
      <HeaderContainer sale={sale as any} showImage={false} />
    </Theme>
  )
})
