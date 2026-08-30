---
currentLocationId: entrance-antechamber
locations:
  - id: entrance-antechamber
    name: Entrance Antechamber
    description: A torchlit stone hall where Baron Threnody's herald reads out the Trial's rules before the iron gate grinds shut behind each year's contestants, never to reopen from this side.
    connectsTo: [trapped-hall]
    questHook: ""
  - id: trapped-hall
    name: Trapped Hall
    description: A long corridor whose flagstones are subtly discolored where pressure plates hide beneath — the walls are pocked with old dart-holes from contestants who found them the hard way.
    connectsTo: [entrance-antechamber, pit-gallery, riddle-door]
    questHook: "The hall splits toward the pit-gallery's brute hazards or the riddle-door's puzzle route."
  - id: pit-gallery
    name: Pit Gallery
    description: A gallery of false floor tiles over spiked pits, the gaps between safe stones just wide enough to tempt an overconfident stride.
    connectsTo: [trapped-hall, sunken-armory]
    questHook: ""
  - id: sunken-armory
    name: Sunken Armory
    description: A flooded storeroom of past contestants' gear, rusting weapons and waterlogged shields drifting in ankle-deep water.
    connectsTo: [pit-gallery, bone-crypt]
    questHook: "A Brass Sigil is rumored to be hidden among the drowned gear here, said to disarm the vault's guardian."
  - id: bone-crypt
    name: Bone Crypt
    description: A crypt stacked floor to ceiling with the bones of contestants who never made it out, the air thick with old dust and older dread.
    connectsTo: [sunken-armory, vault-chamber]
    questHook: ""
  - id: riddle-door
    name: Riddle Door
    description: A sealed stone door inscribed with a riddle, guarded by the ageless Keeper of Riddles, who answers violence with silence and correct answers with passage.
    connectsTo: [trapped-hall, mirror-maze]
    questHook: "The Keeper of Riddles will grant safe passage through the mirror-maze to whoever solves its riddle."
  - id: mirror-maze
    name: Mirror Maze
    description: A maze of tilted, warped mirrors that split every torch flame into a dozen false ones, built to turn a contestant's own reflection against their sense of direction.
    connectsTo: [riddle-door, vault-chamber]
    questHook: ""
  - id: vault-chamber
    name: Vault Chamber
    description: A vaulted chamber where the Jewel of a Thousand Eyes rests on a plinth, watched over by the towering trap-construct known as the Warden of Torment.
    connectsTo: [mirror-maze, bone-crypt]
    questHook: "The main quest concludes here."
---
