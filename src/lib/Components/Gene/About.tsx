import React from "react"
import { createFragmentContainer, graphql } from "react-relay"

import { StyleSheet, View, ViewStyle } from "react-native"

import { BiographyContainer } from "./Biography"

import { RelatedArtistsContainer } from "../RelatedArtists"
import { Separator } from "../Separator"

import { About_gene } from "__generated__/About_gene.graphql"

interface Props {
  gene: About_gene
}

class About extends React.Component<Props> {
  render() {
    return (
      <View>
        {this.biography()}
        {this.relatedArtists()}
      </View>
    )
  }

  biography() {
    return (
      <View>
        <BiographyContainer gene={this.props.gene as any} style={styles.sectionSeparator} />
        <Separator style={styles.sectionSeparator} />
      </View>
    )
  }

  relatedArtists() {
    return (this.props.gene.trending_artists || []).length ? (
      <RelatedArtistsContainer artists={this.props.gene.trending_artists as any} />
    ) : null
  }
}

interface Styles {
  sectionSeparator: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  sectionSeparator: {
    marginBottom: 20,
  },
})

export const AboutContainer = createFragmentContainer(About, {
  gene: graphql`
    fragment About_gene on Gene {
      ...Biography_gene
      trending_artists: trendingArtists {
        ...RelatedArtists_artists
      }
    }
  `,
})
