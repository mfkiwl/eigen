import { ArtworkHeader_artwork } from "__generated__/ArtworkHeader_artwork.graphql"
import { AppStore, useEmissionOption } from "lib/store/AppStore"
import { useScreenDimensions } from "lib/utils/useScreenDimensions"
import { last } from "lodash"
import { Box, Button, Flex, Spacer, Text } from "palette"
import React, { useEffect, useState } from "react"
import { Linking } from "react-native"
import Share from "react-native-share"
import { createFragmentContainer, graphql } from "react-relay"
import RNFetchBlob from "rn-fetch-blob"
import { ArtworkActionsFragmentContainer as ArtworkActions } from "./ArtworkActions"
import { ArtworkTombstoneFragmentContainer as ArtworkTombstone } from "./ArtworkTombstone"
import { ImageCarouselFragmentContainer } from "./ImageCarousel/ImageCarousel"

interface ArtworkHeaderProps {
  artwork: ArtworkHeader_artwork
}

export const ArtworkHeader: React.FC<ArtworkHeaderProps> = (props) => {
  const { artwork } = props
  const screenDimensions = useScreenDimensions()
  const emissionShareToInstagram = useEmissionOption("AROptionsShareToInstagram")
  const [canOpen, setCanOpen] = useState<boolean | null>(null)
  const showShareToInstagram = emissionShareToInstagram && canOpen

  useEffect(() => {
    const checkCanOpen = async () => {
      setCanOpen(await Linking.canOpenURL("instagram://app"))
    }
    if (emissionShareToInstagram) {
      checkCanOpen()
    }
  }, [])

  const shareOnInstagram = (url: string) => {
    let imagePath: string | null = null

    RNFetchBlob.config({ fileCache: true, appendExt: last(url.split(".")) })
      .fetch("GET", url)
      .then((resp) => {
        imagePath = resp.path()
        console.log({ imagePath })
        return resp.readFile("base64")
      })
      .then((base64dataRaw) => {
        const base64data = `data:image/jpg;base64,${base64dataRaw}`
        console.log({ url })
        console.log({ base64data })

        // set up an action to delete the image next time the app is in the foreground
        AppStore.actions.onAppActiveDispatchActions.deleteAtPath(imagePath!)

        // Share.shareSingle({
        // social: Share.Social.INSTAGRAM,
        // url: base64data,
        // })
      })
  }

  return (
    <Box>
      <Spacer mb={2} />
      <ImageCarouselFragmentContainer
        images={artwork.images as any /* STRICTNESS_MIGRATION */}
        cardHeight={screenDimensions.width >= 375 ? 340 : 290}
      />
      <Flex alignItems="center" mt={2}>
        <ArtworkActions artwork={artwork} />
      </Flex>
      {!!showShareToInstagram && (
        <Flex alignItems="center" mt={2}>
          <Button
            size="small"
            onPress={() => {
              const url = artwork.images[0].url.replace(":version", "large")
              shareOnInstagram(url)
            }}
          >
            Share on Instagram
          </Button>
        </Flex>
      )}
      <Spacer mb={2} />
      <Box px={2}>
        <ArtworkTombstone artwork={artwork} />
      </Box>
    </Box>
  )
}

export const ArtworkHeaderFragmentContainer = createFragmentContainer(ArtworkHeader, {
  artwork: graphql`
    fragment ArtworkHeader_artwork on Artwork {
      ...ArtworkActions_artwork
      ...ArtworkTombstone_artwork
      images {
        ...ImageCarousel_images
        url: imageURL
        imageVersions
      }
    }
  `,
})
