# editTraits.js — Full Manual

Post-generation metadata editor for the MixFits NFT engine.
Reads `build/json/_metadata.json`, finds NFTs matching your search conditions, applies trait operations, then writes the result back.

---

## Usage

```bash
node src/scripts/editTraits.js [search flags] [operation flags] [--dry-run]
```

Always run with `--dry-run` first to preview changes before writing.

---

## How It Works

1. Search flags define which NFTs to target
2. Operation flags define what to do to those NFTs
3. Global ops apply to every matched NFT
4. Group ops apply to a randomly selected subset of matched NFTs
5. Multiple operations can be combined freely in one command
6. Every run auto-backs up `_metadata.json` → `_metadata.json.bak` before writing

---

## Flag Reference

---

### `--dry-run`

Preview all changes without writing any files. Print every affected NFT and its new traits.

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --delete "Eyes" \
  --dry-run
```

---

## Search Flags

Search flags define which NFTs are targeted. All conditions are evaluated with AND logic — every condition must match for an NFT to be included.

---

### `--search "TraitType=Value"`

Match NFTs where the trait equals an exact value.

**Format:** `"TraitType=Value"`

```bash
# Target all Homo Sapien NFTs
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --random "Background=Dark,Light,Sky,Void,Wine"
```

Multiple `--search` flags narrow the match further (AND logic):

```bash
# Target Homo Sapiens that also have a Hair trait
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --search "Hair=exists" \
  --random "Shirt=Red Hoodie,Snow Jacket,Bloe Hoodie"
```

---

### `--search "TraitType=exists"`

Match NFTs where the trait is present at all, regardless of value.

**Format:** `"TraitType=exists"`

```bash
# Target all NFTs that have any Hat
node src/scripts/editTraits.js \
  --search "Hats=exists" \
  --random "Hair=Low Cut,Low Cut II,Clean Shave"
```

```bash
# Target NFTs that have both a Hat AND a Special
node src/scripts/editTraits.js \
  --search "Hats=exists" \
  --search "Special=exists" \
  --set "Background=Void"
```

---

### `--search-or "TraitType=Val1,Val2,Val3"`

Match NFTs where the trait equals any of the listed values (OR within the trait).

**Format:** `"TraitType=Value1,Value2,Value3"`

```bash
# Target all NFTs wearing any full-body suit
node src/scripts/editTraits.js \
  --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
  --random "Hair=Low Cut,Fade,Clean Shave"
```

Multiple `--search-or` flags are ANDed together:

```bash
# Target NFTs wearing a suit AND wearing a rare hat (both must match)
node src/scripts/editTraits.js \
  --search-or "Shirt=Croc Suit,Ninja Outfit,Panda Suit" \
  --search-or "Hats=King Crown,Grand Mage Hat,Wizard Hat" \
  --set "Background=Void"
```

Mix `--search` and `--search-or` freely:

```bash
# Target Zombies wearing any suit
node src/scripts/editTraits.js \
  --search "Body=Zombie" \
  --search-or "Shirt=Croc Suit,Ninja Outfit,Panda Suit" \
  --delete "Special"
```

---

## Global Operation Flags

Apply to every NFT in the matched set.

---

### `--set "TraitType=Value"`

Set a trait to a fixed value on all matched NFTs.
If the trait does not exist on an NFT it is added.

**Format:** `"TraitType=Value"`

```bash
# Set Background to Void for all King Slimes
node src/scripts/editTraits.js \
  --search "Body=King Slime" \
  --set "Background=Void"
```

```bash
# Set multiple traits at once
node src/scripts/editTraits.js \
  --search "Body=King Slime" \
  --set "Background=Void" \
  --set "Special=Slime Crown"
```

Set to null (blank value):

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --set "Special=null"
```

---

### `--random "TraitType=Val1,Val2,Val3"`

Set a trait to a random value from the list.
Each NFT rolls independently. Adds the trait if it does not exist.

**Format:** `"TraitType=Value1,Value2,Value3"`

```bash
# Randomize Hair for every NFT that has a Hat
node src/scripts/editTraits.js \
  --search "Hats=exists" \
  --random "Hair=Low Cut,Low Cut II,Clean Shave"
```

```bash
# Randomize two traits independently on all matches
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --random "Hair=Low Cut,Fade,Clean Shave" \
  --random "Background=Dark,Light,Sky,Void,Wine"
```

---

### `--rename "OldType>NewType=Value"`

Replace a trait type with a new type and set a fixed value.
The new trait is inserted at the same position as the old one.
If the old trait does not exist the new trait is appended.

**Format:** `"OldTraitType>NewTraitType=Value"`

```bash
# Rename Shirt to Outfit and set it to Knight
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --rename "Shirt>Outfit=Knight"
```

---

### `--rename-random "OldType>NewType=Val1,Val2,Val3"`

Replace a trait type with a new type and set a random value from the list.
Position is preserved the same as `--rename`.

**Format:** `"OldTraitType>NewTraitType=Value1,Value2,Value3"`

```bash
# Rename Shirt to Outfit with a random value
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --rename-random "Shirt>Outfit=Knight,Tux,Lab Coat,Monk Robe"
```

Rename in place (same type, new random values):

```bash
# Change Shirt values randomly without renaming the type
node src/scripts/editTraits.js \
  --search "Body=Zombie" \
  --rename-random "Shirt>Shirt=Red Hoodie,Snow Jacket,Biker Jacket"
```

---

### `--delete "TraitType"`

Remove the entire trait from all matched NFTs regardless of its value.

**Format:** `"TraitType"`

```bash
# Remove Eyes from all King Slimes
node src/scripts/editTraits.js \
  --search "Body=King Slime" \
  --delete "Eyes"
```

Delete multiple traits in one command:

```bash
# Strip all clothing and accessories from Stoner NFTs
node src/scripts/editTraits.js \
  --search "Body=Stoner" \
  --delete "Eyes" \
  --delete "Hair" \
  --delete "Hats" \
  --delete "Pants" \
  --delete "Shirt" \
  --delete "Footwear" \
  --delete "Special"
```

---

### `--delete "TraitType=Value"`

Remove a trait only if its current value matches exactly.
If the value does not match the trait is left untouched.

**Format:** `"TraitType=Value"`

```bash
# Remove Eyes only if the value is Laser
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --delete "Eyes=Laser"
```

```bash
# Remove Special only if it is Slime Crown
node src/scripts/editTraits.js \
  --search "Body=Blue Slime" \
  --delete "Special=Slime Crown"
```

---

## Group Operation Flags

Group ops apply to the same N randomly selected NFTs from the match set.
All `--group-*` flags that follow a `--group-n` share the same randomly picked NFTs.

---

### `--group-n N`

Declare a group and set its size. Must come before any `--group-*` operation flags.
Use `--group-n` again to start a second independent group.

**Format:** `N` (positive integer)

---

### `--group-set "TraitType=Value"`

Same as `--set` but scoped to the group's N NFTs.

```bash
# Give exactly 200 randomly chosen Homo Sapiens a fixed Background
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 200 \
  --group-set "Background=Void"
```

---

### `--group-random "TraitType=Val1,Val2,Val3"`

Same as `--random` but scoped to the group's N NFTs.

```bash
# Give 500 randomly chosen Homo Sapiens a random Hair
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 500 \
  --group-random "Hair=Low Cut,Low Cut II,Clean Shave"
```

Multiple `--group-random` flags after the same `--group-n` target the SAME 500 NFTs:

```bash
# Give the same 500 NFTs BOTH a random Hair AND a random Hat
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 500 \
  --group-random "Hair=Low Cut,Fade,Clean Shave" \
  --group-random "Hats=Baby Propeller Hat,King Crown,Wizard Hat,Pirate Hat"
```

---

### `--group-rename "OldType>NewType=Value"`

Same as `--rename` but scoped to the group's N NFTs.

```bash
# Rename Shirt to Outfit with a fixed value for 300 randomly chosen NFTs
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 300 \
  --group-rename "Shirt>Outfit=Knight"
```

---

### `--group-rename-random "OldType>NewType=Val1,Val2,Val3"`

Same as `--rename-random` but scoped to the group's N NFTs.

```bash
# Rename Hair to HairStyle with random values for 400 NFTs
node src/scripts/editTraits.js \
  --search "Body=Zombie" \
  --group-n 400 \
  --group-rename-random "Hair>HairStyle=Low Cut,Fade,Clean Shave,Crew Cut"
```

---

### `--group-delete "TraitType"`

Same as `--delete "TraitType"` but scoped to the group's N NFTs.

```bash
# Delete Special from only 100 randomly chosen Homo Sapiens
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 100 \
  --group-delete "Special"
```

---

### `--group-delete "TraitType=Value"`

Same as `--delete "TraitType=Value"` but scoped to the group's N NFTs.

```bash
# Remove Laser eyes from 50 randomly chosen Homo Sapiens only
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 50 \
  --group-delete "Eyes=Laser"
```

---

## Multiple Groups

Each `--group-n` starts a fresh independent group with its own random selection.
The two groups may overlap — they are selected independently.

```bash
# Group 1: 500 get random Hats
# Group 2: 200 (independent selection) get random Shirts
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 500 \
  --group-random "Hats=King Crown,Wizard Hat,Pirate Hat,Police Hat" \
  --group-n 200 \
  --group-random "Shirt=Knight,Tux,Lab Coat,Monk Robe"
```

---

## Mixing Global and Group Ops

Global ops run on every match. Group ops run only on the selected N.
Both can be used in the same command.

```bash
# Set Background for ALL matches
# Give only 300 of them a random Hat on top
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --set "Background=Void" \
  --group-n 300 \
  --group-random "Hats=King Crown,Wizard Hat,Turban"
```

```bash
# Randomize Hair globally
# Rename Shirt to Outfit with a random value for 400 of them
# Delete Special from all
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --random "Hair=Low Cut,Fade,Clean Shave" \
  --delete "Special" \
  --group-n 400 \
  --group-rename-random "Shirt>Outfit=Knight,Tux,Lab Coat,Monk Robe"
```

---

## Complete Combination Examples

### 1. Fix Hair on all suit-wearing NFTs

```bash
node src/scripts/editTraits.js \
  --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
  --random "Hair=Low Cut,Fade,Clean Shave"
```

### 2. Strip all traits from a body type

```bash
node src/scripts/editTraits.js \
  --search "Body=Stoner" \
  --delete "Eyes" \
  --delete "Hair" \
  --delete "Hats" \
  --delete "Pants" \
  --delete "Shirt" \
  --delete "Footwear" \
  --delete "Special"
```

### 3. Find suits worn by Zombies, delete their Special

```bash
node src/scripts/editTraits.js \
  --search "Body=Zombie" \
  --search-or "Shirt=Croc Suit,Ninja Outfit,Panda Suit,Shark Suit" \
  --delete "Special"
```

### 4. Give 500 Homo Sapiens both a random Hair and a random Hat (same 500)

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 500 \
  --group-random "Hair=Low Cut,Low Cut II,Clean Shave,Fade" \
  --group-random "Hats=Baby Propeller Hat,King Crown,Wizard Hat,Pirate Hat,Police Hat"
```

### 5. Search by existence, update a related trait

```bash
node src/scripts/editTraits.js \
  --search "Hats=exists" \
  --search "Body=Homo Sapien" \
  --random "Hair=Low Cut,Low Cut II,Clean Shave"
```

### 6. Multi-group: two different subsets get different operations

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --group-n 500 \
  --group-random "Hats=King Crown,Wizard Hat,Pirate Hat" \
  --group-n 200 \
  --group-random "Shirt=Knight,Tux,Lab Coat"
```

### 7. Global + group + delete combined

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --set "Background=Dark" \
  --delete "Special" \
  --group-n 300 \
  --group-random "Hair=Low Cut,Fade,Clean Shave" \
  --group-random "Hats=King Crown,Wizard Hat,Police Hat"
```

### 8. Rename trait type across the whole collection for one body type

```bash
node src/scripts/editTraits.js \
  --search "Body=Zombie" \
  --rename-random "Shirt>Outfit=Red Hoodie,Snow Jacket,Biker Jacket,Bloe Hoodie"
```

### 9. Delete a specific trait value only (leave other values intact)

```bash
node src/scripts/editTraits.js \
  --search "Body=Homo Sapien" \
  --delete "Eyes=Laser"
```

### 10. Full real-world pipeline example

```bash
# Step 1 — preview
node src/scripts/editTraits.js \
  --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
  --random "Hair=Low Cut,Fade,Clean Shave" \
  --delete "Special" \
  --group-n 100 \
  --group-random "Hats=King Crown,Wizard Hat,Police Hat,Pirate Hat" \
  --dry-run

# Step 2 — apply when satisfied
node src/scripts/editTraits.js \
  --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
  --random "Hair=Low Cut,Fade,Clean Shave" \
  --delete "Special" \
  --group-n 100 \
  --group-random "Hats=King Crown,Wizard Hat,Police Hat,Pirate Hat"
```

---

## Rules and Gotchas

| Rule | Detail |
|---|---|
| No spaces after commas | `Val1,Val2,Val3` not `Val1, Val2, Val3` |
| Each trait needs its own `--delete` | `--delete "Eyes" --delete "Hair"` not `--delete "Eyes,Hair"` |
| `--group-*` must follow `--group-n` | The script errors if a group op has no preceding `--group-n` |
| Group N > match count | Silently capped at total matches — no error |
| `--search-or` for single value | Use `--search` instead — it is cleaner for one value |
| Backup location | `build/json/_metadata.json.bak` — overwritten on every live run |
| DNA is recalculated | Every modified NFT gets a fresh `dna` hash and updated `date` |
| Individual JSON files updated | `build/json/{edition}.json` is also updated for each changed NFT |

---

## Output

After a live run the script prints:

```
📦 Backup → _metadata.json.bak
✅ _metadata.json updated.
✅ 312 individual JSON files updated.
🏁 Done.
```

Files written:

| File | Description |
|---|---|
| `build/json/_metadata.json` | Full collection metadata, updated |
| `build/json/_metadata.json.bak` | Backup of previous state |
| `build/json/{edition}.json` | Individual file for each modified NFT |