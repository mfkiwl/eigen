import { updateMyUserProfileMutation } from "__generated__/updateMyUserProfileMutation.graphql"
import { defaultEnvironment } from "lib/relay/createEnvironment"
import { commitMutation, graphql } from "react-relay"

export const updateMyUserProfile = async (input: updateMyUserProfileMutation["variables"]["input"]) => {
  await new Promise((resolve, reject) =>
    commitMutation<updateMyUserProfileMutation>(defaultEnvironment, {
      onCompleted: (response, _) => {
        if (response.updateMyUserProfile?.userOrError?.mutationError) {
          reject(response.updateMyUserProfile?.userOrError?.mutationError)
        }
        resolve(response)
      },
      mutation: graphql`
        mutation updateMyUserProfileMutation($input: UpdateMyProfileInput!) {
          updateMyUserProfile(input: $input) {
            me {
              email
              name
              phone
              receiveLotOpeningSoonNotification
              receiveNewSalesNotification
              receiveNewWorksNotification
              receiveOutbidNotification
              receivePromotionNotification
              receivePurchaseNotification
              receiveSaleOpeningClosingNotification
              internalID
            }
            userOrError {
              ... on UpdateMyProfileMutationFailure {
                mutationError {
                  type
                  message
                  detail
                  error
                  fieldErrors {
                    name
                    message
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        input,
      },
      onError: (e) => {
        // try to ge a user-facing error message
        try {
          const message = JSON.parse(JSON.stringify(e))?.res?.json?.errors?.[0]?.message ?? ""
          // should be like "https://api.artsy.net/api/v1/me?email=david@artsymail.com - {"error": "User-facing error message"}"
          if (typeof message === "string") {
            const jsonString = message.match(/http.* (\{.*)$/)?.[1]
            if (jsonString) {
              const json = JSON.parse(jsonString)
              if (typeof json?.error === "string") {
                reject(json.error)
                return
              }
              if (typeof json?.message === "string") {
                reject(json.message)
                return
              }
            }
          }
        } catch (e) {
          // fall through
        }
        reject("Something went wrong")
      },
    })
  )
}
