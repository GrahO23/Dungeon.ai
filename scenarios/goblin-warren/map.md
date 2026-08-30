---
currentLocationId: forest-edge
locations:
  - id: forest-edge
    name: Forest Edge
    description: The last light of Millbrook fades behind you as the Greywood's tree line swallows the path ahead.
    connectsTo: [warren-gate]
    questHook: "The trail of broken branches and goblin tracks leads deeper into the wood."
  - id: warren-gate
    name: Warren Gate
    description: A crude palisade of lashed logs and bone trophies marks the entrance to the goblin warren, sunk into a hillside.
    connectsTo: [forest-edge, tunnel-junction]
    questHook: "A lone goblin sentry paces here — the first real obstacle between you and the Sunstone."
  - id: tunnel-junction
    name: Tunnel Junction
    description: Torchlit tunnels reeking of smoke and damp earth branch three ways beneath the hill.
    connectsTo: [warren-gate, goblin-den, chieftains-hall]
    questHook: ""
  - id: goblin-den
    name: Goblin Den
    description: A cramped side-cavern strung with looted trinkets, where a nervous goblin scout keeps watch over the tribe's hoard.
    connectsTo: [tunnel-junction]
    questHook: "Skrit the scout knows the chieftain's guard rotation, if the party can get him talking instead of fighting."
  - id: chieftains-hall
    name: Chieftain's Hall
    description: A wide, bonfire-lit cavern where Chieftain Grulka holds court, the stolen Sunstone gleaming atop a crude throne of stone and bone.
    connectsTo: [tunnel-junction]
    questHook: "The main quest concludes here — recover the Sunstone from Grulka, by force or by wit."
---
