# NadhafaDZ uploaded visual references

The latest user-provided images are part of the implementation brief and must not be ignored.

## Production visual direction

Use the uploaded UI references to preserve the current visual language:
- soft mint / ivory background
- white elevated cards
- dark green headings
- rounded 16–20 px cards
- calm spacing
- green highlights
- image-to-background fading
- Arabic-first RTL hierarchy

The production sanitation images are already stored locally and used by the app:
- `assets/images/welcome-sanitation.jpg`
- `assets/images/auth-sanitation.jpg`
- `assets/images/home-sanitation.jpg`

Do not replace them with hotlinked images unless explicitly requested.

## Latest map reference

The latest uploaded map screenshot is the source of truth for the map correction.

It shows that:
- the previous diagonal green route overlay is incorrect
- the neighborhood/service entry starts from the visible road intersection/junction
- that junction is the main-road entrance
- route geometry must follow actual mapped streets and must never cross buildings or plots
- if exact junction coordinates are not verified, do not fabricate them

For this reason, the app currently leaves Google Maps' actual roads unobstructed instead of drawing an unverified route or polygon. The camera continues to frame the known pilot landmarks and real truck-report coordinates.

When exact coordinates for the junction are later verified, add them as a named constant such as `MAIN_ROAD_START` and only then add a road-aligned polyline if the geometry can be verified.
