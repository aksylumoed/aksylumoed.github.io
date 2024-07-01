declare namespace OpenSeadragon {
  enum SUBPIXEL_ROUNDING_OCCURRENCES {
      NEVER = 0,
      ONLY_AT_REST = 1,
      ALWAYS = 2,
      // Add other enumeration values as necessary
  }

  interface Options {
      subPixelRoundingForTransparency?: SUBPIXEL_ROUNDING_OCCURRENCES;
  }
}
