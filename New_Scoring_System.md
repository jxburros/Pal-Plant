# Pal-Plant Social Garden Engine (v2.0)

This system replaces the legacy flat-sum scoring with a **Time-Weighted Relationship Engine** designed to mirror the nuances of human connection, rewarding both long-term stability and immediate momentum.

---

### 1. Individual Friend Health (The Three-Tier Model)
A friend’s score ($S_{friend}$) is a weighted average of three distinct chronological tiers, reflecting different phases of the relationship.

| Tier | Time Range | Weight | Description |
| :--- | :--- | :--- | :--- |
| **Tier 1: Momentum** | 0 – 30 Days | **25%** | Immediate responsiveness and current effort. |
| **Tier 2: Consistency** | 31 – 89 Days | **40%** | The "Sweet Spot" of mid-term maintenance. |
| **Tier 3: Foundation** | 90 Days – 2 Years | **35%** | Historical foundation. Interactions older than 2 years fall off. |

> **Frequency Equalizer:** To ensure friends with different timers reach "Thriving" status at the same rate, points are awarded based on the **Interval Completion Ratio** (Actual Interactions / Expected Interactions for that frequency).

---

### 2. Interaction Channels & Gaming
The "Gaming" channel acknowledges modern digital hangouts, positioned between a standard call and a video call.

| Channel | Point Value | Timer Effect | Notes |
| :--- | :--- | :--- | :--- |
| **Text** | 3 | 0.5x | Casual check-in. |
| **Call** | 7 | 1.0x | Standard voice connection. |
| **Gaming** | **8** | **1.05x** | Shared focus; rewards longer session times. |
| **Video** | 9 | 1.15x | High-fidelity non-verbal connection. |
| **In-Person** | 12 | 1.25x | The gold-standard connection. |

---

### 3. The Living Garden (Real-Time Stakes)
* **The Daily Wilt:** Once a timer passes its buffered deadline (including the 20% grace period), the plant loses health in real-time. The score decreases by **-2 points every 24 hours** until contact is made.
* **The Resurrection Penalty:** If a plant is "Withered" (Score < 10), the first interaction logged provides **50% fewer points**, simulating the effort required to restart a dormant connection.

---

### 4. Dynamic Frequency Calibration
The system monitors the last 5 interactions to ensure social goals are realistic.
* **The "Slow Down" Nudge:** If 3/5 interactions are "Too Early" (>80% timer left), the app suggests **shortening** the timer.
* **The "Grace" Nudge:** If 3/5 interactions are "Overdue," the app suggests **extending** the timer.
* **Soft Limits:** Calibration will never suggest a frequency shorter than **2 days** or longer than **365 days**.

---

### 5. Communication Nuance & Limits
* **Texting Diminishing Returns:** If the last 5 interactions were all `'text'`, the 6th text grants **50% fewer points**. The UI nudges: *"Texting is great, but a quick call would provide more sunlight!"*
* **Meeting Boosts:** Completed meetings provide a temporary global boost.
    * **Full Influence:** 0–30 days.
    * **Moderate Influence:** 31–90 days.
    * **Group Scaling:** Boosts scale by $IndividualBoost \times \sqrt{Friends}$, rewarding group hangouts without making them exploitative.

---

### 6. Global Social Garden Score
The global score is a weighted average prioritizing high-maintenance (frequent) relationships:

$$S_{garden} = \frac{\sum (S_{friend} \times \frac{1}{Frequency})}{\sum \frac{1}{Frequency}}$$
