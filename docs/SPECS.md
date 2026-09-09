# Fleet Transition Planner

## Purpose

The application helps a company decide which vehicles to electrify, when to electrify them, and what the transition will cost.

The fleet consists of one hundred vans with different ages and daily travel distances. The value of replacing a van depends strongly on how far that individual vehicle is driven, so the answer can be different for every vehicle.

## Depot experience

The centre of the application is a 3D model of the depot that acts as a digital twin of a real place.

The depot view shows:

- The fleet.
- The parking layout and parking bays.
- The vehicles in their bays.
- The charging infrastructure.
- The chargers and where they are installed.

As the user moves through the transition years, the depot changes to match the selected year:

- Diesel vans become electric vans.
- Chargers appear.
- The site's power draw rises toward its fixed limit.
- The site turns red when its power limit is exceeded.

The depot view should make the physical consequences of a transition plan immediately understandable. It should show when a financially valid plan is not possible in the actual depot because chargers require space or the depot's power connection would be exceeded.

## Required capabilities

### Vehicle transition planning

The application provides a vehicle list in which the user can select individual vehicles or whole vehicle categories and assign each a transition year.

### Immediate plan results

The application instantly recomputes fleet cost, payback, and emissions whenever the user's choices change.

### Editable assumptions

The user can test different futures by editing:

- Fuel price.
- Electricity price.
- Vehicle cost.
- Charger cost.

### Transition timeline

The user can scrub through a timeline of transition years. The depot updates to match the selected year.

### Plan comparison

The user can compare two transition plans side by side so that choices such as transitioning a vehicle now versus next year have a visible answer.

## Experience qualities

- Results remain responsive while choices change.
- The 3D depot responds to changing plan information rather than following a fixed sequence.
- Charts and comparisons are understandable and trustworthy to a non-technical professional.
- Recommendations explain themselves instead of asking the user to accept them on faith.
