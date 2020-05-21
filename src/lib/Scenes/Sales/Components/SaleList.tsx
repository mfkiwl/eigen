import { isEmpty } from "lodash"
import React from "react"
import { View } from "react-native"

import { SaleListItem_sale } from "__generated__/SaleListItem_sale.graphql"
import { SectionTitle } from "lib/Components/SectionTitle"
import { useScreenDimensions } from "lib/utils/useScreenDimensions"
import { FragmentRef } from "react-relay"
import { SaleListItemContainer } from "./SaleListItem"

export const SaleList: React.FC<{ sales: Array<FragmentRef<SaleListItem_sale>>; title: string }> = ({
  sales,
  title,
}) => {
  const { width } = useScreenDimensions()
  const isIPad = width > 700
  const columnCount = isIPad ? 4 : 2
  const gutterSize = (columnCount + 1) * 20
  const columnWidth = (width - gutterSize) / columnCount
  if (isEmpty(sales)) {
    return null
  }

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <SectionTitle title={title} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: -20 }}>
        {sales.map((sale, index) => (
          <SaleListItemContainer key={index} sale={sale} containerWidth={columnWidth} />
        ))}
      </View>
    </View>
  )
}
