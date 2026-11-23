# Character assets: handoff for Claude Code

Two visitor characters are approved and ready to go into the site. This brief says which image files exist, how to prepare them, and how to wire them into the character select, the fall, the landing and the village.

Read the existing fall and village code first and fit this into the structure that is already there. Paths below are suggestions; follow the repo's own conventions where they differ.

## 1. Source images

These files are under `assets/characters/<id>/source/`. Do not edit the source files; write processed versions next to them.

### visitor-01 (woman, silver hair fading to coral red, red sunglasses on her head)

| File | Contents | Used for |
| --- | --- | --- |
| `portrait.png` | One full-body standing illustration | Character select |
| `turnaround.png` | 4 views, left to right: front, three-quarter, side, back | Reference only |
| `fall.png` | 3 poses, left to right: freefall, parachute, landing | The fall |
| `village-stand.png` | 3 views, left to right: facing down, facing left, facing up | Reference only |
| `village-walk.png` | Walk sheet, 3 rows x 4 columns | Village movement |
| `style-anchor.png` | The first approved image of her, in a different outfit | Reference only |
| `outfits/*.png` | Alternate outfits | Not used yet |

### visitor-02 (man, messy black hair, dark green scarf, long brown coat)

| File | Contents | Used for |
| --- | --- | --- |
| `turnaround.png` | 4 views, left to right: front, three-quarter, side, back | Reference, and a temporary portrait |
| `fall.png` | 3 poses, left to right: freefall, parachute, landing | The fall |
| `village-stand.png` | 3 views, left to right: facing down, facing left, facing up | Reference only |
| `village-walk.png` | Walk sheet, 3 rows x 4 columns | Village movement |
| `earlier-versions/*.png` | Older designs that still have headphones | Not used |
| `portrait.png` | NOT MADE YET | Character select |

Until his portrait exists, crop the front view from his turnaround and use that.

## 2. Prepare the images

All sheets are hand-drawn figures with a thick dark outline on a near-white background. Figures are spaced by eye, not on a grid.

1. Detect each figure by its bounding box. Do not assume equal cells.
2. Remove the background to transparency. Flood-fill from outside the figure and stop at the outline, and also clear enclosed background areas (between an arm and the body, between the legs). Be careful with visitor-01's off-white shirt, which is close to the background color: clear by connectivity, not by color alone. Leave no white halo.
3. Fall sheets: export each pose as its own PNG with a little padding. Scale the three poses of a character so the head is the same size in each (visitor-01's freefall pose was drawn smaller than the other two).
4. Walk sheet: scale every frame so the standing figure is the same height in all three rows, then place each frame in an equal-sized cell anchored at the bottom center of the feet. Export one sprite sheet PNG plus a JSON file with rows, columns and cell size.
   - Rows: 1 = facing down (toward the viewer), 2 = facing left, 3 = facing up (away).
   - Columns: stand, step A, stand, step B.
5. Build a preview page that shows every processed image on both a light and a dark background, and plays each animation. Show it to me before wiring anything into the site.

## 3. Character data

Keep one config that lists the characters: id, display name, image paths, sprite cell size and which assets exist. The site reads from it, so adding a character later means adding a folder and one entry. The host character (the site owner) is not designed yet; leave room for a third entry.

If a character is missing an asset, degrade gracefully instead of failing: use the fallback named in this brief, or a simple placeholder.

## 4. Wiring

Do these in order, one at a time, and show me each before starting the next.

1. **Character select.** On the airplane screen, show the available portraits and remember the choice.
2. **The fall.** Scroll-driven and short, about 2 to 3 screen heights. Use the freefall pose from the jump until roughly 60% of the way down, the parachute pose from there to just above the ground, and the landing pose at the ground.
   - The parachute pose has two straps that run off the top edge of the image. Draw the canopy in code above them.
   - All continuous motion comes from code: a slight sway, drift toward the content being shown, wind streaks, the parachute swinging.
   - Swap poses with a quick snap plus a small tilt or bounce, not a crossfade.
   - Scrolling back up must play the fall in reverse.
3. **Landing.** Cover the switch from the landing pose to the village sprite with a short dust burst or white flash, then show the village from above with the sprite standing where the character landed.
4. **Village movement.** Idle shows column 1 of the walk sheet. While moving, loop columns 1-2-3-4 at about 8 frames per second. Facing right is row 2 flipped horizontally. Support arrow keys, WASD and click or tap to move. Draw a soft ellipse shadow under the feet in code.

## 5. Checks before calling it done

- No white halo around any figure on light or dark backgrounds.
- No jitter in the walk: the feet stay on one line.
- The pose swap during the fall never shows two poses at once.
- Scrolling up reverses the fall cleanly.
- It works at phone width.
- Selecting visitor-02 works while his portrait is still the cropped turnaround view.

## 6. Art still to come

- visitor-02: a clean standing portrait without headphones.
- The host character.
- Optional: visitor-01's village form draws her sunglasses as round balls; a flatter version may replace it later, with the same file names.
