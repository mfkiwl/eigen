/* tslint:disable */

import { ConcreteFragment } from "relay-runtime";
import { ArtworkActions_artwork$ref } from "./ArtworkActions_artwork.graphql";
import { ArtworkAvailability_artwork$ref } from "./ArtworkAvailability_artwork.graphql";
import { ArtworkTombstone_artwork$ref } from "./ArtworkTombstone_artwork.graphql";
import { SellerInfo_artwork$ref } from "./SellerInfo_artwork.graphql";
declare const _Artwork_artwork$ref: unique symbol;
export type Artwork_artwork$ref = typeof _Artwork_artwork$ref;
export type Artwork_artwork = {
    readonly " $fragmentRefs": ArtworkTombstone_artwork$ref & ArtworkActions_artwork$ref & ArtworkAvailability_artwork$ref & SellerInfo_artwork$ref;
    readonly " $refType": Artwork_artwork$ref;
};



const node: ConcreteFragment = {
  "kind": "Fragment",
  "name": "Artwork_artwork",
  "type": "Artwork",
  "metadata": null,
  "argumentDefinitions": [],
  "selections": [
    {
      "kind": "FragmentSpread",
      "name": "ArtworkTombstone_artwork",
      "args": null
    },
    {
      "kind": "FragmentSpread",
      "name": "ArtworkActions_artwork",
      "args": null
    },
    {
      "kind": "FragmentSpread",
      "name": "ArtworkAvailability_artwork",
      "args": null
    },
    {
      "kind": "FragmentSpread",
      "name": "SellerInfo_artwork",
      "args": null
    },
    {
      "kind": "ScalarField",
      "alias": null,
      "name": "__id",
      "args": null,
      "storageKey": null
    }
  ]
};
(node as any).hash = '1021f50bee1850a3eccc9efbb82548c2';
export default node;
