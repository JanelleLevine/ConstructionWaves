# San Francisco Wave Fractals

## Project goal

Build an interactive web-based data-art visualization inspired by the flowing,
fractal aesthetic of Shirley Wu's "Dive Fractals."

The visualization should use real ocean buoy observations from NOAA/NDBC
station 46026, located offshore of San Francisco.

The scientific data must remain interpretable. The fractal/generative treatment
should enhance the visual appearance without obscuring or changing the
underlying values.

This is an exploratory data-art project, not a conventional oceanographic
dashboard.

---

# 1. Core visual concept

The fundamental visual unit is ONE MONTH.

A selected month should appear as ONE continuous horizontal flowing ribbon
running from left to right.

The x-axis represents time within the month:

    left = first day of month
    right = last day of month

Each day contributes one set of summary statistics derived from the raw buoy
observations for that local calendar day.

The ribbon represents significant wave height.

For each day calculate:

    p10 = 10th percentile significant wave height
    mean = mean significant wave height
    p90 = 90th percentile significant wave height

Visual mapping:

    x position
        = day of month

    centerline y position
        = daily mean significant wave height

    lower/upper ribbon boundaries
        = daily p10 and p90 significant wave height

    ribbon color
        = daily mean sea-surface temperature

Therefore, the ribbon shows BOTH:

    1. how the typical sea state changes over the month
    2. how variable wave conditions were within each day

Do NOT call p10 and p90 "daily low wave" and "daily high wave."
They are percentiles of significant wave-height observations.

---

# 2. Scientific variables

Use NOAA/NDBC station:

    Station ID: 46026
    Location: offshore San Francisco

Use these fields from NDBC standard meteorological observations:

    WVHT = significant wave height, meters
    WTMP = sea-surface temperature, degrees C
    DPD  = dominant wave period, seconds
    APD  = average wave period, seconds
    MWD  = mean wave direction, degrees

For version 1:

    WVHT drives geometry.
    WTMP drives color.

DPD, APD and MWD should be preserved in the processed dataset even if they are
not initially visualized. They may become useful in later artistic experiments.

---

# 3. Initial dataset

Use calendar year:

    2025

Use the complete historical standard meteorological dataset for NDBC station
46026.

Download and process the data in a Node script rather than requesting NOAA data
directly from the browser.

The application itself should load a LOCAL processed JSON file.

Reasons:

    - reproducible visualization
    - avoids browser CORS problems
    - separates data cleaning from rendering
    - prevents unnecessary NOAA requests
    - makes debugging much easier

Do not use fabricated/sample ocean values if downloading or parsing fails.
Surface the error instead.

---

# 4. Time handling

NDBC historical observations are timestamped in UTC.

Convert every observation to:

    America/Los_Angeles

BEFORE grouping observations into days.

This is important because an observation shortly after midnight UTC may belong
to the previous calendar day in San Francisco.

Use a timezone-aware library such as Luxon.

Never group observations into days using UTC dates.

---

# 5. Raw-data parsing requirements

The NDBC text file is whitespace-delimited.

The parser should:

    - detect the column header rather than assuming hard-coded positions
    - tolerate variable amounts of whitespace
    - treat "MM" as missing/null
    - convert numeric fields to numbers
    - ignore unit/header rows
    - reject malformed observation rows gracefully
    - preserve the original timestamp
    - create a timezone-adjusted local timestamp

Create a typed raw-observation interface.

Suggested shape:

    interface RawObservation {
        timestampUtc: string;
        timestampLocal: string;
        localDate: string;

        WVHT: number | null;
        WTMP: number | null;
        DPD: number | null;
        APD: number | null;
        MWD: number | null;
    }

Do not convert missing observations to zero.

Zero wave height and missing wave height are NOT equivalent.

---

# 6. Daily aggregation

Aggregate the complete 2025 dataset into ONE record per San Francisco local day.

Suggested output interface:

    interface DailyWaveSummary {
        date: string;
        year: number;
        month: number;
        day: number;

        observationCount: number;
        validWaveObservationCount: number;

        waveHeightMean: number | null;
        waveHeightP10: number | null;
        waveHeightP90: number | null;

        waterTempMean: number | null;

        dominantPeriodMean: number | null;
        averagePeriodMean: number | null;

        meanWaveDirection: number | null;
    }

For WVHT:

    calculate mean
    calculate 10th percentile
    calculate 90th percentile

Percentiles must be calculated from valid WVHT observations only.

For WTMP:

    calculate mean from valid values only.

For DPD and APD:

    calculate means from valid values only.

For MWD:

Do NOT calculate a normal arithmetic mean of degrees because direction is
circular.

Either:

    - calculate a proper circular mean

or:

    - leave meanWaveDirection null for version 1

Prefer a correct circular mean if simple to implement.

---

# 7. Data-quality rule

Do not assume the observation frequency is identical on every day.

For each month:

    calculate the median number of valid WVHT observations among its days.

Mark a day as insufficient if it contains fewer than 50% of that month's median
valid observation count.

For insufficient days:

    waveHeightMean = null
    waveHeightP10 = null
    waveHeightP90 = null

Preserve observation counts so the reason can be inspected.

Do not interpolate missing scientific data during preprocessing.

---

# 8. Processed output

Generate:

    public/data/46026-2025-daily.json

The file should contain:

    station metadata
    year
    units
    daily summaries

Suggested top-level shape:

    {
        "station": {
            "id": "46026",
            "name": "San Francisco",
            "timezone": "America/Los_Angeles"
        },
        "year": 2025,
        "units": {
            "waveHeight": "m",
            "waterTemperature": "C",
            "wavePeriod": "s",
            "waveDirection": "degrees"
        },
        "days": [...]
    }

The visualization should consume this processed file only.

---

# 9. Technology

Use:

    Vite
    React
    TypeScript
    D3
    Luxon

Start rendering with SVG.

Use D3 primarily for:

    scales
    statistics
    interpolation
    path generation
    color scales

React should control:

    selected month
    data loading
    UI state
    tooltip state

Do not use a charting library such as Recharts, Chart.js or Plotly.

This is a custom visualization.

---

# 10. Application structure

Use approximately this structure:

    wave-fractals/
    ├── public/
    │   └── data/
    │       └── 46026-2025-daily.json
    │
    ├── scripts/
    │   ├── fetchNdbc.ts
    │   ├── parseNdbc.ts
    │   └── aggregateDaily.ts
    │
    ├── src/
    │   ├── components/
    │   │   ├── WaveRibbon.tsx
    │   │   ├── DebugWaveChart.tsx
    │   │   ├── MonthSelector.tsx
    │   │   ├── TemperatureLegend.tsx
    │   │   └── Tooltip.tsx
    │   │
    │   ├── lib/
    │   │   ├── scales.ts
    │   │   ├── statistics.ts
    │   │   ├── fractal.ts
    │   │   └── types.ts
    │   │
    │   ├── App.tsx
    │   └── main.tsx
    │
    ├── PROJECT_SPEC.md
    └── package.json

Adjust the structure if technically necessary, but preserve the separation
between:

    raw-data acquisition
    aggregation
    visualization
    generative/fractal rendering

---

# 11. Phase 1: boring scientific visualization

DO THIS BEFORE CREATING FRACTALS.

Create a debug visualization for the selected month.

For each day:

    x = day

Draw:

    line = daily mean WVHT

    shaded area =
        daily p10 WVHT through daily p90 WVHT

Use an ordinary linear y-axis labeled:

    Significant wave height (m)

Show day-of-month labels on x.

The purpose is to determine whether the processed data and mapping are correct.

Do not add generative noise in this phase.

---

# 12. Scaling rules

This is extremely important.

The y-scale must NOT automatically rescale independently for every month.

Calculate the wave-height domain from ALL valid 2025 daily p10/p90 values.

Use that same y-domain for every month.

This makes January, July, October, etc. visually comparable.

Likewise, calculate the water-temperature color domain using the ENTIRE 2025
dataset, not each individual month.

A particular temperature must always correspond to the same color throughout
the year.

Add small sensible padding around the wave-height domain.

Do not exaggerate month-to-month variation through independent scaling.

---

# 13. Phase 2: base ribbon

Once the debug chart is verified, convert it into the primary data-art form.

The ribbon should run horizontally.

Create:

    upper boundary = p90 WVHT
    centerline = mean WVHT
    lower boundary = p10 WVHT

Use smooth interpolation between daily observations.

Prefer a smooth curve such as Catmull-Rom or another D3 curve that does not
produce extreme overshoot.

The smooth visual curve must still pass through or faithfully represent the
daily data anchors.

Do not allow interpolation to create impossible negative wave heights.

Days with insufficient data should produce an honest break/gap rather than a
fabricated value.

---

# 14. Water-temperature color

Color the ribbon according to daily mean WTMP.

Temperature should change gradually along the x direction.

Use a continuous color scale based on the full year's temperature domain.

Create an SVG gradient with color stops corresponding to the daily
temperature observations.

The gradient must therefore represent actual changes in temperature through
the month rather than one average color for the entire month.

Add a small temperature legend showing:

    coldest temperature represented
    warmest temperature represented
    degrees C

The design can later be refined aesthetically.

Scientific consistency is more important than choosing the final palette now.

---

# 15. Phase 3: fractal / silk treatment

Only implement this after the base ribbon is correct.

The desired feeling is:

    silk in water
    smoke-like flow
    layered organic filaments
    sweeping fractal lines

The fractal treatment must remain CONSTRAINED by the real ribbon boundaries.

Do not modify the underlying daily p10, mean or p90 values.

Generate approximately 30-60 fine internal strands.

Each strand should travel horizontally across the month.

For a strand with normalized position t between 0 and 1:

    t = 0 corresponds approximately to the lower ribbon edge
    t = 1 corresponds approximately to the upper ribbon edge

At each daily x position:

    baseY =
        interpolate(lowerBoundaryY, upperBoundaryY, t)

Then add a SMALL deterministic organic displacement.

Requirements:

    - displacement must be bounded
    - strands should not wander far outside the data ribbon
    - underlying daily wave-height structure must remain visible
    - use coherent/smooth variation rather than independent random noise
    - randomness must be seeded so the visualization does not change every
      React render
    - the same month should always generate the same shape

A recursive midpoint-displacement/fractal-subdivision approach is appropriate.

Crucially:

    preserve each day's scientific anchors
    perturb the curve BETWEEN anchors

Do not randomly alter the data itself.

---

# 16. Fractal implementation idea

Implement a reusable function conceptually similar to:

    createFractalSegment(
        startPoint,
        endPoint,
        seed,
        roughness,
        depth
    )

The algorithm can recursively subdivide a segment:

    1. find midpoint
    2. apply a bounded perpendicular displacement
    3. recursively subdivide both halves
    4. decrease displacement at each recursion level

Use deterministic seeded randomness.

For our visualization, use this technique primarily to create texture BETWEEN
daily anchor points.

The endpoints representing each day must remain fixed.

Keep roughness subtle in version 1.

---

# 17. Centerline

The daily mean wave-height centerline is scientifically useful.

Initially draw it subtly through the fractal ribbon.

It should be visible enough during development to verify that the fractal
effect follows the data.

Later, make its visibility configurable:

    Show mean line: ON/OFF

The final artistic version may hide it if the ribbon communicates the data
clearly without it.

---

# 18. Interaction

Add a month selector containing:

    January
    February
    March
    April
    May
    June
    July
    August
    September
    October
    November
    December

Default:

    January

Changing months should update the ribbon without changing the global y or color
scales.

Hovering near a daily position should display:

    date
    mean significant wave height
    10th percentile significant wave height
    90th percentile significant wave height
    mean water temperature
    dominant wave period, if available
    valid observation count

Format values sensibly:

    wave heights: 2 decimals + m
    temperatures: 1 decimal + °C
    periods: 1 decimal + s

---

# 19. Optional storminess variable

DO NOT implement this in the first visual version.

Preserve the possibility of adding it later.

Possible later encodings include:

    strand opacity
    strand density
    roughness
    animation intensity

Potential storminess metrics could be based on:

    high wave-height percentile
    daily maximum WVHT
    wave-height variability
    wind speed

But no opacity/storm mapping should be added until the existing:

    position
    ribbon width
    temperature color

are visually successful.

Do not overload the chart.

---

# 20. Responsive layout

Visualization should work on desktop first.

Use an SVG viewBox so the graphic scales responsively.

Initial target aspect ratio:

    approximately 1200 x 500

Use generous margins.

Do not allow axis labels or legends to overlap the ribbon.

---

# 21. Visual design

The final direction should feel closer to editorial data art than a dashboard.

Avoid:

    cards everywhere
    excessive borders
    generic SaaS styling
    heavy grid lines
    giant UI controls

Prefer:

    whitespace
    restrained typography
    subtle axes
    emphasis on the flowing data form

The ribbon should dominate the page.

Possible title:

    A Month at Sea

Possible subtitle:

    Significant wave height and sea-surface temperature
    San Francisco buoy 46026 · January 2025

Include a small source note:

    NOAA National Data Buoy Center · Station 46026

---

# 22. Development controls

During development, include a small debug panel allowing:

    Show debug area
    Show mean centerline
    Show fractal strands
    Number of strands
    Fractal roughness

These controls are for experimentation.

They do not need to be part of the final artwork.

Constrain controls to safe ranges so they cannot distort the visualization
beyond recognition.

---

# 23. Validation

Before considering the data pipeline complete, verify:

    - "MM" is never interpreted as zero
    - UTC observations are grouped by America/Los_Angeles date
    - January has dates 1 through 31 where data are available
    - February has the correct number of calendar dates
    - p10 <= mean <= p90 for every valid day
    - no wave height is negative
    - no NaN values appear in generated JSON
    - incomplete days are marked rather than invented
    - temperature averages ignore missing values
    - the same month always produces identical seeded fractal geometry

Add automated tests for:

    percentile calculation
    NDBC parsing
    missing-value handling
    timezone conversion
    daily grouping

---

# 24. Important conceptual constraints

The visualization must distinguish:

DATA TRANSFORMATION
    aggregation, percentiles, means

from:

VISUAL TRANSFORMATION
    interpolation, fractal subdivision, strand rendering

Never allow visual noise to change the scientific values.

The actual daily observations must always be recoverable from the processed
JSON.

The p10/mean/p90 boundaries are the ground truth of the artwork.

---

# 25. Implementation order

Implement the project in this exact order:

1. Initialize Vite + React + TypeScript.
2. Install required dependencies.
3. Implement NDBC download script.
4. Implement NDBC parser.
5. Implement timezone conversion.
6. Implement daily aggregation.
7. Generate 2025 processed JSON.
8. Validate processed data.
9. Build month selector.
10. Build boring debug area/line chart.
11. Verify January, July and November visually.
12. Establish fixed annual y-scale.
13. Establish fixed annual temperature scale.
14. Build smooth base ribbon.
15. Add temperature gradient.
16. Add tooltip.
17. Add deterministic internal strands.
18. Add subtle fractal subdivision.
19. Add development controls.
20. Refine typography/layout.

Do not jump directly to Step 17.

---

# 26. First milestone

The FIRST milestone is complete when:

    npm run dev

opens a page where I can select any month in 2025 and see:

    - daily mean significant wave height as a line
    - daily p10-p90 significant wave-height range as an area
    - a correct wave-height axis
    - hover values
    - no fractal styling

At this milestone, STOP and let me inspect the result before implementing the
fractal treatment.

---

# 27. Second milestone

After I approve Milestone 1:

Build the smooth colored ribbon.

The second milestone is complete when:

    - p10/p90 define the ribbon boundaries
    - mean defines the centerline
    - water temperature creates a continuous x-direction color gradient
    - months share consistent scales
    - missing-data gaps remain visible

STOP again for visual review.

---

# 28. Third milestone

After I approve Milestone 2:

Implement the silk/fractal rendering.

The third milestone is complete when:

    - multiple deterministic strands create an organic flowing texture
    - the strands remain visually constrained to the measured wave-height band
    - the original p10/mean/p90 pattern is still recognizable
    - changing months produces meaningfully different shapes
    - reloading does not randomize the visualization

---

# 29. Coding behavior

Favor readable, modular code over clever code.

Use TypeScript types throughout.

Explain unusual mathematical transformations with short comments.

Do not silently change the visual encoding described in this specification.

If a technical constraint requires changing the data mapping, stop and explain
the issue before changing it.

Do not fabricate ocean data to make the visualization prettier.

Do not begin polishing CSS until the data pipeline and debug visualization are
correct.