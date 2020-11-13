import React from "react"
import { color } from "../helpers"
import { Icon, IconProps, Path } from "./Icon"

/** ArrowRightIcon */
export const ArrowRightIcon: React.FC<IconProps> = (props) => {
  return (
    <Icon {...props} viewBox="0 0 18 18">
      <Path
        d="M5.94 15.94l-.88-.88L11.12 9 5.06 2.94l.88-.88L12.88 9z"
        fill={color(props.fill ?? "primaryText")}
        fillRule="evenodd"
      />
    </Icon>
  )
}
