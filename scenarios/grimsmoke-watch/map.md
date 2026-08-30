---
currentLocationId: watch-house
locations:
  - id: watch-house
    name: Grimsmoke Watch House
    description: >-
      A leaning, ink-stained building where the duty sergeant hands out assignments no one wants
      and the clock has struck the wrong hour for decades. Case files are stacked in towers that
      lean at angles no self-respecting building code would allow, and a pot of tea has gone cold
      on the sergeant's desk since sometime this morning. The smell of wet wool and cheap lamp oil
      hangs over everything.
    connectsTo: [rattlebridge-canal]
    questHook: ""
  - id: rattlebridge-canal
    name: Rattlebridge Canal
    description: >-
      A sluggish, foul-smelling waterway where a body was just pulled out, one hand still closed
      around a brass seal that shouldn't exist. Rain needles the black water in rings, a
      constable's lantern throws long shadows across the towpath, and a small crowd of onlookers
      has already gathered at a polite, professionally uninterested distance. The seal itself
      gleams faintly under the lamplight, unmarked by rust despite the water.
    connectsTo: [watch-house, tannery-district]
    questHook: "The seal clutched in the dead man's hand is the whole case, if anyone can work out what it means."
  - id: tannery-district
    name: Tannery District
    description: >-
      A grimy warren of curing-sheds and narrow lanes where the smell alone keeps most Watch
      patrols brief, and where informants trade in gossip nobody else wants to hear. Hides hang
      drying in rows between the buildings, dripping a faint chemical tang into the rain, and a
      few wary faces watch from doorways before ducking back inside. Someone has chalked a crude
      guild sigil on a wall that doesn't belong to any guild the Watch has on file.
    connectsTo: [rattlebridge-canal, guild-quarter]
    questHook: "Tannery gossip points toward someone flashing forged guild credentials around the Guild Quarter."
  - id: guild-quarter
    name: Guild Quarter
    description: >-
      A row of imposing, jealously separate guildhalls, each with its own brass plaque, its own
      rulebook, and its own opinion of the others. Liveried clerks hurry between buildings clutching
      sealed correspondence, and the air carries the particular hush of institutions that would
      much rather settle things privately than in front of the Watch. A noticeboard outside the
      Assassins' Guild lists this week's licensed contracts in tidy, unsettling handwriting.
    connectsTo: [tannery-district, thieves-market, high-street]
    questHook: "The legitimate Assassins' Guild wants this scandal handled quietly, and might help if approached the right way."
  - id: thieves-market
    name: Thieves' Market
    description: >-
      A licensed black market bazaar, loud and crowded, where stolen goods change hands as openly
      as bread at any other market. Stalls sag under recovered silverware, "unclaimed" jewelry, and
      the occasional item still bearing a very recognizable house crest. A fence with ink-stained
      fingers watches the Watch approach with the calm of someone who has already paid this
      month's licensing fee.
    connectsTo: [guild-quarter, sewer-tunnels]
    questHook: "Fenced goods here trace back to whoever is funding the forged contracts."
  - id: high-street
    name: High Street
    description: >-
      A row of tall, narrow townhouses belonging to the city's guild-wealthy, where appearances
      matter more than honesty. Freshly swept steps and polished door-knockers front houses whose
      upper windows stay curtained even at midday, and a liveried footman or two loiter with the
      studied indifference of people paid well to notice nothing. One townhouse's coal cellar door
      shows fresh scuff marks that don't match any coal delivery.
    connectsTo: [guild-quarter, counting-house]
    questHook: "One of these households has been quietly bankrolling something it would rather the Watch never found."
  - id: counting-house
    name: Aldermen's Counting-House
    description: >-
      A cramped office of ledgers and wax seals, officially neutral ground for the city's financial
      disputes. Clerks in ink-smudged sleeves shuffle between towering shelves of bound accounts,
      and a heavy strongroom door at the back is guarded more by bureaucratic tedium than by any
      actual lock. One ledger on the nearest desk is bookmarked with a scrap of paper bearing a
      seal that looks uncomfortably familiar.
    connectsTo: [high-street, sewer-tunnels]
    questHook: "A ledger here could prove exactly who's been funding the forged guild seals."
  - id: sewer-tunnels
    name: Sewer Tunnels
    description: >-
      A dry, lantern-lit stretch of old tunnel beneath the city, fitted out as a brokerage office
      for business that can't be done in daylight. A proper desk, an actual filing cabinet, and a
      disquietingly tidy ledger sit incongruously among the brickwork, watched over by a
      well-dressed figure who looks entirely too comfortable this far underground. The distant
      drip of water is the only sound besides the scratch of a pen.
    connectsTo: [thieves-market, counting-house]
    questHook: "The main quest concludes here."
---
