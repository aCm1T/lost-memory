# Case 002 Design — The Echo at 00:13

**ID:** `case-002`  
**Title:** The Echo at 00:13  
**Title (ZH):** 《零点十三分的回声》  
**Difficulty:** hard  
**Estimate:** 50–60 minutes  
**Setting:** Starport Radio（星港广播台）, late night

**Theme:** Hearing someone’s voice does not mean that person was speaking at that moment.

This document is the authored truth for implementation. Engine code must read the JSON, not hard-code these names.

---

## 1. Briefing (player-facing)

Deep-night investigation host **许知微 (Xu Zhiwei)** is found unconscious in a locked soundproof booth attached to Edit Suite B. A master source disc for the show is missing.

At **00:13**, Xu’s voice still aired a closing tag — staff and listeners believed it was live, so many assume she was awake then.

Executive producer **罗景舟 (Luo Jingzhou)** has been in the lobby since about **00:05**, with CCTV, visitor notes, and a café receipt as an alibi.

**Initial objectives**

1. Search the studio, edit suite, control room, and equipment areas
2. Interview staff and the finance contact
3. Resolve what 00:13 really was
4. Submit a supported conclusion

---

## 2. Cast

| ID                  | Name                | Role                         | Interviewable | Notes                                     |
| ------------------- | ------------------- | ---------------------------- | ------------- | ----------------------------------------- |
| `char-xu-zhiwei`    | 许知微 Xu Zhiwei    | Host / victim                | No            | Known via notes, audio, testimony         |
| `char-luo-jingzhou` | 罗景舟 Luo Jingzhou | Executive producer / culprit | Yes           | Calm, rehearsed lobby alibi from ~00:05   |
| `char-tang-shuo`    | 唐朔 Tang Shuo      | Audio engineer               | Yes           | Knows auto-play; hid unauthorized absence |
| `char-lin-wu`       | 林雾 Lin Wu         | Night intern                 | Yes           | First to notice silence; fuzzy on clock   |
| `char-he-yuan`      | 贺原 He Yuan        | Night security               | Yes           | Door logs + master card (red herring)     |
| `char-xia-yu`       | 夏予 Xia Yu         | Finance contact / tipster    | Yes           | Holds sponsor/ledger truth; cautious      |

---

## 3. Truth (author only)

### 3.1 What really happened

Xu discovered Luo was embezzling charity-linked sponsorship funds via fake contracts and forged invoices. She planned to expose the books on the next show and stored proof on a **master disc** plus a **scheduled email draft**.

Around **23:40** she recorded a backup closing tag. Around **23:46** Luo confronted her in the edit suite. By **~23:52** she was incapacitated (non-graphic; still savable). Luo locked her in the soundproof inner booth, took the disc, edited the earlier take into a fake “00:13 live closing,” and queued auto-play for **00:13**. By **~00:05** he was in the lobby manufacturing a verifiable alibi. At **00:13** the system played the forgery. Around **00:24** the intern noticed no response; at **00:31** security opened the booth.

### 3.2 Motive

Stop Xu from exposing embezzlement of charity/sponsorship funds.

### 3.3 Method summary

1. Incapacitate Xu during confrontation; lock soundproof booth
2. Steal master disc
3. Edit earlier outro take; schedule auto-play at 00:13
4. Appear in lobby from ~00:05 with receipts/logs

### 3.4 Who lies / omits

| Person | Lie or omission                                      | Why                                      |
| ------ | ---------------------------------------------------- | ---------------------------------------- |
| Luo    | Claims continuous lobby presence; denies edit access | Avoid placing himself in production wing |
| Tang   | Downplays leaving the control desk                   | Fear of being fired for absence          |
| Lin    | Misremembers when the “live” voice aired             | Stress + no clock check                  |
| He     | Defensive about master-card use                      | Looks guilty; actually followed protocol |
| Xia    | Withholds ledger details until pressed               | Career risk                              |

---

## 4. Complete Truth Timeline

| Time         | Event                                        |
| ------------ | -------------------------------------------- |
| ~23:40       | Xu records backup closing tag                |
| ~23:46       | Confrontation in edit suite                  |
| ~23:52       | Xu incapacitated; still treatable            |
| ~23:55       | Luo locks inner booth; takes master disc     |
| ~00:00–00:04 | Luo edits take; queues auto-play for 00:13   |
| ~00:05       | Luo arrives lobby; creates verifiable traces |
| 00:13        | Forged audio auto-plays                      |
| ~00:24       | Intern notices host not responding           |
| 00:31        | Security opens booth; Xu found               |

---

## 5. Locations

| ID                       | Name                | Role                                       |
| ------------------------ | ------------------- | ------------------------------------------ |
| `loc-studio-a`           | 直播间 Studio A     | Mic log, Xu desk draft, aircheck listen    |
| `loc-edit-suite-b`       | 编辑室 Edit Suite B | Recorder, DAW, Luo workstation, inner door |
| `loc-control-room`       | 播控室              | Auto-queue, terminal login, maint log      |
| `loc-equipment-corridor` | 设备走廊            | Access panel, hidden disc                  |
| `loc-lobby`              | 大堂                | Receipt, visitor trace, Luo interview hub  |

---

## 6. Clue List (18)

| ID                       | Name                 | Key? | Proof role            |
| ------------------------ | -------------------- | ---- | --------------------- |
| `clue-mic-log`           | 麦克风未开日志       | Yes  | 00:13 not live        |
| `clue-auto-queue`        | 自动播出队列         | Yes  | 00:13 scheduled       |
| `clue-outro-export`      | 结束语导出时间 23:40 | Yes  | Early take            |
| `clue-backup-take`       | 备用结束语原始文件   | Yes  | Source material       |
| `clue-calib-tone`        | 背景校准音痕迹       | Yes  | Early recording       |
| `clue-maint-log`         | 校准设备维护记录     | Yes  | Tone impossible later |
| `clue-waveform-cut`      | 波形剪辑断点         | Yes  | Editing               |
| `clue-broadcast-file`    | 00:13 播出文件       | Yes  | Matches early take    |
| `clue-sponsor-ledger`    | 赞助账目摘要         | Yes  | Motive                |
| `clue-fake-invoice`      | 虚假发票复印件       | Yes  | Motive                |
| `clue-email-draft`       | 定时邮件草稿         | Yes  | Motive / intent       |
| `clue-disc-catalog`      | 资料盘目录           | Yes  | What was stolen       |
| `clue-terminal-login`    | 播控终端登录         | Yes  | Opportunity           |
| `clue-workstation-cache` | 制作人工作站缓存     | Yes  | Luo edited            |
| `clue-access-log`        | 设备区门禁记录       | Yes  | Access                |
| `clue-hidden-disc`       | 藏匿的资料盘         | Yes  | Recovery              |
| `clue-lobby-receipt`     | 大堂消费小票         | No   | Alibi performance     |
| `clue-master-key`        | 保安万能卡使用记录   | No   | Red herring           |

---

## 7. Key Evidence Links (exactly 2 clueIds each)

1. `clue-auto-queue` + `clue-mic-log` → not live (`flag_not_live`)
2. `clue-calib-tone` + `clue-maint-log` → early recording (`flag_early_recording`)
3. `clue-broadcast-file` + `clue-backup-take` → edited from earlier (`flag_edited_broadcast`)
4. `clue-sponsor-ledger` + `clue-email-draft` → motive (`flag_motive_finance`)
5. `clue-workstation-cache` + `clue-auto-queue` → Luo operated (`flag_luo_operated`)
6. `clue-access-log` + `clue-hidden-disc` → disc trail (`flag_disc_trail`)
7. `clue-waveform-cut` + `clue-outro-export` → edit corroboration
8. `clue-terminal-login` + `clue-access-log` → access opportunity
9. `clue-fake-invoice` + `clue-sponsor-ledger` → fraud corroboration
10. `clue-master-key` + `clue-lobby-receipt` → no useful link (red herring)

---

## 8. Timeline Events (correct order)

1. `evt-record-outro` — 许知微录制备用结束语
2. `evt-confrontation` — 许知微与罗景舟发生对质
3. `evt-incapacitate` — 冲突中许知微昏迷
4. `evt-lock-take-disc` — 罗景舟锁闭内室并取走资料盘
5. `evt-edit-schedule` — 罗景舟剪辑录音并修改自动播出队列
6. `evt-lobby-alibi` — 罗景舟前往大堂制造不在场记录
7. `evt-fake-broadcast` — 00:13 伪造音频自动播出
8. `evt-discovery` — 实习生和保安发现许知微

No event depends on `timelineSolved`.

---

## 9. Deduction

| Dimension                       | Correct ID                                                      |
| ------------------------------- | --------------------------------------------------------------- |
| Person                          | `char-luo-jingzhou`                                             |
| Motive                          | `motive-cover-embezzlement`                                     |
| Method                          | `method-incapacitate-fake-live`                                 |
| Required evidence (example set) | `clue-auto-queue`, `clue-email-draft`, `clue-workstation-cache` |

**Endings**

| ID                   | Condition                 | Summary                              |
| -------------------- | ------------------------- | ------------------------------------ |
| `ending-full-reveal` | minRank A                 | Full proof; Xu saved; disc recovered |
| `ending-partial`     | personCorrect + minRank C | Luo investigated; chain incomplete   |
| `ending-wrong-trail` | personCorrect false       | Wrong suspect; truth delayed         |

---

## 10. Flags

`flag_not_live`, `flag_early_recording`, `flag_edited_broadcast`, `flag_motive_finance`, `flag_luo_operated`, `flag_disc_trail`, `flag_luo_alibi_claimed`, `flag_tang_absent`, `flag_he_suspected`, `flag_xia_opened_up`

---

## 11. Fair-Play Checklist

- [x] Truth fixed before clue writing
- [x] No supernatural / unverifiable AI deepfake as the answer
- [x] Culprit interviewable early
- [x] Critical conclusions backed by corroborating pairs
- [x] Red herring (master key) explainable
- [x] Timeline events unlockable before `timelineSolved`
