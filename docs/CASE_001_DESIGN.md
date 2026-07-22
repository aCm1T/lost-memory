# Case 001 Design — The Vanishing at Room 407

**ID:** `case-001`  
**Title:** The Vanishing at Room 407  
**Title (ZH):** 《407 号房的失踪者》  
**Difficulty:** normal  
**Estimate:** ~45 minutes  
**Setting:** Harborlight Hotel（港灯酒店）, modern city, one rainy night

**Theme tie-in:** Witnesses misremember the hour; CCTV timestamps and physical traces do not.

This document is the authored truth for implementation. Engine code must read the eventual JSON, not hard-code these names.

---

## 1. Briefing (player-facing)

Freelance photographer **苏晚 (Su Wan)** checked into **Room 407**. Shortly after 23:30, night manager **林岳** opened the door with a master key after guests reported disturbance and unanswered knocks. The door was latched from the inside. Su Wan was gone. Her phone and half-finished work remained. No sign of forced entry. No blood.

The player is a contract investigator asked to reconstruct the night before hotel reputation—and Su Wan’s life—run out of time.

**Initial objectives**

1. Search Room 407 and nearby areas
2. Interview staff and guests
3. Resolve timeline contradictions
4. Submit a supported conclusion

---

## 2. Cast

| ID | Name | Role | Interviewable | Relationship |
| --- | --- | --- | --- | --- |
| `char-su-wan` | 苏晚 Su Wan | Missing guest, photographer | No (notes/clues only) | Victim / missing person |
| `char-zhou-cheng` | 周澄 Zhou Cheng | Su Wan’s business partner | Yes | Culprit |
| `char-lin-yue` | 林岳 Lin Yue | Night manager | Yes | Hotel liability; partially obstructive |
| `char-chen-xia` | 陈夏 Chen Xia | Night housekeeping | Yes | Saw critical movement; pressured to stay quiet |
| `char-fang-yu` | 方予 Fang Yu | Guest in Room 405 | Yes | Heard argument; honest, time-fuzzy |
| `char-he-lan` | 何岚 He Lan | Front-desk clerk (evening shift overlap) | Yes | Saw Zhou’s lobby performance; holds key-log access |

**Personality notes**

- **Zhou Cheng:** Controlled, helpful, rehearsed alibi
- **Lin Yue:** Professional, protects hotel procedures, downplays camera gaps
- **Chen Xia:** Nervous, avoidant until evidence pressure / flag unlocks honesty
- **Fang Yu:** Cooperative, vivid on sounds, weak on exact clock time
- **He Lan:** Precise with logs, cautious with opinions

---

## 3. Truth (author only)

### 3.1 What really happened

Zhou Cheng had been secretly selling a client’s embargoed photographs. Su Wan found the leak trail on a shared drive and told him she would report it in the morning.

Zhou arrived at the hotel, went to 407, argued, and when Su Wan refused to stay silent, he forced a sedative (his prescription tablets dissolved in her tea) and moved her—still alive—through the **service stair** to vacant renovation **Room 412**, which he had obtained access to earlier by convincing staff he was “checking a storage delivery” for their shoot.

He returned to 407, staged a mid-work disappearance, used a **thin cord/latch trick** so the door appeared locked from inside, went down to the lobby by elevator, and built a calm alibi asking about late food—while Su Wan remained hidden in 412.

### 3.2 Motive

Silence Su Wan before she exposed the photo leak (career + legal ruin).

### 3.3 Method summary

1. Sedative in tea during confrontation  
2. Move victim via service stair (camera blind) to Room 412  
3. Fake locked-room latch from outside  
4. Perform lobby alibi

### 3.4 Who lies / omits

| Person | Lie or omission | Why |
| --- | --- | --- |
| Zhou Cheng | Claims he never went upstairs after arriving; stayed in lobby from ~22:15 | Avoid placing himself in 407 |
| Lin Yue | Minimizes service-stair blind spot; vague on temporary card for 412 | Protect hotel / his shift record |
| Chen Xia | Initially denies seeing anyone on service stairs | Zhou intercepted her, paid cash + implied she’d be blamed for “theft from renovation room” |
| Fang Yu | No intentional lie; misremembers argument as “around 23:00” | Stress + no clock check |
| He Lan | Truthful on logs once asked the right question | None |

---

## 4. Complete Truth Timeline

| Time | Event | Evidence later |
| --- | --- | --- |
| 20:40 | Su Wan returns to 407; works on laptop | Laptop sleep log / notes |
| 21:10 | He Lan notes Zhou Cheng called front desk asking if Su Wan had checked in | Call log clue |
| 21:35 | Chen Xia cleans corridor; hears typing in 407 | Early testimony |
| 21:50 | Fang Yu in 405 hears muffled male/female argument next door | Testimony (time fuzzy) |
| 22:05 | Zhou Cheng enters lobby; greets He Lan; asks for Su Wan’s room “to return a lens” | Desk log / He Lan |
| 22:12 | Lin Yue issues temporary access related to “equipment storage” covering 412 renovation zone (or Zhou already holds card from earlier errand—prefer **card swipe log at 22:12**) | Key/card log |
| 22:18 | Elevator camera: Zhou Cheng goes to 4F | Camera still / timestamp |
| 22:20–22:36 | Confrontation in 407; tea poured; sedative used | Two cups, residue, blister pack |
| 22:37 | Su Wan’s watch strikes table / stops during struggle | Stopped watch under bed |
| 22:38–22:46 | Zhou moves Su Wan via service stair to 412 | Wet shoe print, Chen Xia sighting |
| 22:47 | Latch cord staging on 407 door; Zhou leaves phone mid-draft message | Fiber on latch; phone draft |
| 22:50 | Lobby camera: Zhou reappears, asks about noodles | Lobby CCTV |
| 23:05 | Fang Yu notices 407 silent; later complains of earlier noise | Testimony |
| 23:20 | Chen Xia passes 412; hears a thud; Zhou’s earlier threat keeps her quiet | Unlockable testimony |
| 23:32 | Lin Yue master-keys 407 after knocks; empty locked room | Briefing premise |
| Next morning (epilogue if correct) | 412 opened; Su Wan found alive, sedated | Ending |

---

## 5. Locations (3–5+)

| ID | Name | Role |
| --- | --- | --- |
| `loc-room-407` | Room 407 | Primary scene; hotspots for phone, cups, watch, latch, laptop |
| `loc-corridor-4f` | 4F Corridor | Neighbor door, elevator, service stair access point |
| `loc-lobby` | Hotel Lobby | Desk, public CCTV monitor notes, interview staging |
| `loc-service-stair` | Service Stairwell | Prints, unlock after flag/clue |
| `loc-room-412` | Room 412 (renovation) | Late unlock after timeline or key contradiction; confirms method |

Hotspots (examples for implementation):

- 407: phone draft, dual teacups, stopped watch, door latch fiber, laptop/USB note  
- Corridor: 405 door talk trigger, stair door condensation/mud  
- Lobby: visitor log, camera summary board  
- Stair: matching tread print  
- 412: victim presence / restraint traces (non-graphic), renovation card sleeve

---

## 6. Clue List (12–15)

| ID | Name | Type | Source | Key? |
| --- | --- | --- | --- | --- |
| `clue-phone-draft` | Unsent phone draft | communication | 407 | Yes — names fear of Zhou / “leak” |
| `clue-two-cups` | Two tea cups | physical | 407 | Yes — second person |
| `clue-sedative-blister` | Partial blister pack | physical | 407 / trash | Yes — method |
| `clue-stopped-watch` | Watch stopped 22:37 | time | 407 | Yes — time anchor |
| `clue-latch-fiber` | Fiber on inner latch | physical | 407 | Yes — fake lock |
| `clue-elevator-cam` | Elevator still 22:18 | photo/time | Lobby / Lin or He | Yes — Zhou upstairs |
| `clue-lobby-cam` | Lobby still 22:50 | photo/time | Lobby | Yes — alibi gap |
| `clue-card-log-412` | Temp card swipe 412 | record | He Lan / office | Yes — staging room |
| `clue-stair-print` | Wet shoe print | environment | Service stair | Yes — movement path |
| `clue-usb-leak` | USB / mail note on leak | document | 407 laptop | Yes — motive |
| `clue-front-call-log` | Evening call from Zhou | record | Desk | Supporting |
| `clue-cash-envelope` | Cash envelope in Chen’s cart | physical | Corridor / Chen | Supporting — pressure |
| `clue-fang-argument` | Argument testimony | testimony | Fang Yu | Supporting |
| `clue-chen-stair-sight` | Stair sighting testimony | testimony | Chen Xia | Yes when unlocked |
| `clue-zhou-shoes` | Zhou’s damp shoe tread | physical | Lobby interview / observe | Links print |

Red herring (explainable): Lin Yue’s missing “maintenance flashlight” — he used it on roof leak, unrelated; explained via He Lan or Lin when asked after suspicion.

---

## 7. Key Contradictions (3+)

1. **Alibi gap:** Zhou says he stayed in lobby, but elevator camera shows 22:18 ascent and lobby camera 22:50 return (`clue-elevator-cam` + `clue-lobby-cam` [+ optional watch]).  
2. **Locked room vs latch fiber:** Inside latch + exterior staging fiber (`clue-latch-fiber`) contradicts “vanished inside a sealed room.”  
3. **Motive vs partnership story:** Zhou claims they had no conflict; `clue-phone-draft` + `clue-usb-leak` show exposure threat.  
4. **(Bonus) Stair denial vs sighting:** Chen’s early denial vs `clue-chen-stair-sight` after `clue-cash-envelope` / pressure flags.

Evidence link examples:

```json
{
  "clueIds": ["clue-elevator-cam", "clue-lobby-cam"],
  "result": "contradiction",
  "message": "周澄的前台不在场说法，盖不住电梯上行与回到大厅之间的缺口。",
  "setsFlags": ["flag_time_gap"]
}
```

---

## 8. Dialogue Plan (15+ topics)

Topics are illustrative; JSON will expand answers and conditions.

**Zhou Cheng**

1. Relationship with Su Wan  
2. Tonight’s arrival time  
3. Alibi (lobby claim)  
4. Any argument? (lie)  
5. Knowledge of Room 412 (locked until flags)  
6. Photo leak accusation (after `clue-usb-leak`)

**Lin Yue**

7. How 407 was opened  
8. Camera coverage / blind spots  
9. Temporary cards policy  
10. Did Zhou ask for help upstairs?

**Chen Xia**

11. Corridor rounds  
12. Hear anything from 407?  
13. Service stair (locked until pressure flag)  
14. Cash envelope explanation

**Fang Yu**

15. What did you hear?  
16. Exact time? (uncertainty)  
17. Anyone in corridor?

**He Lan**

18. Check-in / visitor notes  
19. Call log from Zhou  
20. Card swipe log for 412  
21. Lobby behavior of Zhou after 22:50

---

## 9. Timeline Minigame (player events)

Discoverable events (IDs) and **correct order**:

1. `evt-su-returns` — 苏晚回到 407 工作  
2. `evt-zhou-arrives` — 周澄抵达大厅  
3. `evt-zhou-upstairs` — 周澄上行至 4 楼  
4. `evt-confrontation` — 407 内争执与下药  
5. `evt-move-412` — 经服役楼梯转移至 412  
6. `evt-stage-lock` — 伪造内锁并离开  
7. `evt-lobby-alibi` — 大厅伪装停留  
8. `evt-manager-open` — 林岳打开 407 发现失踪  

Submitting the correct order sets `timelineSolved` and unlocks Room 412 investigation and/or final deduction.

Mobile: up/down buttons required (drag optional on desktop).

---

## 10. Deduction Design

### 10.1 Dimensions

| Dimension | Correct ID | Label (ZH sketch) |
| --- | --- | --- |
| Person | `char-zhou-cheng` | 周澄 |
| Motive | `motive-silence-leak` | 阻止苏晚揭发盗卖照片 |
| Method | `method-sedate-move-412` | 下药后经服役楼梯藏入 412，并伪造内锁 |
| Required evidence (min 3) | `clue-elevator-cam`, `clue-usb-leak`, `clue-latch-fiber` (accept equivalents set: watch/lobby gap, card log, stair sighting—engine uses `requiredEvidenceIds` + optional `acceptedEvidenceGroups`) | Proof chain |

Recommended proof chain for docs/UI explain:

- Time: elevator vs lobby gap (and/or stopped watch)  
- Physical: latch fiber and/or stair print / 412 card  
- Testimony or document: leak motive + Chen sighting or phone draft

### 10.2 Scoring → Rank

| Rank | Condition (design intent) |
| --- | --- |
| S | Correct person + motive + method + all required evidence; ≤1 wrong submit; major contradictions found |
| A | Correct person + method + motive; most required evidence |
| B | Correct person + method or motive; case closed with gaps |
| C | Correct person only, or correct after many failures / incomplete evidence |

Wrong full submit increments `deductionAttempts` and shows non-spoiling feedback.

### 10.3 Endings (2+)

| ID | Condition | Summary |
| --- | --- | --- |
| `ending-true-rescue` | Correct core deduction (person + method at minimum, or full correct per scoring gate) | 412 opened in time; Su Wan saved; Zhou detained |
| `ending-partial` | Person correct but method/motive wrong or evidence thin | Police take Zhou for questioning; Su Wan found later with delay; bittersweet |
| `ending-missed` (optional third) | Person wrong | Wrong suspect pressure; true trail goes cold for the night |

v1 must ship **at least two** reachable endings.

---

## 11. Flag Map (selected)

| Flag | Set by | Unlocks |
| --- | --- | --- |
| `flag_time_gap` | Evidence link cams | Pressure questions for Zhou / Lin |
| `flag_fake_lock` | Latch fiber inspect or link | Method options / stair focus |
| `flag_chen_pressured` | Cash envelope | Chen stair topic |
| `flag_motive_leak` | USB/mail clue | Zhou accusation topic |
| `timelineSolved` | Timeline submit | `loc-room-412`, deduction nav |
| `flag_412_found` | Inspect 412 | Ending preview state / confirm method |

---

## 12. Fair-Play Checklist

- [x] Truth fixed before clue writing  
- [x] No supernatural explanation  
- [x] No last-minute unknown character as culprit  
- [x] Culprit appears early as interviewable NPC  
- [x] Each critical conclusion has evidence  
- [x] Lies are intentional and resolvable  
- [x] Red herring (flashlight) explainable  
- [x] Player can finish without reading this document, using only in-game data once implemented  

---

## 13. Content Skeleton for Phase 3 JSON

Phase 3 should encode this design into `case-001.json` with:

- `briefing` copy from §1  
- `characters` + `dialogues` from §2 / §8  
- `locations` + hotspots from §5  
- `clues` from §6  
- `evidenceLinks` from §7  
- `timeline` from §9  
- `deduction` + `endings` from §10  

No engine hard-coding of Zhou Cheng as answer outside case JSON `deduction.correct`.
