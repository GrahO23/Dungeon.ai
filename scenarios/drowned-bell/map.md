---
currentLocationId: saltmere-docks
locations:
  - id: saltmere-docks
    name: Saltmere Docks
    description: Rotting wharves where half the fishing boats sit unmanned, nets tangled and forgotten in the wind.
    connectsTo: [village-square, tide-caves]
    questHook: "Fisherfolk speak of missing boats and strange lights out past the tide-caves."
  - id: village-square
    name: Village Square
    description: A muddy square ringed by shuttered houses, a well nobody drinks from anymore, and a crooked signpost pointing every direction but the one anyone wants to go.
    connectsTo: [saltmere-docks, chapel-ruins, smugglers-den]
    questHook: ""
  - id: smugglers-den
    name: Smugglers' Den
    description: A hidden cellar beneath a shuttered tavern, still stacked with crates of contraband no one's collected in years.
    connectsTo: [village-square, tide-caves]
    questHook: "Old Corwin hides down here, and he knows a way into the tide-caves the cult doesn't watch."
  - id: chapel-ruins
    name: Chapel Ruins
    description: A crumbling shrine whose bell tower has stood empty for a generation, its altar now scrawled with tide-worn symbols that aren't the old faith's.
    connectsTo: [village-square, cliff-path]
    questHook: "The cult has converted the old shrine into a staging ground for something atop the cliff."
  - id: tide-caves
    name: Tide Caves
    description: Sea caves beneath the village, half-flooded at high tide, echoing with chanting that seems to come from everywhere and nowhere.
    connectsTo: [saltmere-docks, smugglers-den, drowned-shrine]
    questHook: "The chanting grows louder toward a shrine deeper in the caves."
  - id: drowned-shrine
    name: Drowned Shrine
    description: A half-submerged grotto where barnacle-crusted idols surround a stone reliquary, guarded by something that used to be a man.
    connectsTo: [tide-caves]
    questHook: "The Sunken Reliquary here is said to be able to bind the Fathomless Choir back to sleep."
  - id: cliff-path
    name: Cliff Path
    description: A narrow, wind-scoured trail switchbacking up the sea cliff toward the lighthouse, waves shattering on the rocks far below.
    connectsTo: [chapel-ruins, lighthouse-sanctum]
    questHook: "The path climbs toward the lighthouse where the ritual will be completed."
  - id: lighthouse-sanctum
    name: Lighthouse Sanctum
    description: The lighthouse's lamp room, stripped of its lens and rebuilt into a ritual circle overlooking a black, churning sea.
    connectsTo: [cliff-path]
    questHook: "The main quest concludes here."
---
