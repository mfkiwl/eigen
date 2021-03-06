import { deleteCollectedArtwork } from "@artsy/cohesion"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { captureException } from "@sentry/react-native"
import { MyCollectionArtwork_sharedProps } from "__generated__/MyCollectionArtwork_sharedProps.graphql"
import { FormikProvider, useFormik } from "formik"
import { FancyModal } from "lib/Components/FancyModal/FancyModal"
import {
  getConvectionGeminiKey,
  getGeminiCredentialsForEnvironment,
  uploadFileToS3,
} from "lib/Scenes/Consignments/Submission/geminiUploadToS3"
import { cleanArtworkPayload, explicitlyClearedFields } from "lib/Scenes/MyCollection/utils/cleanArtworkPayload"
import { GlobalStore } from "lib/store/GlobalStore"
import { Box, Flex } from "palette"
import React, { useRef, useState } from "react"
import { ActionSheetIOS, ActivityIndicator, Alert } from "react-native"
import { useTracking } from "react-tracking"
import { myCollectionAddArtwork } from "../../mutations/myCollectionAddArtwork"
import { myCollectionDeleteArtwork } from "../../mutations/myCollectionDeleteArtwork"
import { myCollectionEditArtwork } from "../../mutations/myCollectionEditArtwork"
import { ArtworkFormValues } from "../../State/MyCollectionArtworkModel"
import { artworkSchema, validateArtworkSchema } from "./Form/artworkSchema"

import { isEqual } from "lodash"
import { deleteArtworkImage } from "../../mutations/deleteArtworkImage"
import { refreshMyCollection } from "../../MyCollection"
import { deletedPhotoIDs } from "../../utils/deletedPhotoIDs"
import { MyCollectionAdditionalDetailsForm } from "./Screens/MyCollectionArtworkFormAdditionalDetails"
import { MyCollectionAddPhotos } from "./Screens/MyCollectionArtworkFormAddPhotos"
import { MyCollectionArtworkFormMain } from "./Screens/MyCollectionArtworkFormMain"

export type ArtworkFormMode = "add" | "edit"

// This needs to be a `type` rather than an `interface` because there's
// a long-standing thing where a typescript `interface` will be treated a bit more strictly
// than the equivalent `type` in some situations.
// https://github.com/microsoft/TypeScript/issues/15300
// The react-navigation folks have written code that relies on the more permissive `type` behaviour.
// tslint:disable-next-line:interface-over-type-literal
export type ArtworkFormModalScreen = {
  ArtworkForm: {
    mode: ArtworkFormMode
    onDismiss(): void
    onDelete?(): void
  }
  AdditionalDetails: undefined
  AddPhotos: undefined
}

type MyCollectionArtworkFormModalProps = { visible: boolean; onDismiss: () => void; onSuccess: () => void } & (
  | {
      mode: "add"
    }
  | {
      mode: "edit"
      onDelete: () => void
      artwork: Omit<MyCollectionArtwork_sharedProps, " $refType">
    }
)

export const MyCollectionArtworkFormModal: React.FC<MyCollectionArtworkFormModalProps> = (props) => {
  const { trackEvent } = useTracking()
  const { formValues, dirtyFormCheckValues } = GlobalStore.useAppState(
    (state) => state.myCollection.artwork.sessionState
  )

  // we need to store the form values in a ref so that onDismiss can access their current value (prop updates are not
  // sent through the react-navigation system)
  const formValuesRef = useRef(formValues)
  formValuesRef.current = formValues

  const [loading, setLoading] = useState<boolean>(false)

  const formik = useFormik<ArtworkFormValues>({
    enableReinitialize: true,
    initialValues: formValues,
    initialErrors: validateArtworkSchema(formValues),
    onSubmit: async ({ photos, artistSearchResult, costMinor, artist, artistIds, ...others }) => {
      setLoading(true)
      try {
        const externalImageUrls = await uploadPhotos(photos)
        if (props.mode === "add") {
          await myCollectionAddArtwork({
            artistIds: [artistSearchResult!.internalID as string],
            externalImageUrls,
            costMinor: Number(costMinor),
            ...cleanArtworkPayload(others),
          })
        } else {
          await myCollectionEditArtwork({
            artistIds: [artistSearchResult!.internalID as string],
            artworkId: props.artwork.internalID,
            externalImageUrls,
            costMinor: Number(costMinor),
            ...cleanArtworkPayload(others),
            ...explicitlyClearedFields(others, dirtyFormCheckValues),
          })

          const deletedIDs = deletedPhotoIDs(dirtyFormCheckValues.photos, photos)
          for (const deletedID of deletedIDs) {
            await deleteArtworkImage(props.artwork.internalID, deletedID)
          }
        }
        refreshMyCollection()
        props.onSuccess()
        setTimeout(() => {
          GlobalStore.actions.myCollection.artwork.resetForm()
        }, 500)
      } catch (e) {
        if (__DEV__) {
          console.error(e)
        } else {
          captureException(e)
        }
        Alert.alert("An error ocurred", typeof e === "string" ? e : undefined)
      } finally {
        setLoading(false)
      }
    },
    validationSchema: artworkSchema,
  })

  const onDelete =
    props.mode === "edit" && props.onDelete
      ? async () => {
          setLoading(true)
          trackEvent(tracks.deleteCollectedArtwork(props.artwork.internalID, props.artwork.slug))
          try {
            await myCollectionDeleteArtwork(props.artwork.internalID)
            refreshMyCollection()
            props.onDelete()
          } catch (e) {
            if (__DEV__) {
              console.error(e)
            } else {
              captureException(e)
            }
            Alert.alert("An error ocurred", typeof e === "string" ? e : undefined)
          } finally {
            setLoading(false)
          }
        }
      : undefined

  const onDismiss = async () => {
    const formIsDirty = !isEqual(formValuesRef.current, dirtyFormCheckValues)

    if (formIsDirty) {
      const discardData = await new Promise((resolve) =>
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: "Do you want to discard your changes?",
            options: ["Discard", "Keep editing"],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              resolve(true)
            }
          }
        )
      )
      if (!discardData) {
        return
      }
    }

    GlobalStore.actions.myCollection.artwork.resetForm()
    props.onDismiss?.()
  }

  return (
    <NavigationContainer>
      <FormikProvider value={formik}>
        <FancyModal visible={props.visible} onBackgroundPressed={onDismiss}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
              cardStyle: { backgroundColor: "white" },
            }}
          >
            <Stack.Screen
              name="ArtworkForm"
              component={MyCollectionArtworkFormMain}
              initialParams={{ onDelete, onDismiss, mode: props.mode }}
            />
            <Stack.Screen name="AdditionalDetails" component={MyCollectionAdditionalDetailsForm} />
            <Stack.Screen name="AddPhotos" component={MyCollectionAddPhotos} />
          </Stack.Navigator>
          {!!loading && <LoadingIndicator />}
        </FancyModal>
      </FormikProvider>
    </NavigationContainer>
  )
}

const Stack = createStackNavigator<ArtworkFormModalScreen>()

const LoadingIndicator = () => {
  return (
    <Box
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.15)",
      }}
    >
      <Flex flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" />
      </Flex>
    </Box>
  )
}

export async function uploadPhotos(photos: ArtworkFormValues["photos"]) {
  GlobalStore.actions.myCollection.artwork.setLastUploadedPhoto(photos[0])
  // only recently added photos have a path
  const imagePaths: string[] = photos.map((photo) => photo.path).filter((path): path is string => path !== undefined)
  const externalImageUrls: string[] = []

  for (const path of imagePaths) {
    const convectionKey = await getConvectionGeminiKey()
    const acl = "private"
    const assetCredentials = await getGeminiCredentialsForEnvironment({ acl, name: convectionKey })
    const bucket = assetCredentials.policyDocument.conditions.bucket
    const s3 = await uploadFileToS3(path, acl, assetCredentials)
    const url = `https://${bucket}.s3.amazonaws.com/${s3.key}`
    externalImageUrls.push(url)
  }

  return externalImageUrls
}

const tracks = {
  deleteCollectedArtwork: (internalID: string, slug: string) => {
    return deleteCollectedArtwork({ contextOwnerId: internalID, contextOwnerSlug: slug })
  },
}
