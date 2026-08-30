---
currentLocationId: forest-edge
locations:
  - id: forest-edge
    name: Forest Edge
    description: >-
      The last light of Millbrook fades behind you as the Greywood's tree line swallows the path
      ahead. Broken branches and half-frozen mud mark where something heavy was dragged through
      recently, and the air already smells faintly of woodsmoke that isn't yours. Somewhere deeper
      in, a crow calls once and falls silent.
    connectsTo: [warren-gate]
    questHook: "The trail of broken branches and goblin tracks leads deeper into the wood."
  - id: warren-gate
    name: Warren Gate
    description: >-
      A crude palisade of lashed logs and bone trophies marks the entrance to the goblin warren,
      sunk into the side of a low hill. Crow skulls and strips of tanned hide sway from the
      lashings, meant to unnerve more than to ward off, and a well-worn footpath of churned mud
      leads straight through the open gate. A dented cooking pot, still warm, sits abandoned by a
      cold fire pit just inside — whoever was tending it left in a hurry.
    connectsTo: [forest-edge, tunnel-junction]
    questHook: "A lone goblin sentry paces here — the first real obstacle between you and the Sunstone."
  - id: tunnel-junction
    name: Tunnel Junction
    description: >-
      Torchlit tunnels reeking of smoke and damp earth branch three ways beneath the hill, the
      walls slick with condensation and scored with crude tally marks. Roots from the forest
      above pierce through the ceiling here and there, and a low, constant murmur of goblin
      voices and clattering pots echoes up from somewhere deeper in the warren.
    connectsTo: [warren-gate, goblin-den, chieftains-hall]
    questHook: ""
  - id: goblin-den
    name: Goblin Den
    description: >-
      A cramped side-cavern strung with looted trinkets — bent silverware, a child's shoe, a
      cracked hand mirror — hung from twine like grim decorations. A nervous goblin scout keeps
      watch over the tribe's hoard from a nest of stolen blankets, flinching at every echo from
      the tunnels beyond.
    connectsTo: [tunnel-junction]
    questHook: "Skrit the scout knows the chieftain's guard rotation, if the party can get him talking instead of fighting."
  - id: chieftains-hall
    name: Chieftain's Hall
    description: >-
      A wide, bonfire-lit cavern where Chieftain Grulka holds court from a crude throne of stacked
      stone and bleached bone. The stolen Sunstone sits in a nest of straw at her feet, still
      giving off a faint warmth that keeps the whole hall a few degrees above the tunnels outside.
      Goblin guards ring the walls, and the smell of scorched fat hangs thick over everything.
    connectsTo: [tunnel-junction]
    questHook: "The main quest concludes here — recover the Sunstone from Grulka, by force or by wit."
---
