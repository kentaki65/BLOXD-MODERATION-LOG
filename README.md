----
<h1 align="center">🛡️ BloxdModerationLog</h1>
<h3 align="center"><em>
This is an audit logging system for Bloxd server administrators<br>
which lets you trace what happened, who did it and when.
</em></h3>
<p align="center">
A moderation and auditing tool for Bloxd servers that records and persists
player actions and block operations. It is designed to help investigate and
deter abusive or malicious behavior.
</p>

----


## 📱Contact / Support
- If you have any questions or need help, please contact me on Discord:  
  **Discord:** `initial_ki`

## 🔩Main Features
- Recording player activity logs
- Tracking block operation history
- Inspector mode (instant investigation)

## 📦️Installation
Copy and paste the [main code](https://github.com/kentaki65/BLOXD-MODERATION-LOG/blob/main/src/maincode_minified.js) into the world code.
> Want to modify it? [Here's](https://github.com/kentaki65/BLOXD-MODERATION-LOG/blob/main/src/maincode_original.js) the original source code.
## CONFIG
```js
const config = {
  SERVER_LOGS_PER_MESSAGE: 5,
  BLOCK_LOGS_PER_MESSAGE: 3,
  PREVENT_CHANGE_BY_EXPLOSIVE: true,
  SAVE_CHANGE_BY_WORLD: false,
  SAVE_DATA_CHANGED_BY_WORLD: true,
  SAVE_DATA_CHANGED_BY_PLAYER: true,
  MAX_BLOCK_HISTORY: 5,
  INSPECT_SHOW_NEWEST_FIRST: true,
  ENABLE_LOGGING: true,
  SEARCH_TIMEOUT: 1000,
  ALLOW_LIST: ["5hFYzhrL29VWQHxYvaAHe"]
};
```
| Name | Description | Recommended |
| ------------- | ------------- | ------------- |
| SERVER_LOGS_PER_MESSAGE | Number of server log entries sent in a single message | 2 ~ 5 |
| BLOCK_LOGS_PER_MESSAGE | Number of block log entries sent in a single message | 2 ~ 4 |
| PREVENT_CHANGE_BY_EXPLOSIVE | If true, prevents world changes caused by explosives by default | true |
| SAVE_CHANGE_BY_WORLD | Whether to record block changes caused by the world | true |
| SAVE_DATA_CHANGED_BY_WORLD | Whether to store world-caused block changes in block data | false |
| SAVE_DATA_CHANGED_BY_PLAYER | Whether to store player-caused block changes in block data | true |
| MAX_BLOCK_HISTORY | Maximum number of history entries temporarily stored in a block (older entries are automatically discarded) | 4 ~ 8 |
| INSPECT_SHOW_NEWEST_FIRST | Whether to display the newest history entry first when inspecting a block | true |
| ENABLE_LOGGING | Enables or disables log recording | true |
| SEARCH_TIMEOUT | Maximum execution time (timeout) for log search processing. Specify in milliseconds | 1000 |
| ALLOW_LIST | List of **DBIDs** allowed to use the commands | [any] |


[^1]:指定時間を超えると、検索途中でも処理を中断します<br>その場合、**見つかった分までのログのみが表示されます**<br>検索結果が少ない／途中で止まる場合は、値を増やしてください

> [!WARNING]
> Setting values too high may cause increased server load and slower response times.

----
## ⚙️ Commands
### 🔍 `/bml inspect`
- Toggles Inspector Mode ON / OFF

| Argument | Description | Recommended |
| ------------- | ------------- | ------------- |
| None | None | None |

---
### 📝 `/bml log <page> <player> <type> <time> <keyword>`
- Outputs server logs from storage that match the specified conditions.
- All arguments are optional.

| Argument | Description | Example |
| ------------- | ------------- | ------------- |
| `<page>` | Page number to display (defaults to the first page if omitted) | 1 |
| `<player>` | Player name or DBID. Use `*` for all players | kentaki_js |
| `<type>` | Log type: `join` / `chat` or `*` (all) | chat |
| `<time>` | Time filter: `after:YYYY-MM-DD` / `before:YYYY-MM-DD` | after:2026-01-01 |
| `<keyword>` | Filter by keyword contained in the message | hello |

### ❓ Examples:
#### `/bml log * * join`
- Outputs player join records.

#### `/bml log * * * * hello`
- Outputs chat logs containing the message "hello".

#### `/bml log * kentaki_js chat after:2025-12-31 *`
- Outputs chat logs from player `kentaki_js` starting from 2025-12-31.

---
### 🧱 `/bml block <page> <player> <type> <time> <keyword>`
- Outputs block change logs from storage that match the specified conditions.
- All arguments are optional.

| Argument | Description | Example |
| ------------- | ------------- | ------------- |
| `<page>` | Page number to display (defaults to the first page if omitted) | 1 |
| `<player>` | Specify a player name or DBID.[^2] Use `*` for all players | kentaki_js |
| `<type>` | Action type: `place` / `break` / `update` or `*` (all) | place |
| `<time>` | Time filter: `after:YYYY-MM-DD` / `before:YYYY-MM-DD` or `*` (no filter) | after:2026-01-01 |
| `<keyword>` | Filter by block name. Must be wrapped in double quotes.[^3] Use `*` for no filter | "Grass Block" |

[^2]: Exact match  
[^3]: Partial matches are also supported

### Action Type List
| Value | Description |
|------|------|
| place | Block placement |
| break | Block destruction |
| update | Block update (e.g. Code Blocks) |
| * | All actions |

### ❓ Examples:
#### `/bml block * * * * "Chest"`
- Finds players who placed or broke a chest and outputs the corresponding block change logs.

#### `/bml block 1 * break * *`
- Outputs block change logs for players who broke blocks.

#### `/bml block * * update * "Code"`
- Finds players who updated Code Blocks and outputs the block change logs.

> [!WARNING]
> This command can only be used by players allowed in `ALLOW_LIST`.

----
## 🔍 Inspector Mode
Inspector Mode is an interactive mode for inspecting blocks and logs.
Unlike regular search commands, it is designed for **quickly checking the most recent events** and understanding the current situation.

### Main Use Cases
- Immediate confirmation of griefing or suspicious behavior
- Checking the history of a specific location or block
- Visually reviewing logs while investigating an incident

### 🧪 Features
- **Prioritizes the latest logs**  
  → In Inspector Mode, the most recent logs are displayed first  
  (depends on the `INSPECT_SHOW_NEWEST_FIRST` setting)
- **Fast inspection using temporary logs**  
  → Uses *temporary history stored in block data*, making it much faster than searching the entire storage
- **Designed for real-time checks**  
  → Best suited for seeing *what just happened*, not for long-term history analysis

### 🧩 How to Use
First, enable Inspector Mode using  
[this command](https://github.com/kentaki65/BLOXD-MODERATION-LOG/edit/main/%E6%97%A5%E6%9C%AC%E4%BA%BA%E5%90%91%E3%81%91.md#bml-inspect).

Then, simply **break the block you want to inspect**.
- The block is **not actually destroyed**
- Instead, the **change history (logs) stored in that block** will be displayed in chat

### ⚠️ Notes
- Logs shown in Inspector Mode are **only the temporary history stored in the block**
- Older logs may be lost once `MAX_BLOCK_HISTORY` is exceeded
- To search **all past logs**, use the  
  [`/bml block`](https://github.com/kentaki65/BLOXD-MODERATION-LOG/edit/main/%E6%97%A5%E6%9C%AC%E4%BA%BA%E5%90%91%E3%81%91.md#bml-block-page-player-type-time-keyword) command instead

## Credits
- Modified and used **bim** originally developed by **Ocelote**  
  Original source: https://rentry.co/2kcfyvmv
- Uses the scheduler developed by **NlGBOB**  
  GitHub: https://github.com/NlGBOB/bloxd-scheduler
- Thank you for creating such powerful tools!

> [!TIP]
> **Want to check ongoing griefing right now?** → Inspector Mode  
> **Want to search past logs with conditions?** → `/bml log` / `/bml block`

