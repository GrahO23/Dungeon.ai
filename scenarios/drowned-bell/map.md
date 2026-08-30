---
currentLocationId: saltmere-docks
locations:
  - id: saltmere-docks
    name: Saltmere Docks
    description: >-
      Rotting wharves where half the fishing boats sit unmanned, nets tangled and forgotten in the
      wind. Barnacles have crept up the mooring posts further than any tide should allow, and a
      few gulls pick at a net full of fish nobody came back to collect. The salt air carries an
      undertone of something colder than brine.
    connectsTo: [village-square, tide-caves]
    questHook: "Fisherfolk speak of missing boats and strange lights out past the tide-caves."
  - id: village-square
    name: Village Square
    description: >-
      A muddy square ringed by shuttered houses, a well nobody drinks from anymore, and a crooked
      signpost pointing every direction but the one anyone wants to go. Faded charms of knotted
      rope hang over every doorway, an old ward against the sea that people have started taking
      seriously again. A curtain twitches in an upstairs window as you pass, then goes still.
    connectsTo: [saltmere-docks, chapel-ruins, smugglers-den]
    questHook: ""
  - id: smugglers-den
    name: Smugglers' Den
    description: >-
      A hidden cellar beneath a shuttered tavern, still stacked with crates of contraband no one's
      collected in years. A single oil lamp gutters near a makeshift bedroll in the corner, and
      the damp stone walls are streaked green with something that isn't mold. A loose floorboard
      by the far wall looks recently disturbed.
    connectsTo: [village-square, tide-caves]
    questHook: "Old Corwin hides down here, and he knows a way into the tide-caves the cult doesn't watch."
  - id: chapel-ruins
    name: Chapel Ruins
    description: >-
      A crumbling shrine whose bell tower has stood empty for a generation, its altar now scrawled
      with tide-worn symbols that aren't the old faith's. Salt-crusted robes are draped over the
      pews like a congregation just stepped out, and the floor near the altar is damp despite there
      being no rain. A faint chanting seems to drift up from somewhere below the flagstones.
    connectsTo: [village-square, cliff-path]
    questHook: "The cult has converted the old shrine into a staging ground for something atop the cliff."
  - id: tide-caves
    name: Tide Caves
    description: >-
      Sea caves beneath the village, half-flooded at high tide, echoing with chanting that seems to
      come from everywhere and nowhere. Bioluminescent algae cast a sickly blue glow across the wet
      stone, and the tidepools here teem with things that don't belong this far from open water.
      The chanting grows louder toward one particular passage deeper in.
    connectsTo: [saltmere-docks, smugglers-den, drowned-shrine]
    questHook: "The chanting grows louder toward a shrine deeper in the caves."
  - id: drowned-shrine
    name: Drowned Shrine
    description: >-
      A half-submerged grotto where barnacle-crusted idols surround a stone reliquary, guarded by
      something that used to be a man. Cold seawater laps at a raised dais in the center, and the
      idols' carved eyes all seem to face the reliquary rather than the entrance, as if fixed on
      guarding it forever. The air here is unnaturally still.
    connectsTo: [tide-caves]
    questHook: "The Sunken Reliquary here is said to be able to bind the Fathomless Choir back to sleep."
  - id: cliff-path
    name: Cliff Path
    description: >-
      A narrow, wind-scoured trail switchbacking up the sea cliff toward the lighthouse, waves
      shattering on the rocks far below. Loose scree makes every step a small gamble, and someone
      has recently driven iron stakes into the rock at intervals — handholds for repeated trips up
      and down, not for hikers. The lighthouse beam above sweeps a color no lamp oil produces.
    connectsTo: [chapel-ruins, lighthouse-sanctum]
    questHook: "The path climbs toward the lighthouse where the ritual will be completed."
  - id: lighthouse-sanctum
    name: Lighthouse Sanctum
    description: >-
      The lighthouse's lamp room, stripped of its lens and rebuilt into a ritual circle overlooking
      a black, churning sea. Salt-slick chains hang from the rafters in place of the old light
      apparatus, and the circle at the center pulses faintly in time with the waves outside. The
      glass walls are fogged with condensation despite the cold, sea wind howling through a
      shattered pane.
    connectsTo: [cliff-path]
    questHook: "The main quest concludes here."
---
