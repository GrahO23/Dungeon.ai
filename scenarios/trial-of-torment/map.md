---
currentLocationId: entrance-antechamber
locations:
  - id: entrance-antechamber
    name: Entrance Antechamber
    description: >-
      A torchlit stone hall where Baron Threnody's herald reads out the Trial's rules before the
      iron gate grinds shut behind each year's contestants, never to reopen from this side. Faded
      banners from past Trials hang along the walls, each stitched with a name and a year, and the
      newest banner is conspicuously still blank. The herald's voice echoes strangely, as if the
      hall itself is listening.
    connectsTo: [trapped-hall]
    questHook: ""
  - id: trapped-hall
    name: Trapped Hall
    description: >-
      A long corridor whose flagstones are subtly discolored where pressure plates hide beneath —
      the walls are pocked with old dart-holes from contestants who found them the hard way. A
      faint metallic click sounds somewhere ahead every so often, though nothing ever seems to
      trigger it. Dried bloodstains map out where past contestants learned the hard lessons.
    connectsTo: [entrance-antechamber, pit-gallery, riddle-door]
    questHook: "The hall splits toward the pit-gallery's brute hazards or the riddle-door's puzzle route."
  - id: pit-gallery
    name: Pit Gallery
    description: >-
      A gallery of false floor tiles over spiked pits, the gaps between safe stones just wide
      enough to tempt an overconfident stride. A cold draft rises from below, carrying the faint
      smell of old rust, and scorch marks on the ceiling suggest at least one pit is rigged with
      more than just spikes.
    connectsTo: [trapped-hall, sunken-armory]
    questHook: ""
  - id: sunken-armory
    name: Sunken Armory
    description: >-
      A flooded storeroom of past contestants' gear, rusting weapons and waterlogged shields
      drifting in ankle-deep water. Racks along the walls once held an armory's worth of equipment,
      now toppled and half-submerged, and something glints faintly beneath the murk near the far
      wall. The water here never seems to drain, no matter how long the Trial has run.
    connectsTo: [pit-gallery, bone-crypt]
    questHook: "A Brass Sigil is rumored to be hidden among the drowned gear here, said to disarm the vault's guardian."
  - id: bone-crypt
    name: Bone Crypt
    description: >-
      A crypt stacked floor to ceiling with the bones of contestants who never made it out, the air
      thick with old dust and older dread. Someone — or something — has arranged a few of the skulls
      into a deliberate pattern near the far archway, and a low draft makes the whole chamber creak
      like it's settling under its own weight.
    connectsTo: [sunken-armory, vault-chamber]
    questHook: ""
  - id: riddle-door
    name: Riddle Door
    description: >-
      A sealed stone door inscribed with a riddle, guarded by the ageless Keeper of Riddles, who
      answers violence with silence and correct answers with passage. The Keeper sits motionless
      beside the door until spoken to, and the door itself is scored with claw and sword marks from
      contestants who tried to force it rather than solve it.
    connectsTo: [trapped-hall, mirror-maze]
    questHook: "The Keeper of Riddles will grant safe passage through the mirror-maze to whoever solves its riddle."
  - id: mirror-maze
    name: Mirror Maze
    description: >-
      A maze of tilted, warped mirrors that split every torch flame into a dozen false ones, built
      to turn a contestant's own reflection against their sense of direction. Footsteps echo back
      distorted and delayed, and more than one mirror shows a reflection that doesn't quite match
      what's standing in front of it.
    connectsTo: [riddle-door, vault-chamber]
    questHook: ""
  - id: vault-chamber
    name: Vault Chamber
    description: >-
      A vaulted chamber where the Jewel of a Thousand Eyes rests on a plinth, watched over by the
      towering trap-construct known as the Warden of Torment. Every wall here is inset with dormant
      mechanisms — blades, dart tubes, crushing plates — that hum faintly with waiting energy, and
      the Warden's many lensed eyes track anything that moves the moment it enters.
    connectsTo: [mirror-maze, bone-crypt]
    questHook: "The main quest concludes here."
---
