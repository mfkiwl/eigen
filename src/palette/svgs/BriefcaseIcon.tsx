import React from "react"
import { color } from "../helpers"
import { Icon, IconProps, Path } from "./Icon"

/** BriefcaseIcon */
export const BriefcaseIcon: React.FC<IconProps> = (props) => {
  return (
    <Icon {...props} viewBox="0 0 18 18">
      <Path
        d="M5.15034 2.97361C5.11469 3.04491 5.08356 3.11663 5.05639 3.1875H8.94361C8.91644 3.11663 8.88531 3.04491 8.84966 2.97361C8.71526 2.7048 8.5215 2.4512 8.24023 2.26368C7.96208 2.07825 7.56876 1.9375 7 1.9375C6.43124 1.9375 6.03792 2.07825 5.75977 2.26368C5.4785 2.4512 5.28474 2.7048 5.15034 2.97361ZM9.74409 2.52639C9.85865 2.75552 9.93829 2.9825 9.9938 3.1875H13.125C13.6082 3.1875 14 3.57925 14 4.0625V12.375C14 12.8582 13.6082 13.25 13.125 13.25H0.875C0.391751 13.25 0 12.8582 0 12.375V4.0625C0 3.57925 0.391751 3.1875 0.875 3.1875H4.0062C4.06171 2.9825 4.14135 2.75552 4.25591 2.52639C4.44963 2.13895 4.74806 1.7363 5.20507 1.43163C5.66521 1.12487 6.25626 0.9375 7 0.9375C7.74374 0.9375 8.33479 1.12487 8.79493 1.43163C9.25194 1.7363 9.55037 2.13895 9.74409 2.52639ZM1 12.25V8.49998H6.5V9H7.5V8.49998H13V12.25H1ZM7.5 7.49998H13V4.1875H1V7.49998H6.5V7H7.5V7.49998Z"
        fill={color(props.fill ?? "primaryText")}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Icon>
  )
}
